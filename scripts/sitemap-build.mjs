/**
 * Montagem do sitemap.xml e do llms.txt — módulo PURO, sem Node, sem fetch e
 * sem acesso a arquivo, para ser usado por dois chamadores:
 *
 *  - as rotas de servidor `/sitemap.xml` e `/llms.txt` (src/lib/sitemapServer.ts),
 *    que leem o banco a cada pedido (com memo curto) — é o que vai ao ar;
 *  - o script scripts/generate-sitemap.mjs, que grava o retrato commitado em
 *    src/content/snapshots/ (fixture dos testes) e as datas das páginas fixas
 *    em src/content/sitemapLastmod.json (vêm do git, que o servidor não tem).
 *
 * Tudo que depende do ambiente (cadastro de vídeos, datas do git, linhas do
 * banco) entra por parâmetro. Mudança de regra aqui vale para os dois lados;
 * a edge function `sitemap` (Deno) repete a regra e é conferida pelos testes.
 */

export const BASE_URL = "https://bewild.com.br";

/** Escapa texto para XML (slug vindo do banco não pode quebrar o sitemap). */
export function xmlEscape(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Dia (YYYY-MM-DD) mais recente entre as datas informadas; null sem data válida. */
export function day(...candidates) {
  const times = candidates
    .filter(Boolean)
    .map((v) => Date.parse(v))
    .filter((t) => Number.isFinite(t));
  if (!times.length) return null;
  return new Date(Math.max(...times)).toISOString().slice(0, 10);
}

export function urlTag({ loc, lastmod, changefreq, priority, videos }) {
  const lm = lastmod ? `<lastmod>${xmlEscape(lastmod)}</lastmod>` : "";
  const vids = (videos ?? []).map(videoTag).join("");
  return `  <url><loc>${xmlEscape(loc)}</loc>${lm}<changefreq>${changefreq}</changefreq><priority>${priority}</priority>${vids}</url>`;
}

export const isoSecs = (d) => {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(d || "");
  return m ? +(m[1] || 0) * 3600 + +(m[2] || 0) * 60 + +(m[3] || 0) : null;
};
export const absUrl = (u) => (/^https?:/i.test(u) ? u : `${BASE_URL}${u.startsWith("/") ? u : `/${u}`}`);
export const plain = (s) => String(s ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

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

/**
 * Cadastro dos vídeos: `videoMeta` é src/content/videoMeta.json e `videoPages`
 * é src/content/videoPages.json (mesma fonte do VideoObject e de /videos).
 */
export function videoContext(videoMeta, videoPages) {
  const meta = videoMeta ?? { youtube: {}, files: {} };
  const pages = videoPages ?? [];
  return {
    videoMeta: { youtube: meta.youtube ?? {}, files: meta.files ?? {} },
    videoPages: pages,
    pagedYouTube: new Set(pages.map((p) => p.youtube).filter(Boolean)),
    pagedFiles: new Set(pages.map((p) => p.file).filter(Boolean)),
  };
}

/** Uma entrada por página de vídeo (/videos/<slug>): endereço da página e os dados do vídeo dela. */
export function videoPageEntries(ctx) {
  return ctx.videoPages.map((p) => {
    const meta = (p.youtube ? ctx.videoMeta.youtube[p.youtube] : ctx.videoMeta.files[p.file]) ?? {};
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
 * fica na página do vídeo, a única que o Google aceita indexar como vídeo.
 */
export function postVideos(post, ctx) {
  const body = post.body || "";
  const desc = plain(post.meta_description || post.excerpt || post.title).slice(0, 2048);
  const postDate = post.published_at || post.created_at;
  const out = [];
  const seen = new Set();
  for (const m of body.matchAll(/<iframe\b[^>]*>/gi)) {
    const tag = m[0];
    const src = tag.match(/\bsrc="([^"]+)"/i)?.[1]?.replace(/&amp;/g, "&");
    const id = src?.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})/i)?.[1];
    if (!id || ctx.pagedYouTube.has(id) || seen.has(id)) continue;
    seen.add(id);
    const start = src.match(/[?&]start=(\d+)/)?.[1];
    const meta = ctx.videoMeta.youtube[id] ?? {};
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
    if (!src || !poster || ctx.pagedFiles.has(src)) continue;
    const meta = ctx.videoMeta.files[src] ?? {};
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
export function unpagedPostVideoIds(post, ctx) {
  const ids = postVideos(post, ctx).map((v) => v.id);
  const lead = String(post.youtube_video_id ?? "").trim();
  if (/^[\w-]{11}$/.test(lead) && !ctx.pagedYouTube.has(lead) && !ids.includes(lead)) ids.unshift(lead);
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

// Cópia de noBairro/bairroPreposicao (src/lib/bairroSeo.ts): este módulo também
// roda em Node puro e não importa TypeScript. bairroSeo.test.ts confere que o
// llms.txt gerado bate com o título de cada bairro.
const foldBairro = (v) => v.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/\p{M}/gu, "").trim();
const BAIRROS_NO = new Set(["brooklin", "butanta", "campo belo", "itaim bibi", "itaim", "jardim paulista", "paraiso", "ibirapuera", "tatuape", "morumbi", "cambuci", "centro", "sumare", "ipiranga", "pacaembu", "bom retiro", "jabaquara", "panamby", "bras", "belem", "belenzinho", "jardim europa", "jardim america", "alto de pinheiros", "alto da boa vista", "real parque", "planalto paulista", "brooklin novo", "campo limpo"]);
const BAIRROS_NOS = new Set(["jardins", "campos eliseos", "campos elisios"]);
const BAIRROS_NA = new Set(["bela vista", "consolacao", "republica", "paulista", "liberdade", "lapa", "mooca", "aclimacao", "barra funda", "saude", "penha", "pompeia", "agua branca", "se", "luz", "casa verde", "granja julieta"]);
export function noBairro(label) {
  const nome = String(label ?? "").trim();
  if (!nome) return "em São Paulo";
  const k = foldBairro(nome);
  const prep = BAIRROS_NOS.has(k) ? "nos" : BAIRROS_NO.has(k) ? "no" : BAIRROS_NA.has(k) || /^(vila|chacara|cidade|granja|praca) /.test(k) ? "na" : "em";
  return `${prep} ${nome}`;
}

/**
 * Páginas fixas do sitemap: endereço, changefreq, priority e a origem do
 * lastmod. `files` são os arquivos cujo último commit data a página
 * (scripts/generate-sitemap.mjs grava essa data em src/content/sitemapLastmod.json);
 * `lastmod: "projects" | "posts" | "faq"` sai do banco; sem os dois, sem data.
 * Página noindex (busca, /mapa, preferências de cookies, LPs /o e /p, /admin/*)
 * NUNCA entra aqui; sitemapParidade.test.ts confere a lista contra o roteador.
 */
export const STATIC_PAGES = [
  { loc: `${BASE_URL}/`, changefreq: "weekly", priority: "1.0", files: ["src/routes/index.tsx", "src/pages/HomePage.tsx", "src/pages/home-bwa-body.ts"], fallback: "2026-10-02" },
  { loc: `${BASE_URL}/portfolio`, changefreq: "weekly", priority: "0.9", lastmod: "projects" },
  { loc: `${BASE_URL}/conteudos`, changefreq: "weekly", priority: "0.8", lastmod: "posts" },
  // Índice dos vídeos; as páginas de cada vídeo saem mais abaixo, com <video:video>.
  { loc: `${BASE_URL}/videos`, changefreq: "monthly", priority: "0.7", files: ["src/routes/videos.index.tsx", "src/pages/VideosPage.tsx", "src/content/videoPages.json"] },
  { loc: `${BASE_URL}/coletas-por-bairro`, changefreq: "weekly", priority: "0.5" },
  { loc: `${BASE_URL}/orcamento`, changefreq: "monthly", priority: "1.0", files: ["src/routes/orcamento.tsx", "src/pages/OrcamentoPage.tsx"] },
  { loc: `${BASE_URL}/escopo`, changefreq: "monthly", priority: "0.8", files: ["src/routes/escopo.tsx", "src/pages/EscopoPage.tsx", "src/lib/escopoCalc.ts"] },
  { loc: `${BASE_URL}/faq`, changefreq: "monthly", priority: "0.7", lastmod: "faq" },
  { loc: `${BASE_URL}/autorizacao-condominio`, changefreq: "monthly", priority: "0.7", files: ["src/routes/autorizacao-condominio.tsx", "src/pages/AutorizacaoCondominioPage.tsx"] },
  { loc: `${BASE_URL}/contato`, changefreq: "monthly", priority: "0.7", files: ["src/routes/contato.tsx", "src/pages/ContatoPage.tsx"], fallback: "2026-09-26" },
  // /mapa repete o endereço e o mapa de /contato: noindex, fora do sitemap (TEC-05).
  { loc: `${BASE_URL}/mapa-do-site`, changefreq: "weekly", priority: "0.5" },
  { loc: `${BASE_URL}/servicos`, changefreq: "monthly", priority: "0.9", files: ["src/routes/servicos.tsx", "src/pages/ServicosPage.tsx"], fallback: "2026-09-29" },
  { loc: `${BASE_URL}/como-funciona`, changefreq: "monthly", priority: "0.7", files: ["src/routes/como-funciona.tsx", "src/pages/ComoFuncionaPage.tsx", "src/content/etapas.ts"] },
  { loc: `${BASE_URL}/onde-atuamos`, changefreq: "monthly", priority: "0.7", files: ["src/routes/onde-atuamos.tsx", "src/pages/OndeAtuamosPage.tsx", "src/lib/bairrosSp.ts"] },
  { loc: `${BASE_URL}/reforma-de-apartamento-sao-paulo`, changefreq: "monthly", priority: "0.9", files: ["src/routes/reforma-de-apartamento-sao-paulo.tsx", "src/pages/ReformaApartamentoSpPage.tsx"], fallback: "2026-09-23" },
  { loc: `${BASE_URL}/reforma-de-studio-sao-paulo`, changefreq: "monthly", priority: "0.9", files: ["src/routes/reforma-de-studio-sao-paulo.tsx", "src/pages/ReformaStudioSpPage.tsx"], fallback: "2026-09-23" },
  { loc: `${BASE_URL}/reforma-de-cobertura-sao-paulo`, changefreq: "monthly", priority: "0.9", files: ["src/routes/reforma-de-cobertura-sao-paulo.tsx", "src/pages/ReformaCoberturaSpPage.tsx"], fallback: "2026-09-23" },
  { loc: `${BASE_URL}/indice-de-custo-de-reforma`, changefreq: "monthly", priority: "0.8", files: ["src/routes/indice-de-custo-de-reforma.tsx", "src/pages/IndiceCustoPage.tsx", "src/content/indiceCusto.ts"], fallback: "2026-10-13" },
  { loc: `${BASE_URL}/licenca-cc-by-4-0`, changefreq: "monthly", priority: "0.4", files: ["src/routes/licenca-cc-by-4-0.tsx", "src/pages/LicencaPage.tsx", "src/content/pages/licenca.ts"], fallback: "2026-10-13" },
  { loc: `${BASE_URL}/licenca-cc-by-sa-4-0`, changefreq: "monthly", priority: "0.4", files: ["src/routes/licenca-cc-by-sa-4-0.tsx", "src/pages/LicencaPage.tsx", "src/content/pages/licencas.ts"], fallback: "2026-10-14" },
  { loc: `${BASE_URL}/atribuicao`, changefreq: "monthly", priority: "0.4", files: ["src/routes/atribuicao.tsx", "src/pages/AtribuicaoPage.tsx", "src/content/pages/atribuicao.ts"], fallback: "2026-10-14" },
  { loc: `${BASE_URL}/marcenaria`, changefreq: "monthly", priority: "0.9", files: ["src/routes/marcenaria.tsx", "src/pages/MarcenariaPage.tsx"], fallback: "2026-09-23" },
  { loc: `${BASE_URL}/parceiros`, changefreq: "monthly", priority: "0.7", files: ["src/routes/parceiros.index.tsx", "src/pages/ParceirosPage.tsx"] },
  { loc: `${BASE_URL}/parceiros/incorporadoras`, changefreq: "monthly", priority: "0.8", files: ["src/routes/parceiros.incorporadoras.tsx", "src/pages/IncorporadorasPage.tsx", "src/content/incorporadoras.ts"], fallback: "2026-09-23" },
  { loc: `${BASE_URL}/parceiros/leal-moreira`, changefreq: "monthly", priority: "0.7", files: ["src/routes/parceiros.leal-moreira.tsx", "src/pages/LealMoreiraPage.tsx", "src/content/lealMoreira.ts"], fallback: "2026-10-11" },
  { loc: `${BASE_URL}/indique-um-amigo`, changefreq: "monthly", priority: "0.7", files: ["src/routes/indique-um-amigo.tsx", "src/pages/IndiquePage.tsx"] },
  { loc: `${BASE_URL}/marcas-e-parcerias`, changefreq: "monthly", priority: "0.7", files: ["src/routes/marcas-e-parcerias.tsx", "src/pages/MarcasParceriasPage.tsx"], fallback: "2026-09-23" },
  { loc: `${BASE_URL}/privacidade`, changefreq: "yearly", priority: "0.3", files: ["src/routes/privacidade.tsx", "src/pages/PrivacidadePage.tsx"] },
  { loc: `${BASE_URL}/politica-de-cookies`, changefreq: "yearly", priority: "0.3", files: ["src/routes/politica-de-cookies.tsx", "src/pages/PoliticaCookiesPage.tsx"] },
  // /preferencias-de-cookies é página de configuração: noindex, fora do sitemap (TEC-05).
  { loc: `${BASE_URL}/acessibilidade`, changefreq: "yearly", priority: "0.3", files: ["src/routes/acessibilidade.tsx", "src/pages/AcessibilidadePage.tsx"] },
  { loc: `${BASE_URL}/autores`, changefreq: "monthly", priority: "0.5", files: ["src/routes/autores.tsx", "src/pages/AutoresPage.tsx", "src/lib/orgJsonLd.ts"] },
];

/** Chaves de sitemapLastmod.json que não são páginas fixas: datam todas as páginas de um grupo. */
export const LASTMOD_BAIRROS = "/reforma/*";
export const LASTMOD_VIDEOS = "/videos/*";
/** Arquivos que datam o grupo (título, H1 e descrição da página de bairro; página e cadastros de vídeo). */
export const LASTMOD_FILES = {
  // Título, H1 e descrição da página de bairro saem do código (BairroPage e
  // bairroSeo): mudança ali também é mudança da página. Sem isto, a troca do
  // título em 11/10/2026 não aparecia no lastmod de nenhum bairro.
  [LASTMOD_BAIRROS]: ["src/pages/BairroPage.tsx", "src/lib/bairroSeo.ts"],
  // Página de vídeo e os dois cadastros (o arquivo da rota tem "$" no nome, que o
  // shell do git log expandiria; por isso ele não entra na lista).
  [LASTMOD_VIDEOS]: ["src/pages/VideoWatchPage.tsx", "src/lib/videoPages.ts", "src/content/videoPages.json", "src/content/videoMeta.json"],
};

// Páginas por bairro (/reforma/<bairro>): mesma regra de src/lib/portfolioFilter.ts.
export const hoodSlug = (v) =>
  String(v).trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const mostCommon = (values) =>
  [...values.reduce((m, v) => m.set(v, (m.get(v) ?? 0) + 1), new Map()).entries()].sort((a, b) => b[1] - a[1])[0][0];

const newest = (rows, ...fields) => {
  const days = rows.map((r) => day(...fields.map((f) => r[f]))).filter(Boolean).sort();
  return days.length ? days[days.length - 1] : null;
};

/**
 * Páginas de bairro (/reforma/<bairro>) a partir dos projetos publicados: só
 * bairro com 3 projetos ou mais (MIN_PROJECTS_PER_NEIGHBORHOOD) e com capa.
 * `hoodPageLastmod` é a data do código da página (sitemapLastmod.json).
 */
export function hoodEntries(projects, hoodPageLastmod) {
  const hoods = new Map();
  for (const p of projects) {
    if (!p.neighborhood || !p.cover_url) continue;
    const s = hoodSlug(p.neighborhood);
    if (!s) continue;
    const h = hoods.get(s) ?? { n: 0, rows: [] };
    h.n++; h.rows.push(p); hoods.set(s, h);
  }
  return [...hoods.entries()]
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
}

/**
 * O sitemap inteiro.
 *  - projects: linhas de `projects` publicados e visíveis (slug, neighborhood,
 *    cover_url, created_at, content_updated_at);
 *  - posts: linhas de `bewild_posts` publicados (slug, title, body, meta_description,
 *    excerpt, youtube_video_id, published_at, created_at, content_updated_at);
 *  - faqRows: linhas de `assistant_kb` ativas (updated_at);
 *  - lastmod: conteúdo de src/content/sitemapLastmod.json (datas do git por página);
 *  - ctx: videoContext(videoMeta, videoPages).
 * Devolve { xml, hoodUrls, videoEntries, warnings }.
 */
export function buildSitemap({ projects, posts, faqRows, lastmod, ctx }) {
  const dates = lastmod ?? {};
  const projectRows = Array.isArray(projects) ? projects : [];
  const postRows = Array.isArray(posts) ? posts : [];
  const faq = Array.isArray(faqRows) ? faqRows : [];

  const staticUrls = STATIC_PAGES.map((p) => {
    const path = p.loc.slice(BASE_URL.length) || "/";
    let lm = null;
    if (p.lastmod === "projects") lm = newest(projectRows, "content_updated_at", "created_at");
    else if (p.lastmod === "posts") lm = day("2026-09-23", postRows.length ? newest(postRows, "content_updated_at", "published_at", "created_at") : null);
    else if (p.lastmod === "faq") lm = newest(faq, "updated_at");
    else if (p.files) lm = dates[path] ?? p.fallback ?? null;
    return { loc: p.loc, lastmod: lm, changefreq: p.changefreq, priority: p.priority };
  });

  const projectUrls = projectRows
    .filter((p) => p.slug)
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((p) => ({
      loc: `${BASE_URL}/portfolio/${p.slug}`,
      lastmod: day(p.content_updated_at, p.created_at),
      changefreq: "monthly",
      priority: "0.7",
    }));

  const hoodUrls = hoodEntries(projectRows, dates[LASTMOD_BAIRROS] ?? null);

  const postUrls = postRows
    .filter((p) => p.slug)
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((p) => ({
      loc: `${BASE_URL}/conteudos/${p.slug}`,
      lastmod: day(p.content_updated_at, p.published_at, p.created_at),
      changefreq: "monthly",
      priority: "0.6",
      videos: postVideos(p, ctx),
    }));

  // Páginas de vídeo (/videos/<slug>): uma por vídeo, com a entrada <video:video>.
  const videoEntries = videoPageEntries(ctx);
  const videoLastmod = dates[LASTMOD_VIDEOS] ?? null;
  const videoUrls = videoEntries.map((v) => ({
    loc: v.loc,
    lastmod: videoLastmod,
    changefreq: "monthly",
    priority: "0.6",
    videos: [v.video],
  }));

  // Vídeo publicado num artigo e ainda sem página própria: o Google não o indexa.
  // O de abertura (youtube_video_id) só toca com clique, então nem entra no sitemap.
  const warnings = [];
  for (const post of postRows) {
    const ids = unpagedPostVideoIds(post, ctx);
    if (ids.length) {
      warnings.push(`/conteudos/${post.slug}: vídeo ${ids.join(", ")} ainda sem página em /videos; cadastre em src/content/videoPages.json.`);
    }
  }

  const all = [...staticUrls, ...hoodUrls, ...projectUrls, ...postUrls, ...videoUrls];
  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">`,
    ...all.map(urlTag),
    `</urlset>`,
    ``,
  ].join("\n");

  return { xml, urls: all, hoodUrls, videoEntries, warnings };
}

/** "9 min 49 s" a partir de "PT9M49S" (vazio quando a duração não é conhecida). */
function durationLabel(iso) {
  const total = isoSecs(iso);
  if (!total) return "";
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  return [h ? `${h} h` : "", m ? `${m} min` : "", s ? `${s} s` : ""].filter(Boolean).join(" ");
}

/** Linhas do llms.txt para as páginas de vídeo (também conferidas em videoPages.test.tsx). */
export function videoLlmsLines(entries) {
  return entries.map((v) => {
    const dur = durationLabel(v.duration);
    return `- [${v.name.replace(/[[\]]/g, "")}](/videos/${v.slug}): ${v.kind}${dur ? `, ${dur}` : ""}`;
  });
}

function replaceBetween(txt, start, end, lines, warnings, what) {
  const a = txt.indexOf(start);
  const b = txt.indexOf(end);
  if (a === -1 || b === -1 || b < a) {
    warnings.push(`llms.txt sem marcadores ${what}; lista não atualizada`);
    return txt;
  }
  return `${txt.slice(0, a + start.length)}\n${lines.join("\n")}\n${txt.slice(b)}`;
}

/**
 * O llms.txt: o modelo (src/content/llms.txt) com as seções "Conteúdos
 * publicados", "Reformas por bairro" e "Vídeos" preenchidas entre os
 * marcadores (plano SEO + IA: os posts precisam estar listados para os
 * crawlers de IA). Fora dos marcadores o modelo sai como está.
 */
export function buildLlmsTxt(template, { posts, hoodUrls, videoEntries }) {
  const warnings = [];
  const postLines = (Array.isArray(posts) ? posts : [])
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
  const hoodLines = (hoodUrls ?? []).map(
    (h) => `- [Reforma de apartamento ${noBairro(h.label)}](${h.loc.replace(BASE_URL, "")}): ${h.count} projetos entregues`,
  );
  let next = replaceBetween(template, "<!-- posts:start -->", "<!-- posts:end -->", postLines, warnings, "posts:start/posts:end");
  next = replaceBetween(next, "<!-- bairros:start -->", "<!-- bairros:end -->", hoodLines, warnings, "bairros:start/bairros:end");
  next = replaceBetween(next, "<!-- videos:start -->", "<!-- videos:end -->", videoLlmsLines(videoEntries ?? []), warnings, "videos:start/videos:end");
  return { text: next, warnings, counts: { posts: postLines.length, bairros: hoodLines.length, videos: (videoEntries ?? []).length } };
}
