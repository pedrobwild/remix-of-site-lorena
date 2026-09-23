// Edge function: index-tracker
// Rastreador de indexação. Lê as URLs do sitemap, consulta o estado de cada
// uma no índice do Google (URL Inspection API, via connector gateway do
// Search Console) e grava o resultado em public.seo_index_status.
//
// Acesso:
//  - admin logado (JWT + public.is_admin())
//  - cron interno (header x-cron-key === INDEX_TRACKER_CRON_KEY)
//
// A API do Search Console tem cota diária; por isso cada execução verifica
// apenas um lote (padrão 120), começando pelas URLs nunca verificadas e
// depois pelas verificadas há mais tempo.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const GSC_KEY = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");
const CRON_KEY = Deno.env.get("INDEX_TRACKER_CRON_KEY");

const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";
const SITE_BASE = "https://bewild.com.br";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function gscHeaders() {
  return {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": String(GSC_KEY),
    "Content-Type": "application/json",
  };
}

function coversTarget(siteUrl: string, target: URL) {
  if (siteUrl.startsWith("sc-domain:")) {
    const domain = siteUrl.slice("sc-domain:".length).toLowerCase();
    const host = target.hostname.toLowerCase();
    return host === domain || host.endsWith(`.${domain}`);
  }
  try {
    return target.href.startsWith(new URL(siteUrl).href);
  } catch {
    return false;
  }
}

async function resolveSiteUrl(): Promise<{ siteUrl?: string; candidates?: string[] }> {
  const res = await fetch(`${GATEWAY}/webmasters/v3/sites`, { headers: gscHeaders() });
  if (!res.ok) throw new Error(`Falha ao listar propriedades [${res.status}]: ${await res.text()}`);
  const data = (await res.json()) as { siteEntry?: Array<{ siteUrl: string; permissionLevel?: string }> };
  const target = new URL(SITE_BASE);
  const matches = (data.siteEntry ?? [])
    .filter((e) => e.permissionLevel !== "siteUnverifiedUser" && coversTarget(e.siteUrl, target))
    .map((e) => e.siteUrl);
  if (matches.length === 1) return { siteUrl: matches[0] };
  return { candidates: matches };
}

async function sitemapUrls(): Promise<string[]> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/sitemap`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  });
  if (!res.ok) throw new Error(`Falha ao ler o sitemap [${res.status}]`);
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
    m[1].trim().replace(/&amp;/g, "&"),
  );
  return [...new Set(urls)].filter((u) => u.startsWith(SITE_BASE));
}

type Inspection = {
  coverageState?: string;
  verdict?: string;
  robotsTxtState?: string;
  lastCrawlTime?: string;
};

async function inspect(siteUrl: string, inspectionUrl: string): Promise<Inspection> {
  const res = await fetch(`${GATEWAY}/v1/urlInspection/index:inspect`, {
    method: "POST",
    headers: gscHeaders(),
    body: JSON.stringify({ inspectionUrl, siteUrl }),
  });
  if (!res.ok) throw new Error(`[${res.status}] ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return (data?.inspectionResult?.indexStatusResult ?? {}) as Inspection;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // --- autorização ---
  let source = "cron";
  const cronKey = req.headers.get("x-cron-key");
  if (CRON_KEY && cronKey && cronKey === CRON_KEY) {
    source = "cron";
  } else {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json(401, { error: "não autorizado" });
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return json(401, { error: "não autorizado" });
    const { data: isAdmin } = await userClient.rpc("is_admin");
    if (!isAdmin) return json(403, { error: "somente administradores" });
    source = "manual";
  }

  if (!LOVABLE_API_KEY || !GSC_KEY) {
    return json(500, { error: "Search Console não está conectado ao projeto." });
  }

  let limit = 120;
  try {
    const body = await req.json();
    if (body && Number.isFinite(body.limit)) limit = Math.min(200, Math.max(1, Number(body.limit)));
  } catch {
    // sem body = padrão
  }

  try {
    // 1) sincroniza a lista de URLs com o sitemap
    const urls = await sitemapUrls();
    if (urls.length > 0) {
      const chunkSize = 200;
      for (let i = 0; i < urls.length; i += chunkSize) {
        const chunk = urls.slice(i, i + chunkSize).map((url) => ({ url, removed: false }));
        const { error } = await admin
          .from("seo_index_status")
          .upsert(chunk, { onConflict: "url", ignoreDuplicates: true });
        if (error) throw new Error(`upsert sitemap: ${error.message}`);
      }
      // marca como removidas as que saíram do sitemap
      const inSitemap = new Set(urls);
      const { data: known } = await admin.from("seo_index_status").select("id, url, removed");
      const gone = (known ?? []).filter((r) => !inSitemap.has(r.url) && !r.removed).map((r) => r.id);
      for (let i = 0; i < gone.length; i += 100) {
        await admin.from("seo_index_status").update({ removed: true }).in("id", gone.slice(i, i + 100));
      }
    }

    // 2) resolve a propriedade verificada
    const resolution = await resolveSiteUrl();
    if (!resolution.siteUrl) {
      return json(409, {
        error: "selection_required",
        candidates: resolution.candidates ?? [],
      });
    }

    // 3) escolhe o lote: nunca verificadas primeiro, depois as mais antigas
    const { data: rows, error: rowsError } = await admin
      .from("seo_index_status")
      .select("id, url, indexed, indexed_at, verdict")
      .eq("removed", false)
      .order("last_checked_at", { ascending: true, nullsFirst: true })
      .order("id", { ascending: true })
      .limit(limit);
    if (rowsError) throw new Error(rowsError.message);

    let checked = 0;
    let newlyIndexed = 0;
    let errors = 0;
    const now = new Date().toISOString();

    for (const row of rows ?? []) {
      try {
        const result = await inspect(resolution.siteUrl, row.url);
        const isIndexed = result.verdict === "PASS";
        const patch: Record<string, unknown> = {
          last_checked_at: now,
          coverage_state: result.coverageState ?? null,
          verdict: result.verdict ?? null,
          robots_state: result.robotsTxtState ?? null,
          last_crawl_at: result.lastCrawlTime ?? null,
          indexed: isIndexed,
          error: null,
          updated_at: now,
        };
        if (result.verdict !== row.verdict) {
          patch.previous_verdict = row.verdict ?? null;
          patch.changed_at = now;
        }
        if (isIndexed && !row.indexed_at) {
          patch.indexed_at = now;
          newlyIndexed += 1;
        }
        await admin.from("seo_index_status").update(patch).eq("id", row.id);
        checked += 1;
      } catch (err) {
        errors += 1;
        await admin
          .from("seo_index_status")
          .update({ last_checked_at: now, error: String(err).slice(0, 300), updated_at: now })
          .eq("id", row.id);
        // 429 = cota: interrompe o lote
        if (String(err).includes("[429]")) break;
      }
      await new Promise((r) => setTimeout(r, 150));
    }

    await admin.from("seo_index_runs").insert({
      source,
      urls_total: urls.length,
      checked,
      newly_indexed: newlyIndexed,
      errors,
      notes: resolution.siteUrl,
    });

    return json(200, { ok: true, urls_total: urls.length, checked, newly_indexed: newlyIndexed, errors });
  } catch (err) {
    console.error("[index-tracker]", err);
    return json(500, { error: String(err) });
  }
});
