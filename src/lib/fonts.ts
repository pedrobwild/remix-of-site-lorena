/**
 * Fontes fora do primeiro paint.
 *
 * O `index.html` carrega só as duas famílias que a home e as páginas
 * internas usam — Manrope (texto) e JetBrains Mono (rótulos). As outras três
 * que ficavam lá para todo visitante — Playfair Display e Poppins (tokens
 * `font-display` / `font-body` / `font-sans` do Tailwind: guia do
 * investidor, login do painel) e Inter (painel de analytics, fichas de
 * projeto, LPs) — entram por `ensureBrandFonts`, uma única vez, quando a rota
 * exibida não é a home (ver `src/main.tsx`).
 *
 * Na home, Inter e Montserrat só servem à réplica do portal
 * (WorkflowPortalReplica, no meio da página) e ao selo de visualizações dos
 * depoimentos do Instagram. A réplica pede essa folha com
 * `mountFontSheetAfterLoad`: depois do `load` da página, sem disputar banda
 * com o hero, o JS e a Manrope do título.
 *
 * `display=swap`: o texto aparece na fonte de reserva e troca quando a
 * família chega. Fontes não rastreiam ninguém: nada aqui depende do aceite
 * de cookies.
 */
const BRAND_FONTS_ID = "bw-fonts-brand";

export const BRAND_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,500;1,600&family=Poppins:wght@300;400;500&family=Inter:wght@400;500;600;700&display=swap";

/** Injeta a folha das famílias internas uma vez. Devolve `true` quando injetou agora. */
export function ensureBrandFonts(doc: Document | null = typeof document !== "undefined" ? document : null): boolean {
  if (!doc || !doc.head) return false;
  if (doc.getElementById(BRAND_FONTS_ID)) return false;
  const link = doc.createElement("link");
  link.id = BRAND_FONTS_ID;
  link.rel = "stylesheet";
  link.href = BRAND_FONTS_HREF;
  doc.head.appendChild(link);
  return true;
}

/**
 * Injeta a folha `href` (com o `id` dado, uma vez só) quando a página termina
 * de carregar — ou já, se o `load` passou (navegação interna pela SPA).
 * Devolve a limpeza: cancela a espera e remove a folha.
 */
export function mountFontSheetAfterLoad(id: string, href: string): () => void {
  let link: HTMLLinkElement | null = null;
  const inject = () => {
    link = document.getElementById(id) as HTMLLinkElement | null;
    if (link) return;
    link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  };
  if (document.readyState === "complete") inject();
  else window.addEventListener("load", inject, { once: true });
  return () => {
    window.removeEventListener("load", inject);
    link?.remove();
  };
}