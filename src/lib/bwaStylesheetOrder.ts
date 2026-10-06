import { preinit } from "react-dom";
import homeBwaCssUrl from "../pages/home-bwa.css?url";
import bwaInternalCssUrl from "../pages/bwa-internal.css?url";
import { BWA_CSS_PRECEDENCE } from "@/lib/routeHead";

/**
 * Mantém home-bwa.css + bwa-internal.css como as ÚLTIMAS folhas do `<head>`.
 *
 * No HTML do servidor elas já saem por último (grupo de precedência "bwa", ver
 * BWA_CSS_PRECEDENCE em src/lib/routeHead.ts). O que muda a ordem é a
 * navegação interna: o CSS do pedaço da página nova é anexado pelo Vite no fim
 * do `<head>`, depois delas; e, vindo da home, home-bwa.css está no começo
 * (link do `head` da rota "/"). Nesses casos os dois `<link>` voltam para o
 * fim — o que o BwaNav sempre fez a cada montagem.
 *
 * Quando já estão por último (toda carga direta), não toca em nada: antes os
 * dois links eram reanexados em toda montagem, inclusive na hidratação, e cada
 * reanexação faz o navegador reprocessar a folha.
 */
export function keepBwaStylesheetsLast(doc: Document = document): void {
  const sheets = Array.from(
    doc.head.querySelectorAll<HTMLLinkElement | HTMLStyleElement>('link[rel="stylesheet"], style'),
  );
  const last = (url: string) => {
    for (let i = sheets.length - 1; i >= 0; i--) {
      const el = sheets[i];
      if (el instanceof HTMLLinkElement && el.getAttribute("href") === url) return el;
    }
    return null;
  };
  const home = last(homeBwaCssUrl);
  const internal = last(bwaInternalCssUrl);
  if (!home || !internal) return;
  const n = sheets.length;
  if (sheets[n - 2] === home && sheets[n - 1] === internal) return;
  doc.head.appendChild(home);
  doc.head.appendChild(internal);
}

/**
 * Primeiro segmento dos destinos que NÃO usam o header `.bwa`: as rotas com
 * `bwaCss: false` no `seoHead()` (home — que carrega home-bwa.css pelo próprio
 * `head` —, LPs e guia) e as áreas com layout próprio. Errar para mais só
 * adianta duas folhas pequenas; errar para menos cai na espera descrita abaixo.
 */
const NO_BWA_SEGMENTS = new Set(["", "o", "p", "guia-do-investidor", "diagnostico", "admin", "bakeoff", "mockups"]);

export function usesBwaStylesheets(pathname: string): boolean {
  return !NO_BWA_SEGMENTS.has(pathname.split("/")[1] || "");
}

/** O que o instalador usa do TanStack Router (tipo mínimo, para o teste). */
type NavigationStart = {
  fromLocation?: { pathname: string };
  toLocation: { pathname: string };
};
type NavigationStartSource = {
  subscribe: (eventType: "onBeforeNavigate", fn: (e: NavigationStart) => void) => () => void;
};

/**
 * Adianta as folhas `.bwa` no INÍCIO de uma navegação interna para uma página
 * que usa o header `.bwa`, em vez de só na hora de mostrar a página.
 *
 * O caso que importa: quem entra pela home e toca no primeiro link. A home só
 * tem home-bwa.css; bwa-internal.css (1 kB) era pedida quando a página nova já
 * estava pronta — e, como o `<link>` do BwaNav segura a troca de página até a
 * folha carregar (para a página nunca aparecer sem o header estilizado), o
 * visitante via a página antiga parada, já rolada para o topo, por uma ida e
 * volta de rede a mais. Pedida no clique, a folha baixa junto com o código da
 * página e a troca não espera por ela.
 *
 * `preinit` é a forma do React de inserir uma folha fora da renderização: o
 * `<link>` entra no grupo de precedência "bwa" e o React não o duplica quando
 * a página renderiza o mesmo recurso. A home com bwa-internal.css carregada é
 * idêntica, pixel a pixel (a folha só tem regras das páginas internas).
 *
 * Instalado uma vez no Root (`__root.tsx`). Retorna o cleanup.
 */
export function installBwaStylesheetPreinit(router: NavigationStartSource): () => void {
  return router.subscribe("onBeforeNavigate", (e) => {
    const from = e.fromLocation;
    if (!from) return; // carga inicial: as folhas já vieram no HTML do servidor
    if (from.pathname === e.toLocation.pathname) return; // âncora ou query: mesma página
    if (!usesBwaStylesheets(e.toLocation.pathname)) return;
    for (const href of [homeBwaCssUrl, bwaInternalCssUrl]) {
      if (href) preinit(href, { as: "style", precedence: BWA_CSS_PRECEDENCE });
    }
  });
}
