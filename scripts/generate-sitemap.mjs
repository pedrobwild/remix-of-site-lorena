// Gera public/sitemap.xml a partir do banco (REST/PostgREST) usando apenas a
// chave pública. Roda no prebuild. NUNCA pode quebrar o build: qualquer falha
// (env ausente, rede, dados insuficientes) apenas imprime um aviso e sai 0.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const BASE_URL = "https://bewild.com.br";
const OUT = resolve("public/sitemap.xml");
const LLMS = resolve("public/llms.txt");
// Cópia servida em /.well-known/llms.txt: sempre idêntica à de cima (teste em llmsTxt.test.ts).
const LLMS_COPY = resolve("public/.well-known/llms.txt");

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
      const value = m[2].trim().replace(/^["']|["']$/g, "");
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

/**
 * Data do último commit que tocou os arquivos de uma página fixa (YYYY-MM-DD).
 * Antes o lastmod era escrito à mão e ficava velho (TEC-05). Sem git no
 * ambiente de build, cai no valor de reserva informado.
 */
export function gitLastmod(files, fallback = null) {
  try {
    const args = files.map((f) => JSON.stringify(f)).join(" ");
    const out = execSync(`git log -1 --format=%cs -- ${args}`, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : fallback;
  } catch {
    return fallback;
  }
}

/** Escapa texto para XML (slug vindo do banco não pode quebrar o sitemap). */
export function xmlEscape(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function urlTag({ loc, lastmod, changefreq, priority, videos }) {
  const lm = lastmod ? `<lastmod>${xmlEscape(lastmod)}</lastmod>` : "";
  const vids = (videos ?? []).map(videoTag).join("");
  return `  <url><loc>${xmlEscape(loc)}</loc>${lm}<changefreq>${changefreq}</changefreq><priority>${priority}</priority>${vids}</url>`;
}

// Dados reais dos vídeos (mesma fonte do VideoObject em src/lib/contentJsonLd.ts).
const videoMeta = JSON.parse(readFileSync(new URL("../src/content/videoMeta.json", import.meta.url), "utf8"));
const isoSecs = (d) => {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(d || "");
  return m ? +(m[1] || 0) * 3600 + +(m[2] || 0) * 60 + +(m[3] || 0) : null;
};
const absUrl = (u) => (/^https?:/i.test(u) ? u : `${BASE_URL}${u.startsWith("/") ? u : `/${u}`}`);
const plain = (s) => String(s ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

/** Vídeos que estão no corpo do post (YouTube e <video> próprio), para o sitemap de vídeo. */
export function postVideos(post) {
  const body = post.body || "";
  const desc = plain(post.meta_description || post.excerpt || post.title).slice(0, 2048);
  const date = post.published_at || post.created_at;
  const out = [];
  for (const m of body.matchAll(/<iframe\b[^>]*>/gi)) {
    const tag = m[0];
    const src = tag.match(/\bsrc="([^"]+)"/i)?.[1]?.replace(/&amp;/g, "&");
    const id = src?.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})/i)?.[1];
    if (!id) continue;
    const start = src.match(/[?&]start=(\d+)/)?.[1];
    const meta = videoMeta.youtube[id] ?? {};
    out.push({
      thumb: meta.thumbnailUrl || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      title: plain(meta.name || tag.match(/\btitle="([^"]+)"/i)?.[1] || post.title),
      desc: meta.description || desc,
      player: `https://www.youtube-nocookie.com/embed/${id}${start ? `?start=${start}` : ""}`,
      secs: isoSecs(meta.duration),
      date,
    });
  }
  for (const m of body.matchAll(/<video\b[^>]*>[\s\S]*?<\/video>/gi)) {
    const v = m[0];
    const src = v.match(/<source\b[^>]*\bsrc="([^"]+)"/i)?.[1] || v.match(/\bsrc="([^"]+)"/i)?.[1];
    const poster = v.match(/\bposter="([^"]+)"/i)?.[1];
    if (!src || !poster) continue;
    const meta = videoMeta.files[src] ?? {};
    const label = v.match(/\baria-label="([^"]+)"/i)?.[1]?.replace(/^V[ií]deo:\s*/i, "");
    out.push({
      thumb: absUrl(meta.thumbnailUrl || poster),
      title: plain(meta.name || label || post.title),
      desc: meta.description || desc,
      content: absUrl(src),
      secs: isoSecs(meta.duration),
      date,
    });
  }
  return out;
}

function videoTag(v) {
  const loc = v.content
    ? `<video:content_loc>${xmlEscape(v.content)}</video:content_loc>`
    : `<video:player_loc>${xmlEscape(v.player)}</video:player_loc>`;
  const dur = v.secs ? `<video:duration>${v.secs}</video:duration>` : "";
  const pd = v.date ? `<video:publication_date>${xmlEscape(new Date(v.date).toISOString())}</video:publication_date>` : "";
  return `<video:video><video:thumbnail_loc>${xmlEscape(v.thumb)}</video:thumbnail_loc><video:title>${xmlEscape(v.title.slice(0, 100))}</video:title><video:description>${xmlEscape(v.desc)}</video:description>${loc}${dur}${pd}<video:family_friendly>yes</video:family_friendly></video:video>`;
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

  // Projetos: lastmod = content_updated_at (edição real de conteúdo, migration
  // 20260930120000) com fallback em created_at. NUNCA updated_at: o trigger
  // set_updated_at carimba qualquer update, e o lote de 27/09/2026 marcou os
  // 162 projetos com a mesma data. Enquanto a migration não estiver aplicada a
  // coluna não existe (HTTP 400) e a consulta cai para created_at.
  const PROJECT_COLS = "slug,neighborhood,cover_url,created_at";
  const getProjects = async () => {
    try {
      return await get(`projects?published=eq.true&visible=eq.true&select=${PROJECT_COLS},content_updated_at`);
    } catch {
      console.warn("[sitemap] projects.content_updated_at ausente (migration 20260930120000 não aplicada); lastmod dos projetos usa created_at.");
      return get(`projects?published=eq.true&visible=eq.true&select=${PROJECT_COLS}`);
    }
  };

  let projects, posts, faqEntries;
  try {
    [projects, posts, faqEntries] = await Promise.all([
      getProjects(),
      // Posts: content_updated_at (edição real) — nunca updated_at (lote 06/10/2026).
      get("bewild_posts?published=eq.true&select=slug,title,content_updated_at,published_at,created_at,body,meta_description,excerpt").catch(() =>
        get("bewild_posts?published=eq.true&select=slug,title,published_at,created_at,body,meta_description,excerpt")),
      get("assistant_kb?ativo=eq.true&select=updated_at"),
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

  const page = (route, pages, fallback = null) =>
    gitLastmod([route, ...pages].map((f) => (f.startsWith("src/") ? f : `src/pages/${f}`)), fallback);

  const staticUrls = [
    {
      loc: `${BASE_URL}/`,
      lastmod: page("src/routes/index.tsx", ["HomePage.tsx", "home-bwa-body.ts"], "2026-10-02"),
      changefreq: "weekly",
      priority: "1.0",
    },
    {
      loc: `${BASE_URL}/portfolio`,
      lastmod: newest(projects, "content_updated_at", "created_at"),
      changefreq: "weekly",
      priority: "0.9",
    },
    {
      loc: `${BASE_URL}/conteudos`,
      lastmod: day("2026-09-23", posts.length ? newest(posts, "content_updated_at", "published_at", "created_at") : null),
      changefreq: "weekly",
      priority: "0.8",
    },
    { loc: `${BASE_URL}/orcamento`, lastmod: page("src/routes/orcamento.tsx", ["OrcamentoPage.tsx"]), changefreq: "monthly", priority: "0.9" },
    {
      loc: `${BASE_URL}/faq`,
      lastmod: Array.isArray(faqEntries) ? newest(faqEntries, "updated_at") : null,
      changefreq: "monthly",
      priority: "0.7",
    },
    { loc: `${BASE_URL}/autorizacao-condominio`, lastmod: page("src/routes/autorizacao-condominio.tsx", ["AutorizacaoCondominioPage.tsx"]), changefreq: "monthly", priority: "0.7" },
    { loc: `${BASE_URL}/contato`, lastmod: page("src/routes/contato.tsx", ["ContatoPage.tsx"], "2026-09-26"), changefreq: "monthly", priority: "0.7" },
    // /mapa repete o endereço e o mapa de /contato: noindex, fora do sitemap (TEC-05).
    { loc: `${BASE_URL}/mapa-do-site`, changefreq: "weekly", priority: "0.5" },
    { loc: `${BASE_URL}/servicos`, lastmod: page("src/routes/servicos.tsx", ["ServicosPage.tsx"], "2026-09-29"), changefreq: "monthly", priority: "0.9" },
    { loc: `${BASE_URL}/escopo`, lastmod: page("src/routes/escopo.tsx", ["EscopoPage.tsx"]), changefreq: "monthly", priority: "0.7" },
    { loc: `${BASE_URL}/como-funciona`, lastmod: page("src/routes/como-funciona.tsx", ["ComoFuncionaPage.tsx", "src/content/etapas.ts"]), changefreq: "monthly", priority: "0.7" },
    { loc: `${BASE_URL}/onde-atuamos`, lastmod: page("src/routes/onde-atuamos.tsx", ["OndeAtuamosPage.tsx", "src/lib/bairrosSp.ts"]), changefreq: "monthly", priority: "0.7" },
    { loc: `${BASE_URL}/reforma-de-apartamento-sao-paulo`, lastmod: page("src/routes/reforma-de-apartamento-sao-paulo.tsx", ["ReformaApartamentoSpPage.tsx"], "2026-09-23"), changefreq: "monthly", priority: "0.9" },
    { loc: `${BASE_URL}/reforma-de-studio-sao-paulo`, lastmod: page("src/routes/reforma-de-studio-sao-paulo.tsx", ["ReformaStudioSpPage.tsx"], "2026-09-23"), changefreq: "monthly", priority: "0.9" },
    { loc: `${BASE_URL}/reforma-de-cobertura-sao-paulo`, lastmod: page("src/routes/reforma-de-cobertura-sao-paulo.tsx", ["ReformaCoberturaSpPage.tsx"], "2026-09-23"), changefreq: "monthly", priority: "0.9" },
    { loc: `${BASE_URL}/marcenaria`, lastmod: page("src/routes/marcenaria.tsx", ["MarcenariaPage.tsx"], "2026-09-23"), changefreq: "monthly", priority: "0.9" },
    { loc: `${BASE_URL}/parceiros`, lastmod: page("src/routes/parceiros.index.tsx", ["ParceirosPage.tsx"]), changefreq: "monthly", priority: "0.7" },
    { loc: `${BASE_URL}/parceiros/incorporadoras`, lastmod: page("src/routes/parceiros.incorporadoras.tsx", ["IncorporadorasPage.tsx", "src/content/incorporadoras.ts"], "2026-09-23"), changefreq: "monthly", priority: "0.8" },
    { loc: `${BASE_URL}/indique-um-amigo`, lastmod: page("src/routes/indique-um-amigo.tsx", ["IndiquePage.tsx"]), changefreq: "monthly", priority: "0.7" },
    { loc: `${BASE_URL}/marcas-e-parcerias`, lastmod: page("src/routes/marcas-e-parcerias.tsx", ["MarcasParceriasPage.tsx"], "2026-09-23"), changefreq: "monthly", priority: "0.7" },
    // lastmod = GUIA_MODIFIED de src/guia/data/guiaMeta.ts (conferido em teste).
    { loc: `${BASE_URL}/guia-do-investidor`, lastmod: "2026-09-23", changefreq: "monthly", priority: "0.8" },
    { loc: `${BASE_URL}/privacidade`, lastmod: page("src/routes/privacidade.tsx", ["PrivacidadePage.tsx"]), changefreq: "yearly", priority: "0.3" },
    // /preferencias-de-cookies é página de configuração: noindex, fora do sitemap (TEC-05).
    { loc: `${BASE_URL}/acessibilidade`, lastmod: page("src/routes/acessibilidade.tsx", ["AcessibilidadePage.tsx"]), changefreq: "yearly", priority: "0.3" },
  ];

  const projectUrls = projects
    .filter((p) => p.slug)
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((p) => ({
      loc: `${BASE_URL}/portfolio/${p.slug}`,
      lastmod: day(p.content_updated_at, p.created_at),
      changefreq: "monthly",
      priority: "0.7",
    }));

  // Páginas por bairro (/reforma/<bairro>): mesma regra de src/lib/portfolioFilter.ts.
  const hoodSlug = (v) =>
    String(v).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const mostCommon = (values) =>
    [...values.reduce((m, v) => m.set(v, (m.get(v) ?? 0) + 1), new Map()).entries()].sort((a, b) => b[1] - a[1])[0][0];
  const hoods = new Map();
  for (const p of projects) {
    if (!p.neighborhood || !p.cover_url) continue;
    const s = hoodSlug(p.neighborhood);
    if (!s) continue;
    const h = hoods.get(s) ?? { n: 0, rows: [] };
    h.n++; h.rows.push(p); hoods.set(s, h);
  }
  const hoodUrls = [...hoods.entries()]
    .filter(([, h]) => h.n >= 3)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([s, h]) => ({
      loc: `${BASE_URL}/reforma/${s}`,
      lastmod: newest(h.rows, "content_updated_at", "created_at"),
      changefreq: "monthly",
      priority: "0.8",
      // Grafia mais usada do bairro e contagem: só para o llms.txt (urlTag ignora).
      label: mostCommon(h.rows.map((p) => String(p.neighborhood).trim())),
      count: h.n,
    }));

  const postUrls = posts
    .filter((p) => p.slug)
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((p) => ({
      loc: `${BASE_URL}/conteudos/${p.slug}`,
      lastmod: day(p.content_updated_at, p.published_at, p.created_at),
      changefreq: "monthly",
      priority: "0.6",
      videos: postVideos(p),
    }));

  const all = [...staticUrls, ...hoodUrls, ...projectUrls, ...postUrls];
  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">`,
    ...all.map(urlTag),
    `</urlset>`,
    ``,
  ].join("\n");

  writeFileSync(OUT, xml);
  console.log(`[sitemap] public/sitemap.xml escrito (${all.length} URLs).`);
  updateLlmsTxt(posts, hoodUrls);
}

/**
 * Mantém a seção "Conteúdos publicados" do public/llms.txt em dia (plano
 * SEO + IA: os posts precisam estar listados para os crawlers de IA). Só
 * mexe no trecho entre os marcadores; sem marcadores, não toca no arquivo.
 */
function replaceBetween(txt, start, end, lines, what) {
  const a = txt.indexOf(start);
  const b = txt.indexOf(end);
  if (a === -1 || b === -1 || b < a) {
    warn(`llms.txt sem marcadores ${what}; lista não atualizada`);
    return txt;
  }
  return `${txt.slice(0, a + start.length)}\n${lines.join("\n")}\n${txt.slice(b)}`;
}

function updateLlmsTxt(posts, hoodUrls = []) {
  if (!existsSync(LLMS)) return;
  const txt = readFileSync(LLMS, "utf8");
  const postLines = posts
    .filter((p) => p.slug && p.title)
    .sort((x, y) => String(y.published_at || y.created_at || "").localeCompare(String(x.published_at || x.created_at || "")))
    .map((p) => `- [${String(p.title).replace(/[[\]]/g, "")}](/conteudos/${p.slug})`);
  // Páginas de bairro (/reforma/<bairro>): mesma lista do sitemap, com a contagem.
  const hoodLines = hoodUrls.map(
    (h) => `- [Reforma de apartamento em ${h.label}](${h.loc.replace(BASE_URL, "")}): ${h.count} projetos entregues`,
  );
  let next = replaceBetween(txt, "<!-- posts:start -->", "<!-- posts:end -->", postLines, "posts:start/posts:end");
  next = replaceBetween(next, "<!-- bairros:start -->", "<!-- bairros:end -->", hoodLines, "bairros:start/bairros:end");
  if (next !== txt) {
    writeFileSync(LLMS, next);
    console.log(`[sitemap] public/llms.txt: ${postLines.length} posts e ${hoodLines.length} bairros listados.`);
  }
  // A cópia em .well-known não é editada à mão: segue o llms.txt principal.
  if (existsSync(LLMS_COPY) && readFileSync(LLMS_COPY, "utf8") !== next) {
    writeFileSync(LLMS_COPY, next);
    console.log("[sitemap] public/.well-known/llms.txt sincronizado com public/llms.txt.");
  }
}

// Só roda quando executado como script (o teste importa xmlEscape/urlTag).
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    warn(`erro inesperado: ${err?.message || err}`);
  });
}
