/**
 * SiteAssistant: botão flutuante "Dúvidas? Pergunte aqui", que leva à /faq —
 * lá ficam as perguntas do banco do assistente (`assistant_kb`) e a pergunta
 * livre respondida na hora.
 *
 * - Navegação pela SPA (`navigate`), sem recarregar a página; Ctrl/⌘+clique
 *   e botão do meio continuam abrindo em nova aba (é um <a href> de verdade).
 * - Some na própria /faq (lá ele só recarregaria a página) e nas rotas de
 *   HIDDEN_SEGMENTS (./assistantPaths). No celular (site-assistant.css) também some em
 *   /orcamento (MOBILE_HIDDEN_SEGMENTS: a página é o formulário), com o menu
 *   aberto e com o teclado aberto (`data-bwa-typing`, de home-bwa-script.ts).
 * - No celular vira só o ícone, na mesma linha da barra "Solicitar
 *   orçamento" da home: a barra termina antes dele (`data-bwas` no <html>) e
 *   os dois sobem juntos acima do banner de cookies. A barra, por isso, não
 *   é obstáculo para ele.
 * - Fica no canto inferior direito e sobe acima dos elementos fixos do rodapé
 *   da tela (banner de cookies, barra do guia...), inclusive quando estão
 *   empilhados (ver bottomStack.ts).
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
import { COOKIE_BANNER_HEIGHT_VAR } from "@/components/CookieBanner";
import { isHiddenPath, isMobileHiddenPath } from "./assistantPaths";
import { bottomStackTop, type StackRect } from "./bottomStack";
import "./site-assistant.css";

const FAQ_PATH = "/faq";
const FLAG_KEY = "bw_assistente";
/**
 * No <html> enquanto o botão está na página: a barra do celular termina antes
 * dele e a página ganha folga de rolagem (site-assistant.css). Atributo, não
 * classe: trocar uma classe no <html> recalcula o estilo do documento inteiro
 * (MOB-03). Na carga direta ele já vem no HTML do servidor (RootShell, via
 * `assistantShowsOn` de ./assistantPaths), então a hidratação não escreve nada
 * no <html>.
 */
const ON_ATTR = "data-bwas";
/** Folga de rolagem para o botão, em px. Espelhada em site-assistant.css (`html[data-bwas]`). */
const SCROLL_PADDING_BASE = 96;

/**
 * Elementos fixos no rodapé da tela que o botão não pode cobrir. A barra do
 * guia do investidor é feita com utilitários Tailwind (`fixed bottom-0`);
 * qualquer elemento novo pode se declarar com `data-bottom-obstacle`. A
 * barra "Solicitar orçamento" da home não entra: fica ao lado do botão.
 */
const OBSTACLE_SELECTOR = ".cookie-banner, .fixed.bottom-0, [data-bottom-obstacle]";

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
      const rects: StackRect[] = [];
      for (const el of tracked) {
        const r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) continue; // display: none
        const cs = window.getComputedStyle(el);
        if (cs.visibility === "hidden" || Number(cs.opacity) <= 0.05) continue;
        rects.push({ top: r.top, bottom: r.bottom, height: r.height });
      }
      // Pilha a partir da borda de baixo: inclui a barra "Solicitar orçamento"
      // quando ela sobe acima do banner de cookies (ver bottomStack.ts).
      const top = bottomStackTop(rects, h);
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
  const hiddenOnMobile = isMobileHiddenPath(path);
  const obstacle = useBottomObstacle(visible);

  // Evita que o botão flutuante esconda elementos focados perto do rodapé.
  // O valor normal vem do CSS (`html[data-bwas]`: 96 px + a altura do banner de
  // cookies, pela variável que o próprio banner publica). Só há escrita no
  // <html> quando outro obstáculo PASSA dessa conta: cada escrita ali faz o
  // navegador recalcular o estilo do documento inteiro (MOB-03). Obstáculo
  // menor que o banner é o próprio banner ainda entrando na tela (ele sobe com
  // translateY) — a folga do CSS já cobre.
  useEffect(() => {
    if (!visible) return;
    const html = document.documentElement;
    const banner = Math.round(parseFloat(html.style.getPropertyValue(COOKIE_BANNER_HEIGHT_VAR)) || 0);
    if (obstacle <= banner) return;
    const prev = html.style.scrollPaddingBottom;
    html.style.scrollPaddingBottom = `${SCROLL_PADDING_BASE + obstacle}px`;
    return () => {
      html.style.scrollPaddingBottom = prev;
    };
  }, [visible, obstacle]);

  // A barra "Solicitar orçamento" do celular (home-bwa.css) abre espaço para o botão.
  // O atributo normalmente já veio do servidor; aqui só é escrito quando o
  // navegador discorda dele (ex.: URL antiga `/#/faq`, corrigida antes da hidratação).
  useEffect(() => {
    const html = document.documentElement;
    if (!visible) {
      if (html.hasAttribute(ON_ATTR)) html.removeAttribute(ON_ATTR);
      return;
    }
    if (!html.hasAttribute(ON_ATTR)) html.setAttribute(ON_ATTR, "");
    return () => {
      html.removeAttribute(ON_ATTR);
    };
  }, [visible]);

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
      className={hiddenOnMobile ? "bwas bwas--sem-mobile" : "bwas"}
      style={{
        ["--bwas-offset" as string]: `${obstacle}px`,
        ["--bwas-base" as string]: obstacle > 0 ? "12px" : "calc(20px + env(safe-area-inset-bottom, 0px))",
        // Celular: mesma base da barra "Solicitar orçamento" (12 px + área segura).
        ["--bwas-base-m" as string]: obstacle > 0 ? "12px" : "calc(12px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <a href={FAQ_PATH} className="bwas-launcher" onClick={goToFaq}>
        <svg className="bwas-launcher-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          {/* "?" dentro do balão: só aparece no celular, onde o botão fica sem texto. */}
          <path
            className="bwas-launcher-q"
            d="M9.9 8.9a2.1 2.1 0 1 1 3 1.9c-.6.3-.9.7-.9 1.3v.3M12 14.2v.01"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <span className="bwas-launcher-long">Dúvidas? Pergunte aqui</span>
        <span className="bwas-launcher-short">Dúvidas</span>
      </a>
    </div>,
    document.body,
  );
}
