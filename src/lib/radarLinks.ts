import { NEW_TAB_SUFFIX, RADAR_URL } from "@/config/site";

/**
 * /guia-do-investidor só faz 301 para o Radar. Links que ainda vêm do banco
 * (artigos, respostas do assistente) com esse endereço são trocados aqui pelo
 * Radar, para o visitante não ficar preso no "Voltar". O banco não muda.
 */
const GUIA_HREF = /^(?:https?:\/\/(?:www\.)?bewild\.com\.br)?\/guia-do-investidor(?:[/?#].*)?$/i;

export function isGuiaHref(href: string | null | undefined): boolean {
  return !!href && GUIA_HREF.test(href.trim());
}

export function isRadarHref(href: string | null | undefined): boolean {
  return !!href && href.startsWith(RADAR_URL);
}

/** Troca o endereço antigo do guia pelo Radar; os demais passam iguais. */
export function toRadarHref(href: string): string {
  return isGuiaHref(href) ? RADAR_URL : href;
}

/** HTML já sanitizado: link para o endereço antigo do guia vira link do Radar em nova aba. */
export function rewriteGuiaLinksInHtml(html: string): string {
  return html.replace(/<a\b([^>]*?)\shref=(["'])([^"']*)\2([^>]*)>/gi, (tag, before, _q, href, after) => {
    // Também o link que o banco já guarda com o endereço do Radar: sem isso abriria na mesma aba.
    if (!isGuiaHref(href) && !isRadarHref(href)) return tag;
    const rest = `${before}${after}`.replace(/\s(?:target|rel|data-outbound)=(["'])[^"']*\1/gi, "");
    // Endereço antigo do guia vira a home do Radar; link já do Radar mantém a página (ex.: /ranking).
    const destino = isGuiaHref(href) ? RADAR_URL : href;
    return `<a${rest} href="${destino}" target="_blank" rel="noopener" data-outbound="radarbewild">`;
  }).replace(/(<a [^>]*data-outbound="radarbewild"[^>]*>)([\s\S]*?)<\/a>/g, (_m, open, text) =>
    `${open}${text}<span class="sr-only">${NEW_TAB_SUFFIX}</span><span aria-hidden="true"> ↗</span></a>`);
}

/**
 * Páginas de dados do Radar por bairro. O Radar fica com dados e ferramentas
 * (diária, ocupação, comparador); o site fica com a análise e a reforma. As
 * páginas /reforma/<bairro> apontam para o dado do bairro no Radar e o Radar
 * aponta de volta para /reforma/<bairro> — sem disputar a mesma busca.
 *
 * Só entra aqui bairro com diária e ocupação publicadas no Radar (base curada de
 * 13/10/2026). Os demais vão para o comparador, que lista todos os bairros.
 */
export const RADAR_RANKING_URL = `${RADAR_URL}ranking`;

const RADAR_BAIRROS_COM_DADO = new Set([
  "bela-vista",
  "brooklin",
  "consolacao",
  "moema",
  "perdizes",
  "pinheiros",
  "republica",
  "vila-mariana",
  "vila-olimpia",
]);

export function radarBairroLink(slug: string, bairro: string): { href: string; label: string } {
  return RADAR_BAIRROS_COM_DADO.has(slug)
    ? { href: `${RADAR_URL}bairro/${slug}`, label: `Diária, ocupação e receita de referência de studios em ${bairro}, no Radar Bewild` }
    : { href: RADAR_RANKING_URL, label: "Compare diária e ocupação dos bairros de São Paulo no Radar Bewild" };
}
