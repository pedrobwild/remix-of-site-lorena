/**
 * SiteAssistant: botão flutuante "Dúvidas? Pergunte aqui", que leva à /faq —
 * lá ficam as perguntas do banco do assistente (`assistant_kb`) e a pergunta
 * livre respondida na hora.
 *
 * - Navegação pela SPA (`navigate`), sem recarregar a página; Ctrl/⌘+clique
 *   e botão do meio continuam abrindo em nova aba (é um <a href> de verdade).
 * - Some na própria /faq (lá ele só recarregaria a página) e nas rotas de
 *   HIDDEN_SEGMENTS.
 * - Fica no canto inferior direito e sobe acima dos elementos fixos do rodapé
 *   da tela (banner de cookies, barra "Solicitar orçamento" do celular...).
 *   A medição é por evento — ResizeObserver nesses elementos, MutationObserver
 *   para saber quando entram/saem do DOM, resize da janela e fim de animação —
 *   e nunca por polling: a versão anterior fazia 15 `elementsFromPoint` +
 *   `getComputedStyle` a cada 900 ms em toda página pública.
 * - Não abre sozinho, não mostra balões automáticos e não toca som.
 * - Ligado por ASSISTANT_ENABLED (src/config/site.ts). Com a flag desligada,
 *   só aparece para quem abre o site com ?assistente=1 (teste interno).
 */
import { useEffect, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { trackEvent } from "@/lib/ga4";
import { navigate } from "@/lib/useHashRoute";
import { ASSISTANT_ENABLED, MAINTENANCE_MODE } from "@/config/site";
import "./site-assistant.css";

const FAQ_PATH = "/faq";
const HIDDEN_SEGMENTS = new Set(["admin", "diagnostico", "o", "p", "bakeoff", "mockups", "faq"]);
const FLAG_KEY = "bw_assistente";

/**
 * Elementos fixos no rodapé da tela que o botão não pode cobrir. A barra do
 * guia do investidor é feita com utilitários Tailwind (`fixed bottom-0`);
 * qualquer elemento novo pode se declarar com `data-bottom-obstacle`.
 */
const OBSTACLE_SELECTOR = ".cookie-banner, .bwa-mobile-cta, .fixed.bottom-0, [data-bottom-obstacle]";

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

/** Caminho atual, acompanhando a navegação da SPA (`navigate`) e o Voltar. */
function useCurrentPath(getPath: () => string): string {
  const [path, setPath] = useState(getPath);
  useEffect(() => {
    const sync = () => setPath(getPath());
    sync();
    // O roteador corrige a URL na partida com replaceState, sem evento
    // (`/#/faq` legado → `/faq`, `/blog/*` → `/conteudos/*`), num efeito que
    // roda depois deste: relê o caminho quando os efeitos da montagem acabam.
    const afterMount = window.setTimeout(sync, 0);
    window.addEventListener("popstate", sync);
    window.addEventListener("lovable:navigate", sync);
    return () => {
      window.clearTimeout(afterMount);
      window.removeEventListener("popstate", sync);
      window.removeEventListener("lovable:navigate", sync);
    };
  }, [getPath]);
  return path;
}

/**
 * Altura ocupada, a partir da borda inferior da tela, pelos elementos de
 * OBSTACLE_SELECTOR visíveis e ancorados no rodapé.
 */
function useBottomObstacle(active: boolean): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!active) return;
    let tracked: Element[] = [];
    let measureFrame = 0;
    let scanFrame = 0;

    const measure = () => {
      measureFrame = 0;
      const h = window.innerHeight;
      let top = h;
      for (const el of tracked) {
        const r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) continue; // display: none
        if (r.bottom < h - 120 || r.height > h * 0.6) continue; // não está no rodapé
        const cs = window.getComputedStyle(el);
        if (cs.visibility === "hidden" || Number(cs.opacity) <= 0.05) continue;
        top = Math.min(top, r.top);
      }
      const next = top < h ? Math.max(0, Math.round(h - top)) : 0;
      setOffset((prev) => (prev === next ? prev : next));
    };
    const scheduleMeasure = () => {
      if (!measureFrame) measureFrame = window.requestAnimationFrame(measure);
    };

    const resize = typeof ResizeObserver !== "undefined" ? new ResizeObserver(scheduleMeasure) : null;
    const scan = () => {
      scanFrame = 0;
      const found = Array.from(document.querySelectorAll(OBSTACLE_SELECTOR));
      const same = found.length === tracked.length && found.every((el, i) => el === tracked[i]);
      if (same) return;
      resize?.disconnect();
      tracked = found;
      tracked.forEach((el) => resize?.observe(el));
      scheduleMeasure();
    };
    const scheduleScan = () => {
      if (!scanFrame) scanFrame = window.requestAnimationFrame(scan);
    };
    // Banner de cookies entra com translateY: mede de novo quando assenta.
    const onMotionEnd = (e: Event) => {
      if (e.target instanceof Element && tracked.includes(e.target)) scheduleMeasure();
    };

    const mutations = new MutationObserver(scheduleScan);
    mutations.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", scheduleMeasure);
    document.addEventListener("animationend", onMotionEnd, true);
    document.addEventListener("transitionend", onMotionEnd, true);
    scan();
    scheduleMeasure();

    return () => {
      mutations.disconnect();
      resize?.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
      document.removeEventListener("animationend", onMotionEnd, true);
      document.removeEventListener("transitionend", onMotionEnd, true);
      if (measureFrame) window.cancelAnimationFrame(measureFrame);
      if (scanFrame) window.cancelAnimationFrame(scanFrame);
    };
  }, [active]);

  return active ? offset : 0;
}

type Props = {
  /** Só para testes e protótipos: permite simular o caminho atual. */
  getPath?: () => string;
};

export default function SiteAssistant({ getPath = currentPath }: Props = {}) {
  const [enabled] = useState(flagOn);
  const path = useCurrentPath(getPath);
  const visible = enabled && !MAINTENANCE_MODE && !isHiddenPath(path);
  const obstacle = useBottomObstacle(visible);

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

  const goToFaq = (event: MouseEvent<HTMLAnchorElement>) => {
    trackEvent("assistant_open", { path, destino: FAQ_PATH });
    // Nova aba / janela: deixa o navegador agir.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(FAQ_PATH);
  };

  if (!visible) return null;

  return createPortal(
    <div
      className="bwas"
      style={{
        ["--bwas-offset" as string]: `${obstacle}px`,
        ["--bwas-base" as string]: obstacle > 0 ? "12px" : "calc(20px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <a href={FAQ_PATH} className="bwas-launcher" onClick={goToFaq}>
        <svg className="bwas-launcher-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
        <span className="bwas-launcher-long">Dúvidas? Pergunte aqui</span>
        <span className="bwas-launcher-short">Dúvidas</span>
      </a>
    </div>,
    document.body,
  );
}
