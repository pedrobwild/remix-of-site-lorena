/**
 * Pré-renderiza o <head> e o corpo de cada post de /conteudos.
 *
 * Gera, depois do build, um HTML estático por artigo em
 * dist/conteudos/<slug>/index.html (mais o irmão dist/conteudos/<slug>.html)
 * com título, descrição, palavras-chave, canonical, Open Graph (inclusive a
 * imagem de capa do post) e JSON-LD do artigo já prontos no primeiro
 * carregamento — sem depender de JS. O corpo do artigo vai dentro de
 * <div id="root"> para crawlers; o React substitui ao montar.
 *
 * Segurança: o markdown vem do banco. O HTML gerado passa pelo DOMPurify
 * (sobre um window do jsdom) com a MESMA política de src/lib/sanitizeHtml.ts —
 * um teste confere que as listas continuam iguais. Um filtro por regex não
 * serve: `<img src=x/onerror=…>`, `href=javascript:` sem aspas, entidades
 * (`&#106;avascript:`), `<meta http-equiv=refresh>`, `<form>` e `<base>`
 * passavam. Se o sanitizador não carregar, o corpo do artigo é omitido
 * (fica só título + resumo) em vez de sair sem sanitização.
 *
 * NUNCA pode quebrar o build: qualquer falha apenas imprime um aviso.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import type { Plugin } from "vite";
import { marked } from "marked";
import { keywordsForPost } from "../src/lib/postKeywords";

const BASE_URL = "https://bewild.com.br";
const DEFAULT_IMAGE = `${BASE_URL}/og_final_v2.jpg`;

export type Post = {
  slug: string;
  title: string;
  meta_title: string | null;
  meta_description: string | null;
  excerpt: string | null;
  cover_image: string | null;
  category: string | null;
  published_at: string | null;
  updated_at: string | null;
  created_at: string | null;
  body: string | null;
};

/* ─── Sanitização (espelha src/lib/sanitizeHtml.ts) ─── */

export const POST_ALLOWED_TAGS = [
  "a", "abbr", "b", "blockquote", "br", "caption", "cite", "code", "col", "colgroup",
  "del", "em", "figcaption", "figure", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img",
  "ins", "kbd", "li", "mark", "ol", "p", "picture", "pre", "q", "s", "small", "source",
  "span", "strong", "sub", "sup", "table", "tbody", "td", "tfoot", "th", "thead", "tr",
  "u", "ul",
];

export const POST_ALLOWED_ATTR = [
  "alt", "colspan", "decoding", "fetchpriority", "height", "href", "loading", "media",
  "rel", "rowspan", "scope", "sizes", "src", "span", "srcset", "target", "title", "type",
  "width",
];

const POST_FORBID_TAGS = ["script", "style", "iframe", "object", "embed", "form", "input"];
const POST_FORBID_ATTR = ["style"];

export type Sanitizador = (html: string) => string;

let sanitizador: Promise<Sanitizador> | null = null;

/**
 * DOMPurify sobre um window do jsdom. Carregado sob demanda (só no fim do
 * build): importar o jsdom no topo pesaria em todo `vite dev`.
 */
export function carregarSanitizador(): Promise<Sanitizador> {
  sanitizador ??= (async () => {
    const [{ JSDOM }, { default: createDOMPurify }] = await Promise.all([import("jsdom"), import("dompurify")]);
    const { window } = new JSDOM("");
    const purify = createDOMPurify(window as unknown as Parameters<typeof createDOMPurify>[0]);
    // Mesmo hook do site: link em nova aba sempre com rel="noopener noreferrer".
    purify.addHook("afterSanitizeAttributes", (node) => {
      if (node.tagName === "A" && node.getAttribute("target")?.toLowerCase() === "_blank") {
        node.setAttribute("rel", "noopener noreferrer");
      }
    });
    return (html: string) =>
      purify.sanitize(html, {
        ALLOWED_TAGS: POST_ALLOWED_TAGS,
        ALLOWED_ATTR: POST_ALLOWED_ATTR,
        FORBID_TAGS: POST_FORBID_TAGS,
        FORBID_ATTR: POST_FORBID_ATTR,
        KEEP_CONTENT: true,
      });
  })();
  // Falhou uma vez? Permite nova tentativa numa próxima chamada.
  sanitizador.catch(() => {
    sanitizador = null;
  });
  return sanitizador;
}

/* ─── HTML ─── */

const attr = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Substitui usando FUNÇÃO de substituição. Com string, `$&`, `$'`, `` $` `` e
 * `$1` vindos do banco (título, descrição, corpo) seriam interpretados pelo
 * `String.replace` e corromperiam o HTML.
 */
const substituir = (html: string, pattern: RegExp, valor: string) => html.replace(pattern, () => valor);

/** URL absoluta http(s) da capa, ou null (relativa vira absoluta; outros esquemas são descartados). */
export function imagemAbsoluta(src: string | null | undefined): string | null {
  const v = src?.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith("/") && !v.startsWith("//")) return `${BASE_URL}${v}`;
  return null;
}

/** Corpo do artigo já pronto no primeiro carregamento (o React substitui ao montar). */
function bodyFor(post: Post, html: string, sanitizar: Sanitizador | null): string {
  let article = "";
  if (sanitizar) {
    try {
      article = sanitizar(marked.parse(post.body || "", { async: false, gfm: true }) as string);
    } catch {
      article = "";
    }
  }
  const excerpt = post.excerpt ? `<p>${attr(post.excerpt)}</p>` : "";
  const content =
    `<article data-prerender="post-body">` +
    `<nav><a href="/">Início</a> / <a href="/conteudos">Conteúdos</a></nav>` +
    `<h1>${attr(post.title)}</h1>${excerpt}${article}` +
    `<p><a href="/orcamento">Solicitar orçamento de reforma</a> · <a href="/portfolio">Portfólio de reformas em SP</a> · <a href="/conteudos">Mais guias de custo de reforma</a></p>` +
    `</article>`;
  return substituir(html, /<div id="root"><\/div>/, `<div id="root">${content}</div>`);
}

function warn(msg: string) {
  console.warn(`[prerender-posts] ${msg} — dist/conteudos não foi gerado.`);
}

function loadEnv(): Record<string, string | undefined> {
  const env: Record<string, string | undefined> = { ...process.env };
  const envPath = resolve(".env");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      if (!env[m[1]]) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

function headFor(post: Post, html: string): string {
  const title = post.meta_title || `${post.title} | Bewild`;
  const description =
    post.meta_description ||
    post.excerpt ||
    `${post.title}. Conteúdo Bewild sobre reformas de apartamentos e imóveis prontos em São Paulo.`;
  const keywords = keywordsForPost(post.slug);
  const url = `${BASE_URL}/conteudos/${post.slug}`;
  const capa = imagemAbsoluta(post.cover_image);
  const image = capa || DEFAULT_IMAGE;
  const published = post.published_at || post.created_at || undefined;
  const modified = post.updated_at || published;

  const set = (pattern: RegExp, valor: string) => {
    html = substituir(html, pattern, valor);
  };

  set(/<title>[\s\S]*?<\/title>/, `<title>${attr(title)}</title>`);
  set(
    /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta name="description" content="${attr(description)}" />`,
  );
  set(/<meta\s+name="keywords"[\s\S]*?\/>/, `<meta name="keywords" content="${attr(keywords)}" />`);
  set(/<meta\s+name="DC.title"\s+content="[\s\S]*?"\s*\/?>/, `<meta name="DC.title" content="${attr(title)}" />`);
  set(/<link\s+rel="canonical"\s+href="[\s\S]*?"\s*\/?>/, `<link rel="canonical" href="${attr(url)}" />`);
  html = html.replace(
    /<link\s+rel="alternate"\s+hreflang="([\w-]+)"\s+href="[\s\S]*?"\s*\/?>/g,
    (_m, lang: string) => `<link rel="alternate" hreflang="${lang}" href="${attr(url)}" />`,
  );
  set(/<meta\s+property="og:type"\s+content="[\s\S]*?"\s*\/?>/, `<meta property="og:type" content="article" />`);
  set(/<meta\s+property="og:url"\s+content="[\s\S]*?"\s*\/?>/, `<meta property="og:url" content="${attr(url)}" />`);
  set(/<meta\s+property="og:title"\s+content="[\s\S]*?"\s*\/?>/, `<meta property="og:title" content="${attr(title)}" />`);
  set(
    /<meta\s+property="og:description"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta property="og:description" content="${attr(description)}" />`,
  );
  set(/<meta\s+name="twitter:title"\s+content="[\s\S]*?"\s*\/?>/, `<meta name="twitter:title" content="${attr(title)}" />`);
  set(
    /<meta\s+name="twitter:description"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta name="twitter:description" content="${attr(description)}" />`,
  );

  // Capa própria do post no compartilhamento. As dimensões/tipo do index.html
  // descrevem a imagem padrão (1200×630 JPEG) e mentiriam para a capa: saem.
  if (capa) {
    set(/<meta\s+property="og:image"\s+content="[\s\S]*?"\s*\/?>/, `<meta property="og:image" content="${attr(capa)}" />`);
    set(
      /<meta\s+property="og:image:secure_url"\s+content="[\s\S]*?"\s*\/?>/,
      `<meta property="og:image:secure_url" content="${attr(capa)}" />`,
    );
    set(/<meta\s+name="twitter:image"\s+content="[\s\S]*?"\s*\/?>/, `<meta name="twitter:image" content="${attr(capa)}" />`);
    set(/<meta\s+property="og:image:alt"\s+content="[\s\S]*?"\s*\/?>/, `<meta property="og:image:alt" content="${attr(post.title)}" />`);
    set(/<meta\s+name="twitter:image:alt"\s+content="[\s\S]*?"\s*\/?>/, `<meta name="twitter:image:alt" content="${attr(post.title)}" />`);
    html = html.replace(/\s*<meta\s+property="og:image:(?:width|height|type)"\s+content="[\s\S]*?"\s*\/?>/g, "");
  }

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description,
      image: [image],
      author: { "@type": "Organization", name: "Bewild" },
      publisher: {
        "@type": "Organization",
        name: "Bewild",
        logo: { "@type": "ImageObject", url: `${BASE_URL}/brand/bewild-logo.png` },
      },
      datePublished: published,
      dateModified: modified,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      inLanguage: "pt-BR",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: `${BASE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Conteúdos", item: `${BASE_URL}/conteudos` },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
  ];

  // Um bloco por objeto (como o useSeo), marcados para a SPA remover e
  // substituir pelos seus ao montar — sem JSON-LD duplicado.
  const blocos = jsonLd
    .map(
      (obj) =>
        `<script type="application/ld+json" data-seo-managed="true" data-prerender="post">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`,
    )
    .join("\n");
  return substituir(html, /<\/head>/, `${blocos}\n</head>`);
}

/** HTML final de um post (exportado para teste). `sanitizar` null = sem corpo do artigo. */
export function renderPostHtml(post: Post, baseHtml: string, sanitizar: Sanitizador | null): string {
  return bodyFor(post, headFor(post, baseHtml), sanitizar);
}

/**
 * `opcoes` recebe a URL/chave já resolvidas pelo vite.config.ts (mesma
 * precedência do bundle: .env → processo → fallback público). Sem elas, lê
 * .env/processo por conta própria.
 */
export function prerenderPosts(opcoes: { supabaseUrl?: string; supabaseKey?: string } = {}): Plugin {
  return {
    name: "bewild-prerender-posts",
    apply: "build",
    async closeBundle() {
      try {
        const env = loadEnv();
        const supabaseUrl = opcoes.supabaseUrl || env.VITE_SUPABASE_URL;
        const key = opcoes.supabaseKey || env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !key) return warn("URL ou chave pública do backend ausente");

        const distIndex = resolve("dist/index.html");
        if (!existsSync(distIndex)) return warn("dist/index.html não encontrado");
        const baseHtml = readFileSync(distIndex, "utf8");

        const res = await fetch(
          `${supabaseUrl.replace(/\/$/, "")}/rest/v1/bewild_posts?published=eq.true&select=slug,title,meta_title,meta_description,excerpt,cover_image,category,published_at,updated_at,created_at,body`,
          // Timeout: rede lenta no fim do build não pode travar o deploy.
          { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(20_000) },
        );
        if (!res.ok) return warn(`consulta ao banco falhou (HTTP ${res.status})`);
        const posts = (await res.json()) as Post[];
        if (!Array.isArray(posts) || posts.length === 0) return warn("nenhum post publicado");

        let sanitizar: Sanitizador | null = null;
        try {
          sanitizar = await carregarSanitizador();
        } catch (err) {
          console.warn(
            `[prerender-posts] sanitizador indisponível (${err instanceof Error ? err.message : String(err)}) — ` +
              "os artigos saem só com título e resumo, sem o corpo.",
          );
        }

        const outDir = resolve("dist/conteudos");
        rmSync(outDir, { recursive: true, force: true });

        let written = 0;
        for (const post of posts) {
          if (!post?.slug || !/^[a-z0-9-]+$/.test(post.slug) || !post.title) continue;
          const html = renderPostHtml(post, baseHtml, sanitizar);
          const dirFile = resolve(outDir, post.slug, "index.html");
          mkdirSync(dirname(dirFile), { recursive: true });
          writeFileSync(dirFile, html, "utf8");
          writeFileSync(resolve(outDir, `${post.slug}.html`), html, "utf8");
          written += 1;
        }
        console.log(`[prerender-posts] ${written} artigos com <head> e corpo prontos em dist/conteudos/`);
      } catch (err) {
        warn(err instanceof Error ? err.message : String(err));
      }
    },
  };
}
