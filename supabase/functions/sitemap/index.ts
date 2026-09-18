// Edge function: sitemap.xml — gera sitemap dinâmico Bewild.
// Inclui projetos visíveis (portfolio) e posts publicados (conteúdos).
// Público (sem JWT). URL: <project>.functions.supabase.co/sitemap
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

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
      .select("slug, updated_at")
      .eq("visible", true)
      .order("order_index", { ascending: true }),
    supabase
      .from("bewild_posts")
      .select("slug, updated_at, published_at")
      .eq("published", true)
      .order("published_at", { ascending: false, nullsFirst: false }),
  ]);

  const base = (settings?.seo_canonical_base || "https://bewild.com.br").replace(/\/$/, "");
  const today = new Date().toISOString().slice(0, 10);

  type UrlEntry = {
    loc: string;
    priority: string;
    changefreq: string;
    lastmod: string;
  };

  const staticUrls: UrlEntry[] = [
    { loc: `${base}/`, priority: "1.0", changefreq: "weekly", lastmod: today },
    { loc: `${base}/portfolio`, priority: "0.9", changefreq: "weekly", lastmod: today },
    { loc: `${base}/diagnostico`, priority: "0.9", changefreq: "monthly", lastmod: today },
    { loc: `${base}/conteudos`, priority: "0.8", changefreq: "weekly", lastmod: today },
    { loc: `${base}/faq`, priority: "0.7", changefreq: "monthly", lastmod: today },
    { loc: `${base}/contato`, priority: "0.7", changefreq: "monthly", lastmod: today },
    { loc: `${base}/privacidade`, priority: "0.3", changefreq: "yearly", lastmod: today },
  ];

  const projectUrls: UrlEntry[] = ((projects ?? []) as Array<{
    slug: string;
    updated_at: string | null;
  }>).map((p) => ({
    loc: `${base}/portfolio/${p.slug}`,
    priority: "0.8",
    changefreq: "monthly",
    lastmod: (p.updated_at ?? new Date().toISOString()).slice(0, 10),
  }));

  const postUrls: UrlEntry[] = ((bewildPosts ?? []) as Array<{
    slug: string;
    updated_at: string | null;
    published_at: string | null;
  }>).map((b) => ({
    loc: `${base}/conteudos/${b.slug}`,
    priority: "0.7",
    changefreq: "monthly",
    lastmod: (b.updated_at ?? b.published_at ?? new Date().toISOString()).slice(0, 10),
  }));

  const all = [...staticUrls, ...projectUrls, ...postUrls];

  const urlsXml = all
    .map(
      (u) =>
        `  <url>\n` +
        `    <loc>${xmlEscape(u.loc)}</loc>\n` +
        `    <lastmod>${u.lastmod}</lastmod>\n` +
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
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
});
