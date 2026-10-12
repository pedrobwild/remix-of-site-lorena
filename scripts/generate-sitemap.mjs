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

const CHART_SLUGS = ["reformar-apartamento-para-vender-ou-alugar-sp"];

export function urlTag({ loc, lastmod, changefreq, priority, videos }) {
  const lm = lastmod ? `<lastmod>${xmlEscape(lastmod)}</lastmod>` : "";
  const vids = (videos ?? []).map(videoTag).join("");
  return `  <url><loc>${xmlEscape(loc)}</loc>${lm}<changefreq>${changefreq}</changefreq><priority>${priority}</priority>${vids}</url>`;
}

// Dados reais dos vídeos (mesma fonte do VideoObject em src/lib/contentJsonLd.ts).
// Lido ao lado do script; no teste (vitest) import.meta.url não é um arquivo, então
// vale o caminho a partir da raiz do projeto. Sem o arquivo, segue com cadastro vazio:
// este script nunca pode quebrar o build.
function readContentJson(name, fallback) {
  for (const candidate of [
    () => fileURLToPath(new URL(`../src/content/${name}`, import.meta.url)),
    () => resolve("src/content", name),
  ]) {
    try {
      return JSON.parse(readFileSync(candidate(), "utf8"));
    } catch {
      /* tenta o próximo caminho */
    }
  }
  console.warn(`[sitemap] src/content/${name} não encontrado; seguindo sem ele.`);
  return fallback;
}
const videoMeta = readContentJson("videoMeta.json", { youtube: {}, files: {} });
const isoSecs = (d) => {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(d || "");
  return m ? +(m[1] || 0) * 3600 + +(m[2] || 0) * 60 + +(m[3] || 0) : null;
};
const absUrl = (u) => (/^https?:/i.test(u) ? u : `${BASE_URL}${u.startsWith("/") ? u : `/${u}`}`);
const plain = (s) => String(s ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

// Páginas de vídeo (/videos/<slug>): o Google só indexa vídeo que está na página
// própria dele, então é nela que a entrada <video:video> vai. Mesmo cadastro e a
// mesma junção de src/lib/videoPages.ts (paridade em videoPages.test.tsx).
const videoPages = readContentJson("videoPages.json", []);
const pagedYouTube = new Set(videoPages.map((p) => p.youtube).filter(Boolean));
const pagedFiles = new Set(videoPages.map((p) => p.file).filter(Boolean));

/** Data do vídeo com fuso (mesma regra de videoUploadDate em src/lib/videoMeta.ts). */
export function videoDate(value) {
  const v = String(value ?? "").trim();
  if (!v) return null;
  let iso = v;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) iso = `${v}T00:00:00-03:00`;
  else if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(v)) iso = `${v.replace(" ", "T")}Z`;
  else if (/^\d{4}-\d{2}-\d{2} \d/.test(v)) iso = v.replace(" ", "T");
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}

/** Uma entrada por página de vídeo: endereço da página e os dados do vídeo dela. */
export function videoPageEntries() {
  return videoPages.map((p) => {
    const meta = (p.youtube ? videoMeta.youtube[p.youtube] : videoMeta.files[p.file]) ?? {};
    const thumb = meta.thumbnailUrl || (p.youtube ? `https://i.ytimg.com/vi/${p.youtube}/hqdefault.jpg` : "");
    return {
      slug: p.slug,
      loc: `${BASE_URL}/videos/${p.slug}`,
      name: plain(meta.name || p.title),
      kind: p.kind,
      duration: meta.duration ?? null,
      video: {
        thumb: absUrl(thumb),
        title: plain(meta.name || p.title),
        desc: plain(meta.description || p.description).slice(0, 2048),
        ...(p.youtube
          ? { player: `https://www.youtube-nocookie.com/embed/${p.youtube}` }
          : { content: absUrl(p.file) }),
        secs: isoSecs(meta.duration),
        date: videoDate(meta.uploadDate),
      },
    };
  });
}

/**
 * Vídeos que estão no corpo do post (YouTube e <video> próprio) para o sitemap de
 * vídeo. Vídeo que já tem página própria em /videos NÃO entra aqui: a entrada dele
 * fica na página do vídeo, a única que o Google aceita indexar como vídeo. O que
 * sobra é o vídeo ainda sem página (aviso no fim da geração).
 */
export function postVideos(post) {
  const body = post.body || "";
  const desc = plain(post.meta_description || post.excerpt || post.title).slice(0, 2048);
  const postDate = post.published_at || post.created_at;
  const out = [];
  const seen = new Set();
  for (const m of body.matchAll(/<iframe\b[^>]*>/gi)) {
    const tag = m[0];
    const src = tag.match(/\bsrc="([^"]+)"/i)?.[1]?.replace(/&amp;/g, "&");
    const id = src?.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})/i)?.[1];
    if (!id || pagedYouTube.has(id) || seen.has(id)) continue;
    seen.add(id);
    const start = src.match(/[?&]start=(\d+)/)?.[1];
    const meta = videoMeta.youtube[id] ?? {};
    out.push({
      id,
      thumb: meta.thumbnailUrl || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      title: plain(meta.name || tag.match(/\btitle="([^"]+)"/i)?.[1] || post.title),
      desc: meta.description || desc,
      player: `https://www.youtube-nocookie.com/embed/${id}${start ? `?start=${start}` : ""}`,
      secs: isoSecs(meta.duration),
      date: videoDate(meta.uploadDate) || postDate,
    });
  }
  for (const m of body.matchAll(/<video\b[^>]*>[\s\S]*?<\/video>/gi)) {
    const v = m[0];
    const src = v.match(/<source\b[^>]*\bsrc="([^"]+)"/i)?.[1] || v.match(/\bsrc="([^"]+)"/i)?.[1];
    const poster = v.match(/\bposter="([^"]+)"/i)?.[1];
    if (!src || !poster || pagedFiles.has(src)) continue;
    const meta = videoMeta.files[src] ?? {};
    const label = v.match(/\baria-label="([^"]+)"/i)?.[1]?.replace(/^V[ií]deo:\s*/i, "");
    out.push({
      id: src,
      thumb: absUrl(meta.thumbnailUrl || poster),
      title: plain(meta.name || label || post.title),
      desc: meta.description || desc,
      content: absUrl(src),
      secs: isoSecs(meta.duration),
      date: videoDate(meta.uploadDate) || postDate,
    });
  }
  return out;
}

/** IDs/arquivos de vídeo de um post que ainda não têm página em /videos (abertura e corpo). */
export function unpagedPostVideoIds(post) {
  const ids = postVideos(post).map((v) => v.id);
  const lead = String(post.youtube_video_id ?? "").trim();
  if (/^[\w-]{11}$/.test(lead) && !pagedYouTube.has(lead) && !ids.includes(lead)) ids.unshift(lead);
  return ids;
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
      get("bewild_posts?published=eq.true&select=slug,title,content_updated_at,published_at,created_at,body,meta_description,excerpt,youtube_video_id"),
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
    // Índice dos vídeos; as páginas de cada vídeo saem mais abaixo, com <video:video>.
    { loc: `${BASE_URL}/videos`, lastmod: page("src/routes/videos.index.tsx", ["VideosPage.tsx", "src/content/videoPages.json"]), changefreq: "monthly", priority: "0.7" },
    { loc: `${BASE_URL}/orcamento`, lastmod: page("src/routes/orcamento.tsx", ["OrcamentoPage.tsx"]), changefreq: "monthly", priority: "1.0" },
    { loc: `${BASE_URL}/escopo`, lastmod: page("src/routes/escopo.tsx", ["EscopoPage.tsx", "src/lib/escopoCalc.ts"]), changefreq: "monthly", priority: "0.8" },
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
    { loc: `${BASE_URL}/como-funciona`, lastmod: page("src/routes/como-funciona.tsx", ["ComoFuncionaPage.tsx", "src/content/etapas.ts"]), changefreq: "monthly", priority: "0.7" },
    { loc: `${BASE_URL}/onde-atuamos`, lastmod: page("src/routes/onde-atuamos.tsx", ["OndeAtuamosPage.tsx", "src/lib/bairrosSp.ts"]), changefreq: "monthly", priority: "0.7" },
    { loc: `${BASE_URL}/reforma-de-apartamento-sao-paulo`, lastmod: page("src/routes/reforma-de-apartamento-sao-paulo.tsx", ["ReformaApartamentoSpPage.tsx"], "2026-09-23"), changefreq: "monthly", priority: "0.9" },
    { loc: `${BASE_URL}/reforma-de-studio-sao-paulo`, lastmod: page("src/routes/reforma-de-studio-sao-paulo.tsx", ["ReformaStudioSpPage.tsx"], "2026-09-23"), changefreq: "monthly", priority: "0.9" },
    { loc: `${BASE_URL}/reforma-de-cobertura-sao-paulo`, lastmod: page("src/routes/reforma-de-cobertura-sao-paulo.tsx", ["ReformaCoberturaSpPage.tsx"], "2026-09-23"), changefreq: "monthly", priority: "0.9" },
    { loc: `${BASE_URL}/marcenaria`, lastmod: page("src/routes/marcenaria.tsx", ["MarcenariaPage.tsx"], "2026-09-23"), changefreq: "monthly", priority: "0.9" },
    { loc: `${BASE_URL}/parceiros`, lastmod: page("src/routes/parceiros.index.tsx", ["ParceirosPage.tsx"]), changefreq: "monthly", priority: "0.7" },
    { loc: `${BASE_URL}/parceiros/incorporadoras`, lastmod: page("src/routes/parceiros.incorporadoras.tsx", ["IncorporadorasPage.tsx", "src/content/incorporadoras.ts"], "2026-09-23"), changefreq: "monthly", priority: "0.8" },
    { loc: `${BASE_URL}/parceiros/leal-moreira`, lastmod: page("src/routes/parceiros.leal-moreira.tsx", ["LealMoreiraPage.tsx", "src/content/lealMoreira.ts"], "2026-10-11"), changefreq: "monthly", priority: "0.7" },
    { loc: `${BASE_URL}/indique-um-amigo`, lastmod: page("src/routes/indique-um-amigo.tsx", ["IndiquePage.tsx"]), changefreq: "monthly", priority: "0.7" },
    { loc: `${BASE_URL}/marcas-e-parcerias`, lastmod: page("src/routes/marcas-e-parcerias.tsx", ["MarcasParceriasPage.tsx"], "2026-09-23"), changefreq: "monthly", priority: "0.7" },
    // lastmod = GUIA_MODIFIED de src/guia/data/guiaMeta.ts (conferido em teste).
    { loc: `${BASE_URL}/guia-do-investidor`, lastmod: "2026-09-23", changefreq: "monthly", priority: "0.8" },
    { loc: `${BASE_URL}/privacidade`, lastmod: page("src/routes/privacidade.tsx", ["PrivacidadePage.tsx"]), changefreq: "yearly", priority: "0.3" },
    { loc: `${BASE_URL}/politica-de-cookies`, lastmod: page("src/routes/politica-de-cookies.tsx", ["PoliticaCookiesPage.tsx"]), changefreq: "yearly", priority: "0.3" },
    // /preferencias-de-cookies é página de configuração: noindex, fora do sitemap (TEC-05).
    { loc: `${BASE_URL}/acessibilidade`, lastmod: page("src/routes/acessibilidade.tsx", ["AcessibilidadePage.tsx"]), changefreq: "yearly", priority: "0.3" },
    { loc: `${BASE_URL}/autores`, lastmod: page("src/routes/autores.tsx", ["AutoresPage.tsx", "src/lib/orgJsonLd.ts"]), changefreq: "monthly", priority: "0.5" },
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
  // Título, H1 e descrição da página de bairro saem do código (BairroPage e
  // bairroSeo): mudança ali também é mudança da página. Sem isto, a troca do
  // título em 11/10/2026 não aparecia no lastmod de nenhum bairro.
  const hoodPageLastmod = page("src/pages/BairroPage.tsx", ["src/lib/bairroSeo.ts"]);
  const hoodUrls = [...hoods.entries()]
    .filter(([, h]) => h.n >= 3)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([s, h]) => ({
      loc: `${BASE_URL}/reforma/${s}`,
      lastmod: day(newest(h.rows, "content_updated_at", "created_at"), hoodPageLastmod),
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

  // Páginas de gráficos (/graficos/<slug>): mantenha em sincronia com src/content/chartSets.ts.
  const chartUrls = CHART_SLUGS.map((slug) => {
    const post = posts.find((p) => p.slug === slug);
    return {
      loc: `${BASE_URL}/graficos/${slug}`,
      lastmod: day(post?.content_updated_at, post?.published_at, post?.created_at),
      changefreq: "monthly",
      priority: "0.5",
    };
  });

  // Páginas de vídeo (/videos/<slug>): uma por vídeo, com a entrada <video:video>.
  // lastmod = último commit na página ou nos dois cadastros (o arquivo da rota tem "$"
  // no nome, que o shell do git log expandiria; por isso ele não entra na lista).
  const videoLastmod = gitLastmod([
    "src/pages/VideoWatchPage.tsx",
    "src/lib/videoPages.ts",
    "src/content/videoPages.json",
    "src/content/videoMeta.json",
  ]);
  const videoEntries = videoPageEntries();
  const videoUrls = videoEntries.map((v) => ({
    loc: v.loc,
    lastmod: videoLastmod,
    changefreq: "monthly",
    priority: "0.6",
    videos: [v.video],
  }));

  // Vídeo publicado num artigo e ainda sem página própria: o Google não o indexa.
  // O de abertura (youtube_video_id) só toca com clique, então nem entra no sitemap.
  for (const post of posts) {
    const ids = unpagedPostVideoIds(post);
    if (ids.length) {
      console.warn(`[sitemap] /conteudos/${post.slug}: vídeo ${ids.join(", ")} ainda sem página em /videos; cadastre em src/content/videoPages.json.`);
    }
  }

  const all = [...staticUrls, ...hoodUrls, ...projectUrls, ...postUrls, ...chartUrls, ...videoUrls];
  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">`,
    ...all.map(urlTag),
    `</urlset>`,
    ``,
  ].join("\n");

  writeFileSync(OUT, xml);
  console.log(`[sitemap] public/sitemap.xml escrito (${all.length} URLs).`);
  updateLlmsTxt(posts, hoodUrls, videoEntries);
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

/** "9 min 49 s" a partir de "PT9M49S" (vazio quando a duração não é conhecida). */
function durationLabel(iso) {
  const total = isoSecs(iso);
  if (!total) return "";
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  return [h ? `${h} h` : "", m ? `${m} min` : "", s ? `${s} s` : ""].filter(Boolean).join(" ");
}

/** Linhas do llms.txt para as páginas de vídeo (também conferidas em videoPages.test.tsx). */
export function videoLlmsLines(entries = videoPageEntries()) {
  return entries.map((v) => {
    const dur = durationLabel(v.duration);
    return `- [${v.name.replace(/[[\]]/g, "")}](/videos/${v.slug}): ${v.kind}${dur ? `, ${dur}` : ""}`;
  });
}

function updateLlmsTxt(posts, hoodUrls = [], videoEntries = []) {
  if (!existsSync(LLMS)) return;
  const txt = readFileSync(LLMS, "utf8");
  const postLines = posts
    .filter((p) => p.slug && p.title)
    // Mais recentes primeiro; no empate de data (posts publicados no mesmo lote),
    // ordem alfabética do slug — sem isso a ordem dependia da ordem em que o
    // banco devolvia as linhas e o arquivo mudava a cada geração.
    .sort(
      (x, y) =>
        String(y.published_at || y.created_at || "").localeCompare(String(x.published_at || x.created_at || "")) ||
        String(x.slug).localeCompare(String(y.slug)),
    )
    .map((p) => `- [${String(p.title).replace(/[[\]]/g, "")}](/conteudos/${p.slug})`);
  // Páginas de bairro (/reforma/<bairro>): mesma lista do sitemap, com a contagem.
  // O rótulo acompanha o título da página (bairroTitle em src/lib/bairroSeo.ts).
  const hoodLines = hoodUrls.map(
    (h) => `- [Reforma de apartamento e studio em ${h.label}](${h.loc.replace(BASE_URL, "")}): ${h.count} projetos entregues`,
  );
  let next = replaceBetween(txt, "<!-- posts:start -->", "<!-- posts:end -->", postLines, "posts:start/posts:end");
  next = replaceBetween(next, "<!-- bairros:start -->", "<!-- bairros:end -->", hoodLines, "bairros:start/bairros:end");
  next = replaceBetween(next, "<!-- videos:start -->", "<!-- videos:end -->", videoLlmsLines(videoEntries), "videos:start/videos:end");
  if (next !== txt) {
    writeFileSync(LLMS, next);
    console.log(`[sitemap] public/llms.txt: ${postLines.length} posts, ${hoodLines.length} bairros e ${videoEntries.length} vídeos listados.`);
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
