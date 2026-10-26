// Mantém em dia o que o servidor NÃO consegue calcular sozinho e o retrato
// usado pelos testes. O sitemap.xml e o llms.txt que vão ao ar são gerados a
// cada pedido pelas rotas de servidor (src/lib/sitemapServer.ts), lendo o
// banco; antes eram arquivos de public/ gravados no prebuild, que a
// hospedagem não rodava (bun não executa `prebuild`), e artigo novo ficava
// dias fora do sitemap (26/10/2026).
//
// Este script grava:
//  1. src/content/sitemapLastmod.json — lastmod das páginas fixas, pelo último
//     commit que tocou os arquivos de cada uma (o servidor não tem git). Sem
//     git no ambiente, mantém a data que já estava gravada.
//  2. src/content/snapshots/sitemap.xml e llms.txt — retrato do que o servidor
//     devolve com o banco de agora (fixture dos testes de links internos).
//     Precisa da chave pública do banco; sem ela ou sem rede, mantém o retrato.
//
// NUNCA pode quebrar o build: qualquer falha só imprime um aviso e sai 0.
// Roda no prebuild (npm) e à mão: `npm run sitemap`.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import {
  BASE_URL,
  LASTMOD_FILES,
  STATIC_PAGES,
  buildLlmsTxt,
  buildSitemap,
  postVideos as postVideosPure,
  unpagedPostVideoIds as unpagedPostVideoIdsPure,
  videoContext,
  videoLlmsLines as videoLlmsLinesPure,
  videoPageEntries as videoPageEntriesPure,
} from "./sitemap-build.mjs";

export { urlTag, xmlEscape } from "./sitemap-build.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LASTMOD_JSON = resolve(ROOT, "src/content/sitemapLastmod.json");
const TEMPLATE = resolve(ROOT, "src/content/llms.txt");
const SNAPSHOT_DIR = resolve(ROOT, "src/content/snapshots");
const SNAPSHOT_SITEMAP = resolve(SNAPSHOT_DIR, "sitemap.xml");
const SNAPSHOT_LLMS = resolve(SNAPSHOT_DIR, "llms.txt");

function warn(msg) {
  console.warn(`[sitemap] ${msg}`);
}

function loadEnv() {
  const env = { ...process.env };
  const envPath = resolve(ROOT, ".env");
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

// Dados reais dos vídeos (mesma fonte do VideoObject em src/lib/contentJsonLd.ts).
// Sem o arquivo, segue com cadastro vazio: este script nunca pode quebrar o build.
function readContentJson(name, fallback) {
  try {
    return JSON.parse(readFileSync(resolve(ROOT, "src/content", name), "utf8"));
  } catch {
    warn(`src/content/${name} não encontrado; seguindo sem ele.`);
    return fallback;
  }
}
const ctx = videoContext(
  readContentJson("videoMeta.json", { youtube: {}, files: {} }),
  readContentJson("videoPages.json", []),
);

// Versões com o cadastro deste repositório já aplicado (videoPages.test.tsx importa daqui).
export const videoPageEntries = () => videoPageEntriesPure(ctx);
export const postVideos = (post) => postVideosPure(post, ctx);
export const unpagedPostVideoIds = (post) => unpagedPostVideoIdsPure(post, ctx);
export const videoLlmsLines = (entries = videoPageEntries()) => videoLlmsLinesPure(entries);

/**
 * Data do último commit que tocou os arquivos de uma página fixa (YYYY-MM-DD).
 * Antes o lastmod era escrito à mão e ficava velho (TEC-05). Sem git no
 * ambiente, cai no valor de reserva informado.
 */
export function gitLastmod(files, fallback = null) {
  try {
    const args = files.map((f) => JSON.stringify(f)).join(" ");
    const out = execSync(`git log -1 --format=%cs -- ${args}`, { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : fallback;
  } catch {
    return fallback;
  }
}

function readLastmodJson() {
  try {
    return JSON.parse(readFileSync(LASTMOD_JSON, "utf8"));
  } catch {
    return {};
  }
}

/** Passo 1: datas das páginas fixas pelo git (mantém a gravada quando o git não responde). */
function updateLastmodJson() {
  const previous = readLastmodJson();
  const next = {};
  for (const page of STATIC_PAGES) {
    if (!page.files) continue;
    const path = page.loc.slice(BASE_URL.length) || "/";
    next[path] = gitLastmod(page.files, previous[path] ?? page.fallback ?? null);
  }
  for (const [key, files] of Object.entries(LASTMOD_FILES)) {
    next[key] = gitLastmod(files, previous[key] ?? null);
  }
  const text = `${JSON.stringify(next, null, 2)}\n`;
  if (!existsSync(LASTMOD_JSON) || readFileSync(LASTMOD_JSON, "utf8") !== text) {
    writeFileSync(LASTMOD_JSON, text);
    console.log(`[sitemap] ${LASTMOD_JSON.replace(`${ROOT}/`, "")} atualizado.`);
  }
  return next;
}

/** Passo 2: retrato do sitemap e do llms.txt com o banco de agora (fixture dos testes). */
async function updateSnapshots(lastmod) {
  const env = loadEnv();
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !key) {
    warn("VITE_SUPABASE_URL ou chave pública ausente — retrato em src/content/snapshots mantido como está.");
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
  // set_updated_at carimba qualquer update. Sem a migration a coluna não existe
  // (HTTP 400) e a consulta cai para created_at.
  const PROJECT_COLS = "slug,neighborhood,cover_url,created_at";
  const getProjects = async () => {
    try {
      return await get(`projects?published=eq.true&visible=eq.true&select=${PROJECT_COLS},content_updated_at`);
    } catch {
      warn("projects.content_updated_at ausente (migration 20260930120000 não aplicada); lastmod dos projetos usa created_at.");
      return get(`projects?published=eq.true&visible=eq.true&select=${PROJECT_COLS}`);
    }
  };

  let projects, posts, faqEntries;
  try {
    [projects, posts, faqEntries] = await Promise.all([
      getProjects(),
      get("bewild_posts?published=eq.true&select=slug,title,content_updated_at,published_at,created_at,body,meta_description,excerpt,youtube_video_id"),
      get("assistant_kb?ativo=eq.true&select=updated_at"),
    ]);
  } catch (err) {
    warn(`falha ao consultar o banco: ${err.message} — retrato em src/content/snapshots mantido como está.`);
    return;
  }

  if (!Array.isArray(projects) || projects.length < 6) {
    warn(`retornaram menos de 6 projetos (${projects?.length ?? 0}) — retrato mantido como está.`);
    return;
  }

  const sitemap = buildSitemap({ projects, posts, faqRows: faqEntries, lastmod, ctx });
  for (const w of sitemap.warnings) warn(w);
  mkdirSync(SNAPSHOT_DIR, { recursive: true });
  writeFileSync(SNAPSHOT_SITEMAP, sitemap.xml);
  console.log(`[sitemap] src/content/snapshots/sitemap.xml escrito (${sitemap.urls.length} URLs).`);

  if (!existsSync(TEMPLATE)) {
    warn("src/content/llms.txt (modelo) não encontrado; llms.txt não atualizado.");
    return;
  }
  const llms = buildLlmsTxt(readFileSync(TEMPLATE, "utf8"), {
    posts,
    hoodUrls: sitemap.hoodUrls,
    videoEntries: sitemap.videoEntries,
  });
  for (const w of llms.warnings) warn(w);
  writeFileSync(SNAPSHOT_LLMS, llms.text);
  console.log(`[sitemap] src/content/snapshots/llms.txt: ${llms.counts.posts} posts, ${llms.counts.bairros} bairros e ${llms.counts.videos} vídeos listados.`);
}

async function main() {
  const lastmod = updateLastmodJson();
  await updateSnapshots(lastmod);
}

// Só roda quando executado como script (os testes importam as funções).
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    warn(`erro inesperado: ${err?.message || err}`);
  });
}
