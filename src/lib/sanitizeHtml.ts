import DOMPurify from "dompurify";
import * as xssNs from "xss";
import {
  YOUTUBE_IFRAME_ALLOW,
  YOUTUBE_IFRAME_REFERRER,
  parseYouTubeEmbedSrc,
  parseYouTubeStart,
  youtubeEmbedUrl,
} from "@/lib/youtube";

// xss é CommonJS: no SSR do Vite os named exports ficam só no `default`.
type XssModule = typeof xssNs;
const xssMod: XssModule =
  ((xssNs as unknown as { default?: XssModule }).default as XssModule | undefined) ?? xssNs;
const { FilterXSS, escapeAttrValue, friendlyAttrValue } = xssMod;
type FilterXSS = InstanceType<XssModule["FilterXSS"]>;

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
 *  - Permite `<iframe>` SOMENTE de player do YouTube (`/embed/<ID>`), que é
 *    reescrito para `youtube-nocookie.com` com atributos fixos; qualquer outro
 *    iframe é removido.
 *  - Remove `<script>`, `<style>`, outros `<iframe>`, `<object>`, handlers `on*=`
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
  "video",
];

const ALLOWED_ATTR = [
  "alt",
  "aria-label",
  "controls",
  "muted",
  "playsinline",
  "poster",
  "preload",
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
  if (node.tagName === "IFRAME") {
    const id = parseYouTubeEmbedSrc(node.getAttribute("src"));
    if (!id) {
      node.remove();
      return;
    }
    const start = parseYouTubeStart(node.getAttribute("src"));
    const title = node.getAttribute("title") ?? "";
    for (const name of Array.from(node.getAttributeNames())) node.removeAttribute(name);
    node.textContent = "";
    node.setAttribute("src", youtubeEmbedUrl(id, start));
    if (title) node.setAttribute("title", title);
    node.setAttribute("loading", "lazy");
    node.setAttribute("allow", YOUTUBE_IFRAME_ALLOW);
    node.setAttribute("allowfullscreen", "");
    node.setAttribute("referrerpolicy", YOUTUBE_IFRAME_REFERRER);
    return;
  }
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
  return stripInternalUtm(DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...ALLOWED_TAGS, "iframe"],
    ALLOWED_ATTR,
    // Não permite `<form>`/`<input>` mesmo que apareçam no input —
    // posts não devem coletar dados do leitor.
    FORBID_TAGS: ["script", "style", "object", "embed", "form", "input"],
    FORBID_ATTR: ["style"],
    // Mantém estrutura adicional do editor (figure/figcaption) sem mexer
    // em entidades já escapadas no HTML salvo.
    KEEP_CONTENT: true,
  }));
}

// ---------------------------------------------------------------------------
// Links internos sem UTM (auditoria de SEO 06/10/2026, item 11).
// ---------------------------------------------------------------------------
const INTERNAL_HREF = /^(?:\/(?!\/)|https?:\/\/(?:www\.)?bewild\.com\.br(?:[/?#]|$))/i;

/**
 * Tira `utm_*` de links para o próprio site. UTM em link interno abre uma
 * nova sessão no GA4 e apaga a origem real do visitante (orgânico vira
 * "conteudo / post"); a origem do lead já fica em `leadSource`. Links
 * externos e demais parâmetros ficam como estão. Opera no HTML já
 * sanitizado, onde `&` do href está escapado como `&amp;`.
 */
export function stripInternalUtm(html: string): string {
  if (!html || !/utm_/i.test(html)) return html;
  return html.replace(/<a\b([^>]*?)\shref=("([^"]*)"|'([^']*)')/gi, (tag, before: string, _q, dq?: string, sq?: string) => {
    const href = dq ?? sq ?? "";
    if (!INTERNAL_HREF.test(href) || !/[?&](?:amp;)?utm_/i.test(href)) return tag;
    const hashAt = href.indexOf("#");
    const hash = hashAt >= 0 ? href.slice(hashAt) : "";
    const noHash = hashAt >= 0 ? href.slice(0, hashAt) : href;
    const qAt = noHash.indexOf("?");
    if (qAt < 0) return tag;
    const path = noHash.slice(0, qAt);
    const kept = noHash
      .slice(qAt + 1)
      .split(/&amp;|&/)
      .filter((pair) => pair && !/^utm_/i.test(pair));
    const clean = `${path}${kept.length ? `?${kept.join("&amp;")}` : ""}${hash}`;
    const quote = dq !== undefined ? '"' : "'";
    return `<a${before} href=${quote}${clean}${quote}`;
  });
}

// ---------------------------------------------------------------------------
// Versão do servidor (SSR/Worker, sem DOM): js-xss com a MESMA política.
// ---------------------------------------------------------------------------
const FORBIDDEN_BODY_TAGS = ["script", "style", "iframe", "object", "embed", "form", "input"];
const SAFE_URL = /^(https?:|mailto:|tel:|\/(?!\/)|\.{1,2}\/|#|\?|[^:/?#\s]+(?:[/?#]|$))/i;

function isSafeUrl(raw: string): boolean {
  // Decodifica entidades (&#106;avascript:) e remove brancos/controles antes de checar.
  // eslint-disable-next-line no-control-regex -- remove controles que o navegador ignora em URLs
  const v = friendlyAttrValue(raw).replace(/[\u0000-\u0020\u007f]+/g, "");
  if (!v) return false;
  return SAFE_URL.test(v);
}

// Estado do `onTag` abaixo: o `</iframe>` de um player válido já foi emitido
// junto com a abertura, então o fechamento original é descartado.
let validIframeOpen = false;

function attrOf(tag: string, name: string): string {
  const m = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i").exec(tag);
  return friendlyAttrValue(m?.[1] ?? m?.[2] ?? "");
}

/** `<iframe>` do servidor: só player do YouTube, reescrito como no cliente. */
function serverIframe(tag: string, html: string, options: { isClosing?: boolean }): string | undefined {
  if (tag !== "iframe") return undefined;
  if (options.isClosing) {
    if (!validIframeOpen) return undefined;
    validIframeOpen = false;
    return "";
  }
  const src = attrOf(html, "src");
  const id = parseYouTubeEmbedSrc(src);
  if (!id) return undefined;
  const start = parseYouTubeStart(src);
  validIframeOpen = true;
  const title = attrOf(html, "title");
  return (
    `<iframe src="${escapeAttrValue(youtubeEmbedUrl(id, start))}"` +
    (title ? ` title="${escapeAttrValue(title)}"` : "") +
    ` loading="lazy" allow="${YOUTUBE_IFRAME_ALLOW}" allowfullscreen="" referrerpolicy="${YOUTUBE_IFRAME_REFERRER}"></iframe>`
  );
}

let serverFilter: FilterXSS | null = null;
function getServerFilter(): FilterXSS {
  if (serverFilter) return serverFilter;
  const whiteList: Record<string, string[]> = {};
  for (const tag of ALLOWED_TAGS) whiteList[tag] = ALLOWED_ATTR;
  serverFilter = new FilterXSS({
    whiteList,
    onTag: serverIframe,
    stripIgnoreTag: true,
    stripIgnoreTagBody: FORBIDDEN_BODY_TAGS,
    allowCommentTag: false,
    css: false,
    safeAttrValue(_tag: string, name: string, value: string) {
      if (name === "href" || name === "src" || name === "poster") {
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
  validIframeOpen = false;
  return stripInternalUtm(forceNoopener(getServerFilter().process(html)));
}
