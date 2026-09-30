import DOMPurify from "dompurify";
import xssPkg from "xss";

// xss é CommonJS: usa o export default (named exports quebram no SSR do Vite).
const { FilterXSS, escapeAttrValue, friendlyAttrValue } = xssPkg;
type FilterXSS = InstanceType<typeof xssPkg.FilterXSS>;

/**
 * Sanitiza HTML do editor de blog antes de inserir no DOM ou persistir no banco.
 *
 * Política:
 *  - Permite tags semânticas (headings, parágrafos, listas, blockquote, hr, br).
 *  - Permite imagens responsivas (`<picture>` + `<source>` + `<img>`) com os
 *    atributos que o pipeline de upload gera (srcset, sizes, loading,
 *    decoding, fetchpriority, width, height).
 *  - Permite âncoras (`<a href>`) com `target` e `rel`; `FORCE_BODY` mantém
 *    `<figure>` e `<figcaption>` que o editor envolve em volta de imagens.
 *  - Permite tabelas (`table`/`thead`/`tbody`/`tfoot`/`tr`/`th`/`td`/`caption`/
 *    `colgroup`/`col`) com `colspan`, `rowspan`, `scope` e `span` — o `marked`
 *    com `gfm: true` gera esse HTML e ele não é vetor de XSS.
 *  - Remove `<script>`, `<style>`, `<iframe>`, `<object>`, handlers `on*=`
 *    e qualquer URL `javascript:` — vetores típicos de XSS armazenado.
 *
 * Use sempre antes de:
 *   1. salvar o `content_html` no Supabase (defesa em profundidade no admin);
 *   2. injetar via `dangerouslySetInnerHTML` no render do post (defesa final
 *      no client — protege contra conteúdo legado salvo antes da sanitização).
 */
const ALLOWED_TAGS = [
  "a",
  "abbr",
  "b",
  "blockquote",
  "br",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "del",
  "em",
  "figcaption",
  "figure",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "ins",
  "kbd",
  "li",
  "mark",
  "ol",
  "p",
  "picture",
  "pre",
  "q",
  "s",
  "small",
  "source",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
];

const ALLOWED_ATTR = [
  "alt",
  "colspan",
  "decoding",
  "fetchpriority",
  "height",
  "href",
  "loading",
  "media",
  "rel",
  "rowspan",
  "scope",
  "sizes",
  "src",
  "span",
  "srcset",
  "target",
  "title",
  "type",
  "width",
];

// Força `rel="noopener noreferrer"` em qualquer `<a target="_blank">` para
// evitar reverse tabnabbing: sem `noopener`, a página externa aberta ganha
// acesso a `window.opener` e pode redirecionar a aba de origem para phishing.
// Sobrescreve qualquer `rel` parcial vindo do conteúdo. Registrado uma única
// vez no carregamento do módulo.
// No servidor (sem DOM) o DOMPurify vem sem `addHook`/`sanitize`: protege a
// chamada de módulo para não derrubar o SSR.
const domPurifyReady =
  typeof window !== "undefined" &&
  typeof DOMPurify.addHook === "function" &&
  typeof DOMPurify.sanitize === "function";

if (domPurifyReady) DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  // O keyword `_blank` é case-insensitive no HTML, então normaliza o valor
  // antes de comparar — `_Blank`/`_BLANK` também abrem nova aba.
  if (
    node.tagName === "A" &&
    node.getAttribute("target")?.toLowerCase() === "_blank"
  ) {
    node.setAttribute("rel", "noopener noreferrer");
  }
});

export function sanitizeBlogHtml(html: string): string {
  if (!html) return "";
  if (!domPurifyReady) return sanitizeBlogHtmlServer(html);
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Não permite `<form>`/`<input>` mesmo que apareçam no input —
    // posts não devem coletar dados do leitor.
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input"],
    FORBID_ATTR: ["style"],
    // Mantém estrutura adicional do editor (figure/figcaption) sem mexer
    // em entidades já escapadas no HTML salvo.
    KEEP_CONTENT: true,
  });
}

// ---------------------------------------------------------------------------
// Versão do servidor (SSR/Worker, sem DOM): js-xss com a MESMA política.
// ---------------------------------------------------------------------------
const FORBIDDEN_BODY_TAGS = ["script", "style", "iframe", "object", "embed", "form", "input"];
const SAFE_URL = /^(https?:|mailto:|tel:|\/(?!\/)|\.{1,2}\/|#|\?|[^:/?#\s]+(?:[/?#]|$))/i;

function isSafeUrl(raw: string): boolean {
  // Decodifica entidades (&#106;avascript:) e remove brancos/controles antes de checar.
  const v = friendlyAttrValue(raw).replace(/[\u0000-\u0020\u007f]+/g, "");
  if (!v) return false;
  return SAFE_URL.test(v);
}

let serverFilter: FilterXSS | null = null;
function getServerFilter(): FilterXSS {
  if (serverFilter) return serverFilter;
  const whiteList: Record<string, string[]> = {};
  for (const tag of ALLOWED_TAGS) whiteList[tag] = ALLOWED_ATTR;
  serverFilter = new FilterXSS({
    whiteList,
    stripIgnoreTag: true,
    stripIgnoreTagBody: FORBIDDEN_BODY_TAGS,
    allowCommentTag: false,
    css: false,
    safeAttrValue(_tag, name, value) {
      if (name === "href" || name === "src") {
        return isSafeUrl(value) ? escapeAttrValue(friendlyAttrValue(value)) : "";
      }
      if (name === "srcset") {
        const ok = value
          .split(",")
          .map((part) => part.trim().split(/\s+/)[0] ?? "")
          .every((u) => !u || isSafeUrl(u));
        return ok ? escapeAttrValue(friendlyAttrValue(value)) : "";
      }
      return escapeAttrValue(friendlyAttrValue(value));
    },
  });
  return serverFilter;
}

/** Força rel="noopener noreferrer" em <a target="_blank"> (saída do js-xss). */
function forceNoopener(html: string): string {
  return html.replace(/<a\b[^>]*>/gi, (tag) => {
    if (!/\starget\s*=\s*"_blank"/i.test(tag)) return tag;
    const noRel = tag.replace(/\srel\s*=\s*"[^"]*"/gi, "");
    return noRel.replace(/^<a\b/i, '<a rel="noopener noreferrer"');
  });
}

/**
 * Sanitizador usado no servidor. Lança em caso de erro — quem chama decide
 * (o loader do artigo cai para "sem corpo", nunca para HTML cru).
 */
export function sanitizeBlogHtmlServer(html: string): string {
  if (!html) return "";
  return forceNoopener(getServerFilter().process(html));
}
