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
    return `<a${rest} href="${RADAR_URL}" target="_blank" rel="noopener" data-outbound="radarbewild">`;
  }).replace(/(<a [^>]*data-outbound="radarbewild"[^>]*>)([\s\S]*?)<\/a>/g, (_m, open, text) =>
    `${open}${text}<span class="sr-only">${NEW_TAB_SUFFIX}</span><span aria-hidden="true"> ↗</span></a>`);
}
