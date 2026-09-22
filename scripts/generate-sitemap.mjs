// Gera public/sitemap.xml a partir do banco (REST/PostgREST) usando apenas a
// chave pública. Roda no prebuild. NUNCA pode quebrar o build: qualquer falha
// (env ausente, rede, dados insuficientes) apenas imprime um aviso e sai 0.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const BASE_URL = "https://bewild.com.br";
const OUT = resolve("public/sitemap.xml");
const LLMS = resolve("public/llms.txt");

function warn(msg) {
  console.warn(`[sitemap] ${msg} — public/sitemap.xml mantido como está.`);
}

function loadEnv() {
  const env = { ...process.env };
  const envPath = resolve(".env");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      let value = m[2].trim().replace(/^["']|["']$/g, "");
      if (!env[key]) env[key] = value;
    }
  }
  return env;
}

function day(...candidates) {
  const times = candidates
    .filter(Boolean)
    .map((v) => Date.parse(v))
    .filter((t) => Number.isFinite(t));
  if (!times.length) return null;
  return new Date(Math.max(...times)).toISOString().slice(0, 10);
}

function urlTag({ loc, lastmod, changefreq, priority }) {
  const lm = lastmod ? `<lastmod>${lastmod}</lastmod>` : "";
  return `  <url><loc>${loc}</loc>${lm}<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

async function main() {
  const env = loadEnv();
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !key) {
    warn("VITE_SUPABASE_URL ou chave pública ausente");
    return;
  }

  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const get = async (path) => {
    const res = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/${path}`, { headers });
    if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
    return res.json();
  };

  let projects, posts;
  try {
    [projects, posts] = await Promise.all([
      get("projects?published=eq.true&visible=eq.true&select=slug,updated_at,created_at"),
      get("bewild_posts?published=eq.true&select=slug,title,updated_at,published_at,created_at"),
    ]);
  } catch (err) {
    warn(`falha ao consultar o banco: ${err.message}`);
    return;
  }

  if (!Array.isArray(projects) || projects.length < 6) {
    warn(`retornaram menos de 6 projetos (${projects?.length ?? 0})`);
    return;
  }
  if (!Array.isArray(posts)) posts = [];

  const newest = (rows, ...fields) => {
    const days = rows.map((r) => day(...fields.map((f) => r[f]))).filter(Boolean).sort();
    return days.length ? days[days.length - 1] : null;
  };

  const staticUrls = [
    { loc: `${BASE_URL}/`, changefreq: "weekly", priority: "1.0" },
    {
      loc: `${BASE_URL}/portfolio`,
      lastmod: newest(projects, "updated_at", "created_at"),
      changefreq: "weekly",
      priority: "0.9",
    },
    { loc: `${BASE_URL}/diagnostico`, changefreq: "monthly", priority: "0.9" },
    {
      loc: `${BASE_URL}/conteudos`,
      lastmod: posts.length ? newest(posts, "updated_at", "published_at", "created_at") : null,
      changefreq: "weekly",
      priority: "0.8",
    },
    { loc: `${BASE_URL}/orcamento`, changefreq: "monthly", priority: "0.9" },
    { loc: `${BASE_URL}/faq`, changefreq: "monthly", priority: "0.7" },
    { loc: `${BASE_URL}/autorizacao-condominio`, changefreq: "monthly", priority: "0.7" },
    { loc: `${BASE_URL}/contato`, changefreq: "monthly", priority: "0.7" },
    { loc: `${BASE_URL}/escopo`, changefreq: "monthly", priority: "0.7" },
    { loc: `${BASE_URL}/como-funciona`, changefreq: "monthly", priority: "0.7" },
    { loc: `${BASE_URL}/onde-atuamos`, changefreq: "monthly", priority: "0.7" },
    { loc: `${BASE_URL}/parceiros`, changefreq: "monthly", priority: "0.7" },
    { loc: `${BASE_URL}/guia-do-investidor`, changefreq: "monthly", priority: "0.8" },
    { loc: `${BASE_URL}/privacidade`, changefreq: "yearly", priority: "0.3" },
  ];

  const projectUrls = projects
    .filter((p) => p.slug)
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((p) => ({
      loc: `${BASE_URL}/portfolio/${p.slug}`,
      lastmod: day(p.updated_at, p.created_at),
      changefreq: "monthly",
      priority: "0.7",
    }));

  const postUrls = posts
    .filter((p) => p.slug)
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((p) => ({
      loc: `${BASE_URL}/conteudos/${p.slug}`,
      lastmod: day(p.updated_at, p.published_at, p.created_at),
      changefreq: "monthly",
      priority: "0.6",
    }));

  const all = [...staticUrls, ...projectUrls, ...postUrls];
  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...all.map(urlTag),
    `</urlset>`,
    ``,
  ].join("\n");

  writeFileSync(OUT, xml);
  console.log(`[sitemap] public/sitemap.xml escrito (${all.length} URLs).`);
  updateLlmsTxt(posts);
}

/**
 * Mantém a seção "Conteúdos publicados" do public/llms.txt em dia (plano
 * SEO + IA: os posts precisam estar listados para os crawlers de IA). Só
 * mexe no trecho entre os marcadores; sem marcadores, não toca no arquivo.
 */
function updateLlmsTxt(posts) {
  if (!existsSync(LLMS)) return;
  const start = "<!-- posts:start -->";
  const end = "<!-- posts:end -->";
  const txt = readFileSync(LLMS, "utf8");
  const a = txt.indexOf(start);
  const b = txt.indexOf(end);
  if (a === -1 || b === -1 || b < a) {
    warn("llms.txt sem marcadores posts:start/posts:end; lista de posts não atualizada");
    return;
  }
  const lines = posts
    .filter((p) => p.slug && p.title)
    .sort((x, y) => String(y.published_at || y.created_at || "").localeCompare(String(x.published_at || x.created_at || "")))
    .map((p) => `- [${String(p.title).replace(/[\[\]]/g, "")}](/conteudos/${p.slug})`);
  const next = `${txt.slice(0, a + start.length)}\n${lines.join("\n")}\n${txt.slice(b)}`;
  if (next !== txt) {
    writeFileSync(LLMS, next);
    console.log(`[sitemap] public/llms.txt: ${lines.length} posts listados.`);
  }
}

main().catch((err) => {
  warn(`erro inesperado: ${err?.message || err}`);
});
