/**
 * Link no corpo do artigo para as duas páginas comerciais (25/10/2026).
 *
 * O bloco "Páginas relacionadas" (postInternalLinks.ts) já liga todo artigo às
 * páginas de serviço, mas fica no fim. Link dentro do texto, com âncora que
 * descreve o destino, pesa mais para o Google entender qual página responde
 * por "reforma de studio" e "reforma de apartamento": em out/2026 as duas
 * estavam na posição 8,7 e 9,3, e "reforma de studio" na 26.
 *
 * Regras (para não virar link forçado):
 *  - só a PRIMEIRA ocorrência de cada expressão, e só se o artigo ainda não
 *    tem link para aquele destino;
 *  - só texto corrido de <p> ou <li>: nunca em título, tabela, legenda,
 *    citação ou dentro de outro link;
 *  - no máximo um link por destino.
 * Roda no servidor e no navegador, depois de sanitizar (mesmo HTML nos dois).
 */

type Target = { href: string; phrase: RegExp };

const TARGETS: readonly Target[] = [
  {
    href: "/reforma-de-studio-sao-paulo",
    phrase: /(?<![\p{L}\p{N}])(reforma(?:s)? (?:completa )?de studio(?:s)?|reformar (?:um |o seu |seu )?studio)(?![\p{L}\p{N}])/iu,
  },
  {
    href: "/reforma-de-apartamento-sao-paulo",
    phrase:
      /(?<![\p{L}\p{N}])(reforma(?:s)? (?:completa )?de apartamento(?:s)?|reformar (?:um |o seu |seu )?apartamento)(?![\p{L}\p{N}])/iu,
  },
];

/** Elementos cujo texto nunca recebe link. */
const BLOCKED = new Set(["a", "h1", "h2", "h3", "h4", "h5", "h6", "table", "figcaption", "blockquote", "code", "pre", "button", "summary"]);
/** Elementos cujo texto pode receber link. */
const ALLOWED = new Set(["p", "li"]);

const TAG = /<(\/?)([a-zA-Z][\w:-]*)(?:"[^"]*"|'[^']*'|[^'">])*?(\/?)>/g;

const hasLinkTo = (html: string, href: string) =>
  new RegExp(`href=["'](?:https?://(?:www\\.)?bewild\\.com\\.br)?${href.replace(/[/-]/g, "\\$&")}(?:[?#"'])`, "i").test(html);

export function linkServicePagesInHtml(html: string): string {
  if (!html) return html;
  const pending = TARGETS.filter((t) => !hasLinkTo(html, t.href));
  if (!pending.length) return html;

  let out = "";
  let last = 0;
  let blocked = 0;
  let allowed = 0;

  const linkText = (text: string): string => {
    if (blocked > 0 || allowed === 0 || !pending.length) return text;
    let result = "";
    let rest = text;
    // A cada volta liga a menção que aparece primeiro entre os destinos que
    // faltam e segue a busca só depois do <a> criado (nunca dentro dele).
    while (pending.length) {
      let best: { i: number; m: RegExpExecArray } | null = null;
      for (let i = 0; i < pending.length; i++) {
        const m = pending[i].phrase.exec(rest);
        if (m && (!best || m.index < best.m.index)) best = { i, m };
      }
      if (!best) break;
      const { i, m } = best;
      result += `${rest.slice(0, m.index)}<a href="${pending[i].href}">${m[0]}</a>`;
      rest = rest.slice(m.index + m[0].length);
      pending.splice(i, 1);
    }
    return result + rest;
  };

  TAG.lastIndex = 0;
  for (let m = TAG.exec(html); m; m = TAG.exec(html)) {
    out += linkText(html.slice(last, m.index)) + m[0];
    last = m.index + m[0].length;
    const name = m[2].toLowerCase();
    const closing = m[1] === "/";
    const selfClosing = m[3] === "/";
    if (selfClosing) continue;
    if (BLOCKED.has(name)) blocked = Math.max(0, blocked + (closing ? -1 : 1));
    else if (ALLOWED.has(name)) allowed = Math.max(0, allowed + (closing ? -1 : 1));
  }
  out += linkText(html.slice(last));
  return out;
}
