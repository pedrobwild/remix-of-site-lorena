/**
 * Pré-renderiza o <head> de cada post de /conteudos.
 *
 * Gera, depois do build, um HTML estático por artigo em
 * dist/conteudos/<slug>/index.html (mais o irmão dist/conteudos/<slug>.html)
 * com título, descrição, palavras-chave, canonical, Open Graph e JSON-LD
 * do artigo já prontos no primeiro carregamento — sem depender de JS.
 *
 * O corpo continua sendo a mesma SPA do dist/index.html: só o <head> muda.
 * NUNCA pode quebrar o build: qualquer falha apenas imprime um aviso.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import type { Plugin } from "vite";
import { marked } from "marked";
import { keywordsForPost } from "../src/lib/postKeywords";

const BASE_URL = "https://bewild.com.br";

type Post = {
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

/** Remove vetores de XSS do markdown renderizado (conteúdo próprio, defesa extra). */
function stripUnsafe(html: string): string {
  return html
    .replace(/<\/?(script|style|iframe|object|embed)[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, "");
}

/** Corpo do artigo já pronto no primeiro carregamento (o React substitui ao montar). */
function bodyFor(post: Post, html: string): string {
  let article = "";
  try {
    article = stripUnsafe(marked.parse(post.body || "", { async: false, gfm: true }) as string);
  } catch {
    article = "";
  }
  const excerpt = post.excerpt ? `<p>${attr(post.excerpt)}</p>` : "";
  const content =
    `<article data-prerender="post-body">` +
    `<nav><a href="/">Início</a> / <a href="/conteudos">Conteúdos</a></nav>` +
    `<h1>${attr(post.title)}</h1>${excerpt}${article}` +
    `<p><a href="/orcamento">Solicitar orçamento de reforma</a> · <a href="/portfolio">Portfólio de reformas em SP</a> · <a href="/conteudos">Mais guias de custo de reforma</a></p>` +
    `</article>`;
  return html.replace('<div id="root"></div>', `<div id="root">${content}</div>`);
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

const attr = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function headFor(post: Post, html: string): string {
  const title = post.meta_title || `${post.title} | Bewild`;
  const description =
    post.meta_description ||
    post.excerpt ||
    `${post.title}. Conteúdo Bewild sobre reformas de apartamentos e imóveis prontos em São Paulo.`;
  const keywords = keywordsForPost(post.slug);
  const url = `${BASE_URL}/conteudos/${post.slug}`;
  const image = post.cover_image || `${BASE_URL}/og_final_v2.jpg`;
  const published = post.published_at || post.created_at || undefined;
  const modified = post.updated_at || published;

  const set = (pattern: RegExp, replacement: string) => {
    html = html.replace(pattern, replacement);
  };

  set(/<title>[\s\S]*?<\/title>/, `<title>${attr(title)}</title>`);
  set(
    /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta name="description" content="${attr(description)}" />`,
  );
  set(
    /<meta\s+name="keywords"[\s\S]*?\/>/,
    `<meta name="keywords" content="${attr(keywords)}" />`,
  );
  set(
    /<meta\s+name="DC.title"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta name="DC.title" content="${attr(title)}" />`,
  );
  set(
    /<link\s+rel="canonical"\s+href="[\s\S]*?"\s*\/?>/,
    `<link rel="canonical" href="${url}" />`,
  );
  html = html.replace(
    /<link\s+rel="alternate"\s+hreflang="([\w-]+)"\s+href="[\s\S]*?"\s*\/?>/g,
    (_m, lang: string) => `<link rel="alternate" hreflang="${lang}" href="${url}" />`,
  );
  set(/<meta\s+property="og:type"\s+content="[\s\S]*?"\s*\/?>/, `<meta property="og:type" content="article" />`);
  set(/<meta\s+property="og:url"\s+content="[\s\S]*?"\s*\/?>/, `<meta property="og:url" content="${url}" />`);
  set(
    /<meta\s+property="og:title"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta property="og:title" content="${attr(title)}" />`,
  );
  set(
    /<meta\s+property="og:description"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta property="og:description" content="${attr(description)}" />`,
  );
  set(
    /<meta\s+name="twitter:title"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta name="twitter:title" content="${attr(title)}" />`,
  );
  set(
    /<meta\s+name="twitter:description"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta name="twitter:description" content="${attr(description)}" />`,
  );

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

  const block = `<script type="application/ld+json" data-prerender="post">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>\n</head>`;
  return html.replace("</head>", block);
}

export function prerenderPosts(): Plugin {
  return {
    name: "bewild-prerender-posts",
    apply: "build",
    async closeBundle() {
      try {
        const env = loadEnv();
        const supabaseUrl = env.VITE_SUPABASE_URL;
        const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !key) return warn("URL ou chave pública do backend ausente");

        const distIndex = resolve("dist/index.html");
        if (!existsSync(distIndex)) return warn("dist/index.html não encontrado");
        const baseHtml = readFileSync(distIndex, "utf8");

        const res = await fetch(
          `${supabaseUrl.replace(/\/$/, "")}/rest/v1/bewild_posts?published=eq.true&select=slug,title,meta_title,meta_description,excerpt,cover_image,category,published_at,updated_at,created_at`,
          { headers: { apikey: key, Authorization: `Bearer ${key}` } },
        );
        if (!res.ok) return warn(`consulta ao banco falhou (HTTP ${res.status})`);
        const posts = (await res.json()) as Post[];
        if (!Array.isArray(posts) || posts.length === 0) return warn("nenhum post publicado");

        const outDir = resolve("dist/conteudos");
        rmSync(outDir, { recursive: true, force: true });

        let written = 0;
        for (const post of posts) {
          if (!post?.slug || !/^[a-z0-9-]+$/.test(post.slug)) continue;
          const html = headFor(post, baseHtml);
          const dirFile = resolve(outDir, post.slug, "index.html");
          mkdirSync(dirname(dirFile), { recursive: true });
          writeFileSync(dirFile, html, "utf8");
          writeFileSync(resolve(outDir, `${post.slug}.html`), html, "utf8");
          written += 1;
        }
        console.log(`[prerender-posts] ${written} artigos com <head> pronto em dist/conteudos/`);
      } catch (err) {
        warn(err instanceof Error ? err.message : String(err));
      }
    },
  };
}
