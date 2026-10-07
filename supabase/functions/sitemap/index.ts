// Edge function: sitemap.xml — gera sitemap dinâmico Bewild.
// Inclui projetos publicados e visíveis (portfolio) e posts publicados (conteúdos).
// Público (sem JWT). URL: <project>.functions.supabase.co/sitemap
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing required environment variables");
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function validDay(...values: Array<string | null | undefined>): string | undefined {
  const timestamps = values
    .filter((value): value is string => Boolean(value))
    .map((value) => Date.parse(value))
    .filter(Number.isFinite);
  if (timestamps.length === 0) return undefined;
  return new Date(Math.max(...timestamps)).toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Projetos: lastmod = content_updated_at (edição real de conteúdo, migration
  // 20260930120000) com fallback em created_at — nunca updated_at, que o
  // trigger set_updated_at carimba em qualquer update (lote de 27/09/2026
  // marcou os 162 projetos no mesmo dia). Sem a migration a coluna não existe
  // e a consulta cai para created_at.
  const PROJECT_COLS = "slug, neighborhood, cover_url, created_at";
  const loadProjects = async () => {
    const withContent = await supabase
      .from("projects")
      .select(`${PROJECT_COLS}, content_updated_at`)
      .eq("published", true)
      .eq("visible", true)
      .order("order_index", { ascending: true });
    if (!withContent.error) return withContent;
    return await supabase
      .from("projects")
      .select(PROJECT_COLS)
      .eq("published", true)
      .eq("visible", true)
      .order("order_index", { ascending: true });
  };

  // Posts: lastmod = content_updated_at (edição real de conteúdo, migration
  // 20261006150000) com fallback em published_at/created_at — nunca
  // updated_at, que o trigger set_updated_at carimba em qualquer update (lote
  // de 06/10/2026 02:29 UTC marcou 43 posts no mesmo segundo). Sem a migration
  // a coluna não existe e a consulta cai para updated_at.
  const POST_COLS = "slug, updated_at, published_at, created_at";
  const loadPosts = async () => {
    const withContent = await supabase
      .from("bewild_posts")
      .select(`${POST_COLS}, content_updated_at`)
      .eq("published", true)
      .order("published_at", { ascending: false, nullsFirst: false });
    if (!withContent.error) return withContent;
    return supabase
      .from("bewild_posts")
      .select(POST_COLS)
      .eq("published", true)
      .order("published_at", { ascending: false, nullsFirst: false });
  };

  const [{ data: settings }, { data: projects }, { data: bewildPosts }] = await Promise.all([
    supabase
      .rpc("get_public_site_settings"),
    loadProjects(),
    loadPosts(),
  ]);

  const base = "https://bewild.com.br";

  type UrlEntry = {
    loc: string;
    priority: string;
    changefreq: string;
    lastmod?: string;
  };

  const projectRows = (projects ?? []) as Array<{
    slug: string;
    content_updated_at?: string | null;
    created_at: string | null;
  }>;
  const postRows = (bewildPosts ?? []) as Array<{
    slug: string;
    content_updated_at?: string | null;
    updated_at: string | null;
    published_at: string | null;
    created_at: string | null;
  }>;
  // Com a coluna presente (mesmo NULL = nunca editado), updated_at não entra.
  const postDays = (row: (typeof postRows)[number]) =>
    "content_updated_at" in row
      ? [row.content_updated_at, row.published_at, row.created_at]
      : [row.updated_at, row.published_at, row.created_at];
  const projectLastmod = validDay(...projectRows.flatMap((row) => [row.content_updated_at, row.created_at]));
  const postLastmod = validDay(...postRows.flatMap(postDays));

  const staticUrls: UrlEntry[] = [
    { loc: `${base}/`, priority: "1.0", changefreq: "weekly", lastmod: "2026-09-26" },
    { loc: `${base}/portfolio`, priority: "0.9", changefreq: "weekly", lastmod: projectLastmod },
    { loc: `${base}/conteudos`, priority: "0.8", changefreq: "weekly", lastmod: postLastmod },
    { loc: `${base}/orcamento`, priority: "1.0", changefreq: "monthly" },
    { loc: `${base}/faq`, priority: "0.7", changefreq: "monthly" },
    { loc: `${base}/autorizacao-condominio`, priority: "0.7", changefreq: "monthly" },
    { loc: `${base}/contato`, priority: "0.7", changefreq: "monthly", lastmod: "2026-09-26" },
    { loc: `${base}/mapa-do-site`, priority: "0.5", changefreq: "weekly" },
    { loc: `${base}/servicos`, priority: "0.9", changefreq: "monthly" },
    { loc: `${base}/escopo`, priority: "0.7", changefreq: "monthly" },
    { loc: `${base}/como-funciona`, priority: "0.7", changefreq: "monthly" },
    { loc: `${base}/onde-atuamos`, priority: "0.7", changefreq: "monthly" },
    { loc: `${base}/reforma-de-apartamento-sao-paulo`, priority: "0.9", changefreq: "monthly" },
    { loc: `${base}/reforma-de-studio-sao-paulo`, priority: "0.9", changefreq: "monthly" },
    { loc: `${base}/reforma-de-cobertura-sao-paulo`, priority: "0.9", changefreq: "monthly" },
    { loc: `${base}/marcenaria`, priority: "0.9", changefreq: "monthly" },
    { loc: `${base}/parceiros`, priority: "0.7", changefreq: "monthly" },
    { loc: `${base}/parceiros/incorporadoras`, priority: "0.8", changefreq: "monthly" },
    { loc: `${base}/indique-um-amigo`, priority: "0.7", changefreq: "monthly" },
    { loc: `${base}/marcas-e-parcerias`, priority: "0.7", changefreq: "monthly" },
    { loc: `${base}/guia-do-investidor`, priority: "0.8", changefreq: "monthly" },
    { loc: `${base}/privacidade`, priority: "0.3", changefreq: "yearly" },
    { loc: `${base}/acessibilidade`, priority: "0.3", changefreq: "yearly" },
  ];

  const projectUrls: UrlEntry[] = projectRows.filter((p) => p.slug).map((p) => ({
    loc: `${base}/portfolio/${p.slug}`,
    priority: "0.7",
    changefreq: "monthly",
    lastmod: validDay(p.content_updated_at, p.created_at),
  }));

  const hoodSlug = (v: string) =>
    v.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const hoods = new Map<string, { n: number; days: Array<string | null> }>();
  for (const p of projectRows as Array<{ neighborhood?: string | null; cover_url?: string | null; content_updated_at?: string | null; created_at?: string | null }>) {
    if (!p.neighborhood || !p.cover_url) continue;
    const k = hoodSlug(p.neighborhood);
    if (!k) continue;
    const h = hoods.get(k) ?? { n: 0, days: [] };
    h.n++; h.days.push(p.content_updated_at ?? null, p.created_at ?? null); hoods.set(k, h);
  }
  const hoodUrls: UrlEntry[] = [...hoods.entries()].filter(([, h]) => h.n >= 3).map(([k, h]) => ({
    loc: `${base}/reforma/${k}`,
    priority: "0.8",
    changefreq: "monthly",
    lastmod: validDay(...h.days),
  }));

  const postUrls: UrlEntry[] = postRows.filter((b) => b.slug).map((b) => ({
    loc: `${base}/conteudos/${b.slug}`,
    priority: "0.6",
    changefreq: "monthly",
    lastmod: validDay(...postDays(b)),
  }));

  // Páginas de gráficos (/graficos/<slug>): mantenha em sincronia com src/content/chartSets.ts.
  const chartUrls: UrlEntry[] = ["reformar-apartamento-para-vender-ou-alugar-sp"].map((slug) => {
    const post = postRows.find((b) => b.slug === slug);
    return {
      loc: `${base}/graficos/${slug}`,
      priority: "0.5",
      changefreq: "monthly",
      lastmod: post ? validDay(...postDays(post)) : undefined,
    };
  });

  const all = [...staticUrls, ...hoodUrls, ...projectUrls, ...postUrls, ...chartUrls];

  const urlsXml = all
    .map(
      (u) =>
        `  <url>\n` +
        `    <loc>${xmlEscape(u.loc)}</loc>\n` +
        (u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : "") +
        `    <changefreq>${u.changefreq}</changefreq>\n` +
        `    <priority>${u.priority}</priority>\n` +
        `    <xhtml:link rel="alternate" hreflang="pt-BR" href="${xmlEscape(u.loc)}" />\n` +
        `  </url>`,
    )
    .join("\n");

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset ` +
    `xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ` +
    `xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    urlsXml +
    `\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-cache, max-age=0",
      "X-Sitemap-Total": String(all.length),
      "X-Sitemap-Projects": String(projectUrls.length),
      "X-Sitemap-Posts": String(postUrls.length),
    },
  });
});
