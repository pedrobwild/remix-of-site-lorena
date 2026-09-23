// Edge function: ping-sitemap
// ----------------------------------------------------------------------
// Em junho/2023 o Google e o Bing DESCONTINUARAM os endpoints públicos
// de "ping" para sitemaps (/ping?sitemap=...) — agora ambos retornam
// 404/410 e exigem que o sitemap seja submetido via Search Console
// (Google) ou Webmaster Tools (Bing).
//
// Esta função permanece como um "centralizador" para:
//   1. Devolver a URL canônica do sitemap (estático e dinâmico) para
//      facilitar a cópia rápida no admin.
//   2. Tentar — best effort — apenas o IndexNow (Bing/Yandex/Seznam),
//      que é o substituto oficial. Se não houver chave configurada,
//      apenas pula esse passo.
//   3. Manter retorno HTTP 200 sempre que a requisição em si for válida,
//      para o admin não exibir falsos negativos.
//
// Somente admin logado (o painel chama via functions.invoke, que envia o
// JWT). Antes qualquer pessoa podia disparar submissões ao IndexNow.
// ----------------------------------------------------------------------
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const INDEXNOW_KEY = Deno.env.get("INDEXNOW_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** Páginas principais enviadas ao IndexNow (rotas que existem hoje). */
const KEY_PATHS = [
  "",
  "/portfolio",
  "/conteudos",
  "/diagnostico",
  "/como-funciona",
  "/onde-atuamos",
  "/reforma-de-apartamento-sao-paulo",
  "/reforma-de-studio-sao-paulo",
  "/reforma-de-cobertura-sao-paulo",
  "/marcenaria",
  "/guia-do-investidor",
  "/faq",
  "/contato",
];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("[ping-sitemap] Missing SUPABASE_URL / SUPABASE_ANON_KEY");
    return json({ ok: false, error: "indisponível" }, 503);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ ok: false, error: "não autorizado" }, 401);
  // Cliente com o JWT do admin: a gravação no log passa pela RLS normal.
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return json({ ok: false, error: "não autorizado" }, 401);
  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
  if (adminError || isAdmin !== true) return json({ ok: false, error: "somente administradores" }, 403);

  try {
    const { data: settings } = await supabase
      .from("site_settings")
      .select("seo_canonical_base")
      .eq("id", 1)
      .maybeSingle();

    const base = (settings?.seo_canonical_base || "https://bewild.com.br").replace(/\/$/, "");
    const sitemapStatic = `${base}/sitemap.xml`;
    const sitemapDynamic = `${SUPABASE_URL}/functions/v1/sitemap`;

    const results: Array<{ name: string; ok: boolean; status?: number; note?: string }> = [];

    // Google e Bing — endpoints descontinuados em 2023.
    // Mantemos o registro no retorno apenas para informar o admin,
    // mas marcamos ok=true porque NÃO é uma falha do nosso lado.
    results.push({
      name: "google",
      ok: true,
      status: 0,
      note: "Endpoint público descontinuado em 2023 — submeta o sitemap via Google Search Console.",
    });
    results.push({
      name: "bing",
      ok: true,
      status: 0,
      note: "Endpoint público descontinuado em 2023 — use o Bing Webmaster Tools ou IndexNow.",
    });

    // IndexNow (Bing/Yandex/Seznam) — substituto oficial.
    if (INDEXNOW_KEY) {
      try {
        const host = new URL(base).host;
        const body = {
          host,
          key: INDEXNOW_KEY,
          keyLocation: `${base}/${INDEXNOW_KEY}.txt`,
          urlList: KEY_PATHS.map((p) => `${base}${p}`),
        };
        const res = await fetch("https://api.indexnow.org/IndexNow", {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(15_000),
        });
        results.push({ name: "indexnow", ok: res.ok, status: res.status });
      } catch (err) {
        results.push({ name: "indexnow", ok: false, note: err instanceof Error ? err.name : "erro" });
      }
    } else {
      results.push({
        name: "indexnow",
        ok: true,
        status: 0,
        note: "Chave INDEXNOW_KEY não configurada (opcional).",
      });
    }

    // Registra no log de auditoria SEO para histórico. `kind` precisa estar
    // no CHECK da tabela ('audit' | 'submit' | 'note'); o valor antigo
    // 'ping_sitemap' era recusado em silêncio.
    const { error: logError } = await supabase.from("seo_audit_log").insert({
      kind: "submit",
      score: null,
      notes: `Sitemap publicado: ${sitemapStatic}`,
      issues: results as unknown as Record<string, unknown>,
    });
    if (logError) console.error("[ping-sitemap] audit log insert failed", logError.code ?? "unknown");

    return json({
      ok: true,
      sitemap: sitemapStatic,
      sitemap_dynamic: sitemapDynamic,
      results,
      note:
        "Google e Bing descontinuaram o ping público em 2023. Submeta o sitemap " +
        "manualmente em https://search.google.com/search-console (uma única vez); " +
        "atualizações futuras são detectadas automaticamente pelo `lastmod`.",
    });
  } catch (err) {
    console.error("[ping-sitemap] failed", err instanceof Error ? err.message : String(err));
    return json({ ok: false, error: "falha ao publicar o sitemap" }, 500);
  }
});
