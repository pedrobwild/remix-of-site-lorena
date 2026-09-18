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

  const [{ data: settings }, { data: projects }, { data: bewildPosts }] = await Promise.all([
    supabase
      .from("site_settings")
      .select("seo_canonical_base, site_title")
      .eq("id", 1)
      .maybeSingle(),
    supabase
      .from("projects")
      .select("slug, updated_at, created_at")
      .eq("published", true)
      .eq("visible", true)
      .order("order_index", { ascending: true }),
    supabase
      .from("bewild_posts")
      .select("slug, updated_at, published_at, created_at")
      .eq("published", true)
      .order("published_at", { ascending: false, nullsFirst: false }),
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
    updated_at: string | null;
    created_at: string | null;
  }>;
  const postRows = (bewildPosts ?? []) as Array<{
    slug: string;
    updated_at: string | null;
    published_at: string | null;
    created_at: string | null;
  }>;
  const projectLastmod = validDay(...projectRows.flatMap((row) => [row.updated_at, row.created_at]));
  const postLastmod = validDay(
    ...postRows.flatMap((row) => [row.updated_at, row.published_at, row.created_at]),
  );

  const staticUrls: UrlEntry[] = [
    { loc: `${base}/`, priority: "1.0", changefreq: "weekly" },
    { loc: `${base}/portfolio`, priority: "0.9", changefreq: "weekly", lastmod: projectLastmod },
    { loc: `${base}/diagnostico`, priority: "0.9", changefreq: "monthly" },
    { loc: `${base}/conteudos`, priority: "0.8", changefreq: "weekly", lastmod: postLastmod },
    { loc: `${base}/faq`, priority: "0.7", changefreq: "monthly" },
    { loc: `${base}/contato`, priority: "0.7", changefreq: "monthly" },
    { loc: `${base}/privacidade`, priority: "0.3", changefreq: "yearly" },
  ];

  const projectUrls: UrlEntry[] = projectRows.filter((p) => p.slug).map((p) => ({
    loc: `${base}/portfolio/${p.slug}`,
    priority: "0.7",
    changefreq: "monthly",
    lastmod: validDay(p.updated_at, p.created_at),
  }));

  const postUrls: UrlEntry[] = postRows.filter((b) => b.slug).map((b) => ({
    loc: `${base}/conteudos/${b.slug}`,
    priority: "0.6",
    changefreq: "monthly",
    lastmod: validDay(b.updated_at, b.published_at, b.created_at),
  }));

  const all = [...staticUrls, ...projectUrls, ...postUrls];

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
