/**
 * SiteAssistant: assistente de dúvidas do site (sem IA generativa).
 *
 * - Respostas vêm da tabela `assistant_kb`, carregada só quando o visitante
 *   abre o assistente (nada pesa no carregamento da página).
 * - O motor (src/lib/assistant/assistantEngine.ts) roda no navegador.
 * - Não abre sozinho, não mostra balões automáticos e não toca som.
 * - Fica no canto inferior direito e sobe automaticamente acima de qualquer
 *   elemento fixo no rodapé da tela (banner de cookies, barra "Solicitar
 *   orçamento" do celular, card de orçamento), para nunca cobri-los.
 * - Acessibilidade (WCAG 2.2 AA): botão com nome visível, aria-expanded,
 *   diálogo rotulado, Esc fecha e devolve o foco, conversa em role="log",
 *   alvo mínimo de 44 px, foco visível, tela cheia com foco preso e fundo
 *   inerte no celular, respeito a prefers-reduced-motion e forced-colors.
 * - Ligado por ASSISTANT_ENABLED (src/config/site.ts). Com a flag desligada,
 *   só aparece para quem abre o site com ?assistente=1 (teste interno).
 */
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import { whatsappHref } from "@/components/landing/content";
import { trackEvent } from "@/lib/ga4";
import { isConsentAccepted } from "@/lib/cookieConsent";
import { useHashRoute } from "@/lib/useHashRoute";
import { ASSISTANT_ENABLED, MAINTENANCE_MODE } from "@/config/site";
import {
  maskPII,
  reply,
  suggestionsForPath,
  type KbAction,
  type KbItem,
} from "@/lib/assistant/assistantEngine";
import "./site-assistant.css";

type Msg = { id: number; from: "bot" | "user"; text: string; acoes?: KbAction[] };

const HIDDEN_SEGMENTS = new Set(["admin", "diagnostico", "o", "p", "bakeoff", "mockups"]);
const STORE_KEY = "bw_assistente_conversa";
const FLAG_KEY = "bw_assistente";
const GREETING =
  "Oi! Sou o assistente da Bewild. Respondo as dúvidas mais comuns sobre reforma, prazo e orçamento. Escolha uma pergunta abaixo ou escreva a sua.";
const LOAD_ERROR =
  "Não consegui carregar as respostas agora. A equipe responde pelo WhatsApp, com a sua pergunta já escrita.";

function flagOn(): boolean {
  if (typeof window === "undefined") return false;
  if (ASSISTANT_ENABLED) return true;
  try {
    const q = new URLSearchParams(window.location.search).get("assistente");
    if (q === "1") window.sessionStorage.setItem(FLAG_KEY, "1");
    if (q === "0") window.sessionStorage.removeItem(FLAG_KEY);
    return window.sessionStorage.getItem(FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

function currentPath(): string {
  if (typeof window === "undefined") return "/";
  return (window.location.pathname || "/").replace(/\/+$/, "") || "/";
}

function isHiddenPath(path: string): boolean {
  const seg = path.split("/")[1] || "";
  return HIDDEN_SEGMENTS.has(seg);
}

function loadStored(): Msg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORE_KEY);
    const arr = raw ? (JSON.parse(raw) as Msg[]) : [];
    return Array.isArray(arr) ? arr.slice(-30) : [];
  } catch {
    return [];
  }
}

function useCompactLayout(): boolean {
  const query = "(max-width: 767px), (max-height: 560px)";
  const [compact, setCompact] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setCompact(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return compact;
}

/**
 * Altura ocupada por elementos fixos perto do rodapé, na faixa onde o botão
 * fica (banner de cookies, barra "Solicitar orçamento" do celular, card de
 * orçamento...). Amostra pontos dessa faixa, ignora o próprio assistente e
 * considera só elementos com position: fixed ancorados perto do rodapé.
 * Mede no máximo a cada 250 ms durante a rolagem e a cada 900 ms parado.
 */
function useBottomObstacle(selfRef: RefObject<HTMLElement>, active: boolean): number {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (!active) return;
    let timer = 0;
    let frame = 0;
    let last = 0;
    const measure = () => {
      frame = 0;
      last = Date.now();
      const w = window.innerWidth;
      const h = window.innerHeight;
      let top = h;
      const xs = [w - 30, w - 120, w - 220];
      const ys = [h - 8, h - 30, h - 60, h - 90, h - 120];
      for (const x of xs) {
        for (const y of ys) {
          if (x < 0 || y < 0) continue;
          for (const el of document.elementsFromPoint(x, y)) {
            if (selfRef.current && selfRef.current.contains(el)) continue;
            let n: HTMLElement | null = el as HTMLElement;
            while (n && n !== document.body && n !== document.documentElement) {
              const cs = window.getComputedStyle(n);
              if (cs.position === "fixed") {
                const r = n.getBoundingClientRect();
                const shown = cs.visibility !== "hidden" && Number(cs.opacity) > 0.05;
                if (shown && r.bottom >= h - 120 && r.height < h * 0.6 && r.top < top) top = r.top;
                break;
              }
              n = n.parentElement;
            }
          }
        }
      }
      const next = top < h ? Math.max(0, Math.round(h - top)) : 0;
      setOffset((prev) => (prev === next ? prev : next));
    };
    const schedule = () => {
      if (timer || frame) return;
      const wait = Math.max(0, 250 - (Date.now() - last));
      timer = window.setTimeout(() => {
        timer = 0;
        frame = window.requestAnimationFrame(measure);
      }, wait);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const interval = window.setInterval(schedule, 900);
    return () => {
      if (timer) window.clearTimeout(timer);
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.clearInterval(interval);
    };
  }, [active, selfRef]);
  return offset;
}

type Props = {
  /** Só para testes e protótipos: permite simular o caminho atual. */
  getPath?: () => string;
};

export default function SiteAssistant({ getPath = currentPath }: Props = {}) {
  const route = useHashRoute();
  const [enabled] = useState(flagOn);
  const [path, setPath] = useState(getPath);
  const [open, setOpen] = useState(false);
  const [kb, setKb] = useState<KbItem[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>(loadStored);
  const [chips, setChips] = useState<string[]>([]);
  const [text, setText] = useState("");
  const compact = useCompactLayout();

  const rootRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLAnchorElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const nextId = useRef(Date.now());
  const logged = useRef<Set<string>>(new Set());
  const errorShown = useRef(false);

  const uid = useId();
  const panelId = `bwas-panel-${uid}`;
  const titleId = `bwas-title-${uid}`;
  const descId = `bwas-desc-${uid}`;
  const inputId = `bwas-input-${uid}`;

  // Caminho atual acompanha a navegação da SPA.
  useEffect(() => {
    setPath(getPath());
  }, [route, getPath]);

  const visible = enabled && !MAINTENANCE_MODE && !isHiddenPath(path);
  const obstacle = useBottomObstacle(rootRef, visible);

  // Guarda a conversa só nesta aba (sessionStorage), sem dados no servidor.
  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORE_KEY, JSON.stringify(msgs.slice(-30)));
    } catch {
      /* storage indisponível: a conversa só não sobrevive ao recarregar */
    }
  }, [msgs]);

  // Sugestões da página atual.
  useEffect(() => {
    if (kb) setChips(suggestionsForPath(kb, path));
  }, [kb, path]);

  // Carrega o banco na primeira abertura.
  useEffect(() => {
    if (!open || kb || loadError) return;
    let alive = true;
    supabase
      .from("assistant_kb")
      .select(
        "id, tema, status, pergunta, resposta, gatilhos, palavras_fortes, palavras, exemplos, acoes, relacionadas, sugerir_em, ordem",
      )
      .eq("ativo", true)
      .order("ordem", { ascending: true })
      .then(
        ({ data, error }) => {
          if (!alive) return;
          if (error || !data || data.length === 0) {
            setLoadError(true);
            return;
          }
          setKb(data as unknown as KbItem[]);
        },
        () => {
          if (alive) setLoadError(true);
        },
      );
    return () => {
      alive = false;
    };
  }, [open, kb, loadError]);

  // Falha ao carregar o banco: avisa e oferece o WhatsApp (uma vez por tentativa).
  useEffect(() => {
    if (!open || !loadError || errorShown.current) return;
    errorShown.current = true;
    const here = getPath();
    setMsgs((m) => [
      ...m,
      {
        id: nextId.current++,
        from: "bot",
        text: LOAD_ERROR,
        acoes: [
          {
            tipo: "whatsapp",
            rotulo: "Falar no WhatsApp",
            url: whatsappHref(`Olá! Vim pelo site (${here}). Gostaria de tirar uma dúvida.`),
          },
        ],
      },
    ]);
  }, [open, loadError, getPath]);

  // Saudação na primeira abertura.
  useEffect(() => {
    if (open && msgs.length === 0) {
      setMsgs([{ id: nextId.current++, from: "bot", text: GREETING }]);
    }
  }, [open, msgs.length]);

  // Foco: ao abrir vai para o campo (desktop) ou para o título (celular,
  // para não abrir o teclado sozinho); ao fechar volta para o botão.
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      const t = window.setTimeout(() => {
        if (compact) titleRef.current?.focus({ preventScroll: true });
        else inputRef.current?.focus({ preventScroll: true });
      }, 30);
      return () => window.clearTimeout(t);
    }
    if (wasOpen.current) {
      wasOpen.current = false;
      launcherRef.current?.focus({ preventScroll: true });
    }
    return undefined;
  }, [open, compact]);

  // Celular: tela cheia modal, fundo inerte e sem rolagem.
  useEffect(() => {
    if (!open || !compact) return;
    const appRoot = document.getElementById("root");
    const prevOverflow = document.body.style.overflow;
    appRoot?.setAttribute("inert", "");
    appRoot?.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "hidden";
    return () => {
      appRoot?.removeAttribute("inert");
      appRoot?.removeAttribute("aria-hidden");
      document.body.style.overflow = prevOverflow;
    };
  }, [open, compact]);

  // Evita que o botão flutuante esconda elementos focados perto do rodapé.
  useEffect(() => {
    if (!visible) return;
    const html = document.documentElement;
    const prev = html.style.scrollPaddingBottom;
    html.style.scrollPaddingBottom = `${96 + obstacle}px`;
    return () => {
      html.style.scrollPaddingBottom = prev;
    };
  }, [visible, obstacle]);

  // Rola a conversa para a última mensagem.
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, open]);

  // O botão flutuante leva para a página de FAQ (/faq), que lista as
  // perguntas e respostas do banco do assistente — o painel de conversa não
  // abre mais a partir do launcher.
  const goToFaq = useCallback(() => {
    trackEvent("assistant_open", { path: getPath(), destino: "/faq" });
  }, [getPath]);

  const closePanel = useCallback(() => setOpen(false), []);

  // Esc fecha mesmo quando o foco saiu do painel: depois de clicar numa
  // pergunta sugerida, o botão clicado é substituído pela nova lista e o foco
  // cai no body, onde o onKeyDown do painel não ouve.
  useEffect(() => {
    if (!open) return;
    const onDocKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      closePanel();
    };
    document.addEventListener("keydown", onDocKeyDown);
    return () => document.removeEventListener("keydown", onDocKeyDown);
  }, [open, closePanel]);

  const send = useCallback(
    (raw: string) => {
      const q = raw.trim().slice(0, 300);
      if (!q) return;
      const here = getPath();
      const userMsg: Msg = { id: nextId.current++, from: "user", text: q };
      if (!kb) {
        setMsgs((m) => [
          ...m,
          userMsg,
          {
            id: nextId.current++,
            from: "bot",
            text: LOAD_ERROR,
            acoes: [
              {
                tipo: "whatsapp",
                rotulo: "Falar no WhatsApp",
                url: whatsappHref(`Olá! Vim pelo site (${here}). Minha dúvida: ${q}`),
              },
            ],
          },
        ]);
        setText("");
        return;
      }
      const r = reply(q, kb, { path: here, pageItems: suggestionsForPath(kb, here), waHref: whatsappHref });
      setMsgs((m) => [...m, userMsg, { id: nextId.current++, from: "bot", text: r.texto, acoes: r.acoes }]);
      setChips(r.sugestoes.length ? r.sugestoes : suggestionsForPath(kb, here));
      setText("");
      trackEvent("assistant_question", { tipo: r.tipo, item: r.item?.id ?? "", path: here });
      // Pergunta sem resposta: registro anônimo, só com consentimento aceito.
      if (r.tipo === "sem_resposta" && isConsentAccepted()) {
        const masked = maskPII(q);
        if (!logged.current.has(masked) && logged.current.size < 10) {
          logged.current.add(masked);
          supabase
            .from("assistant_unanswered")
            .insert({ pergunta: masked, path: here.slice(0, 200) })
            .then(
              () => undefined,
              () => undefined,
            );
        }
      }
    },
    [kb, getPath],
  );

  // Pergunta sugerida: o botão clicado some da lista ao responder, então o
  // foco vai antes para o campo (desktop) ou para a conversa (celular, sem
  // abrir o teclado), em vez de se perder no body.
  const sendFromChip = useCallback(
    (question: string) => {
      (compact ? logRef : inputRef).current?.focus({ preventScroll: true });
      send(question);
    },
    [compact, send],
  );

  const onAction = useCallback((a: KbAction) => {
    trackEvent("assistant_action", { tipo: a.tipo, destino: a.tipo === "whatsapp" ? "whatsapp" : a.url ?? "" });
    // Link interno: a navegação acontece pelo interceptador global; o painel
    // fecha para mostrar a página (a conversa continua guardada).
    if (a.tipo === "link") setOpen(false);
  }, []);

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closePanel();
        return;
      }
      if (e.key !== "Tab" || !compact || !panelRef.current) return;
      // Celular (modal): mantém o foco dentro do painel.
      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [compact, closePanel],
  );

  if (!visible) return null;

  const byId = new Map((kb ?? []).map((k) => [k.id, k] as const));

  return createPortal(
    <div
      ref={rootRef}
      className={`bwas${compact ? " bwas--compact" : ""}`}
      style={{
        ["--bwas-offset" as string]: `${obstacle}px`,
        ["--bwas-base" as string]: obstacle > 0 ? "12px" : "calc(20px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {!open && (
        <a ref={launcherRef} href="/faq" className="bwas-launcher" onClick={goToFaq}>
          <svg className="bwas-launcher-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          <span className="bwas-launcher-long">Dúvidas? Pergunte aqui</span>
          <span className="bwas-launcher-short">Dúvidas</span>
        </a>
      )}

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          className="bwas-panel"
          role="dialog"
          aria-modal={compact ? "true" : "false"}
          aria-labelledby={titleId}
          aria-describedby={descId}
          onKeyDown={onKeyDown}
        >
          <div className="bwas-head">
            <div className="bwas-head-text">
              <p className="bwas-eyebrow">Assistente Bewild</p>
              <h2 id={titleId} ref={titleRef} className="bwas-title" tabIndex={-1}>
                Tire suas dúvidas
              </h2>
              <p id={descId} className="bwas-desc">
                Respostas automáticas preparadas pela equipe. Para falar com uma pessoa, use o WhatsApp.
              </p>
            </div>
            <button type="button" className="bwas-close" onClick={closePanel} aria-label="Fechar assistente">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" fill="none" />
              </svg>
            </button>
          </div>

          <div
            ref={logRef}
            className="bwas-log"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-label="Conversa com o assistente"
            tabIndex={0}
          >
            {msgs.map((m) => (
              <div key={m.id} className={`bwas-msg bwas-msg--${m.from}`}>
                <p className="bwas-bubble">
                  <span className="bwas-sr">{m.from === "bot" ? "Assistente: " : "Você: "}</span>
                  {m.text}
                </p>
                {m.acoes && m.acoes.length > 0 && (
                  <ul className="bwas-actions">
                    {m.acoes.map((a, i) => (
                      <li key={`${m.id}-${i}`}>
                        {a.tipo === "whatsapp" ? (
                          <a
                            className="bwas-action bwas-action--solid"
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => onAction(a)}
                          >
                            {a.rotulo}
                            <span className="bwas-sr"> (abre em nova aba)</span>
                            <span aria-hidden="true"> →</span>
                          </a>
                        ) : (
                          <a
                            className={`bwas-action${i === 0 ? " bwas-action--solid" : ""}`}
                            href={a.url}
                            onClick={() => onAction(a)}
                          >
                            {a.rotulo}
                            <span aria-hidden="true"> →</span>
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {open && !kb && !loadError && (
              <p className="bwas-status">Carregando respostas…</p>
            )}
          </div>

          {kb && chips.length > 0 && (
            <div className="bwas-chips" role="group" aria-label="Perguntas sugeridas">
              {chips.map((id) => {
                const it = byId.get(id);
                if (!it) return null;
                return (
                  <button key={id} type="button" className="bwas-chip" onClick={() => sendFromChip(it.pergunta)}>
                    {it.pergunta}
                  </button>
                );
              })}
            </div>
          )}

          <form
            className="bwas-form"
            onSubmit={(e) => {
              e.preventDefault();
              send(text);
            }}
          >
            <label htmlFor={inputId} className="bwas-sr">
              Escreva sua dúvida
            </label>
            <input
              ref={inputRef}
              id={inputId}
              className="bwas-input"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={300}
              autoComplete="off"
              enterKeyHint="send"
              placeholder="Escreva sua dúvida"
            />
            <button type="submit" className="bwas-send">
              Enviar
            </button>
          </form>
          <p className="bwas-foot">
            Assistente automático. Valores e condições finais vêm na proposta.
            {isConsentAccepted() && " Perguntas sem resposta são registradas sem dados pessoais para melhorar o assistente."}
          </p>
        </div>
      )}
    </div>,
    document.body,
  );
}
