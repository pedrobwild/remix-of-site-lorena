// Edge function: search-console-stats
// Devolve impressões, cliques, CTR e posição média do Search Console para o
// período pedido, agrupados por página ou por consulta. Somente admin logado.
//
// Usa o mesmo connector gateway do Search Console já usado pelo index-tracker.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const GSC_KEY = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");

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

async function resolveSiteUrl(): Promise<string | null> {
  const res = await fetch(`${GATEWAY}/webmasters/v3/sites`, { headers: gscHeaders() });
  if (!res.ok) throw new Error(`Falha ao listar propriedades [${res.status}]`);
  const data = (await res.json()) as {
    siteEntry?: Array<{ siteUrl: string; permissionLevel?: string }>;
  };
  const target = new URL(SITE_BASE);
  const matches = (data.siteEntry ?? [])
    .filter((e) => e.permissionLevel !== "siteUnverifiedUser" && coversTarget(e.siteUrl, target))
    .map((e) => e.siteUrl);
  return matches[0] ?? null;
}

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

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

  if (!LOVABLE_API_KEY || !GSC_KEY) {
    return json(409, { error: "Search Console não está conectado ao projeto." });
  }

  let days = 28;
  let dimension: "page" | "query" | "date" = "page";
  let rowLimit = 50;
  // deno-lint-ignore no-explicit-any
  let body: any = null;
  try {
    body = await req.json();
    if (body && Number.isFinite(body.days)) days = Math.min(180, Math.max(1, Number(body.days)));
    if (body?.dimension === "query" || body?.dimension === "date") dimension = body.dimension;
    if (body && Number.isFinite(body.rowLimit)) {
      rowLimit = Math.min(500, Math.max(1, Number(body.rowLimit)));
    }
  } catch {
    // sem body = padrão
  }

  try {
    const siteUrl = await resolveSiteUrl();
    if (!siteUrl) return json(409, { error: "Nenhuma propriedade verificada para bewild.com.br." });

    // O Search Console tem ~2 dias de atraso; a janela termina hoje mesmo.
    const end = new Date();
    const start = new Date(end.getTime() - days * 86_400_000);

    type GscRow = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };
    const run = async (
      dims: string[],
      limit: number,
      startDate: string,
      endDate: string,
      dataState?: "all" | "final",
    ): Promise<GscRow[]> => {
      const res = await fetch(
        `${GATEWAY}/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
        {
          method: "POST",
          headers: gscHeaders(),
          body: JSON.stringify({
            startDate,
            endDate,
            dimensions: dims,
            rowLimit: limit,
            type: "web",
            ...(dataState ? { dataState } : {}),
          }),
        },
      );
      if (!res.ok) throw new Error(`[${res.status}] ${(await res.text()).slice(0, 300)}`);
      const data = (await res.json()) as {
        rows?: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }>;
      };
      return (data.rows ?? []).map((r) => ({
        keys: r.keys ?? [],
        clicks: r.clicks ?? 0,
        impressions: r.impressions ?? 0,
        ctr: r.ctr ?? 0,
        position: r.position ?? 0,
      }));
    };

    // Modo "panel": um pacote só para o painel de SEO do /admin/analytics,
    // com o período pedido e o período anterior de mesmo tamanho.
    if (body?.mode === "panel") {
      const DAY = /^\d{4}-\d{2}-\d{2}$/;
      const s0 = String(body.start_date ?? "");
      const e0 = String(body.end_date ?? "");
      const ps = String(body.prev_start_date ?? "");
      const pe = String(body.prev_end_date ?? "");
      if (![s0, e0, ps, pe].every((d) => DAY.test(d)) || s0 > e0 || ps > pe) {
        return json(400, { error: "datas inválidas (use AAAA-MM-DD)" });
      }
      // O Search Console guarda 16 meses; nada antes disso.
      const floor = isoDay(new Date(Date.now() - 486 * 86_400_000));
      const clamp = (d: string) => (d < floor ? floor : d);
      const [cs, ce, pps, ppe] = [clamp(s0), clamp(e0), clamp(ps), clamp(pe)];
      const strip = (rows: GscRow[]) =>
        rows.map(({ keys, ...m }) => ({ key: keys[0] ?? "", ...m }));

      const sitemapsP = fetch(
        `${GATEWAY}/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps`,
        { headers: gscHeaders() },
      )
        .then(async (r) => (r.ok ? ((await r.json()) as { sitemap?: unknown[] }).sitemap ?? [] : []))
        .catch(() => []);

      const [
        totals, prevTotals, series, prevSeries, queries, prevQueries, pages, prevPages,
        queryPages, devices, countries, sitemaps,
      ] = await Promise.all([
        run([], 1, cs, ce, "all"),
        run([], 1, pps, ppe, "all"),
        run(["date"], 500, cs, ce, "all"),
        run(["date"], 500, pps, ppe, "all"),
        run(["query"], 5000, cs, ce, "all"),
        run(["query"], 5000, pps, ppe, "all"),
        run(["page"], 1000, cs, ce, "all"),
        run(["page"], 1000, pps, ppe, "all"),
        run(["query", "page"], 5000, cs, ce, "all"),
        run(["device"], 10, cs, ce, "all"),
        run(["country"], 25, cs, ce, "all"),
        sitemapsP,
      ]);
      const zero = { clicks: 0, impressions: 0, ctr: 0, position: 0 };
      const t = (rows: GscRow[]) => (rows[0] ? strip(rows)[0] : { key: "", ...zero });
      return json(200, {
        version: 2,
        site_url: siteUrl,
        start_date: cs,
        end_date: ce,
        prev_start_date: pps,
        prev_end_date: ppe,
        totals: t(totals),
        prev_totals: t(prevTotals),
        series: strip(series),
        prev_series: strip(prevSeries),
        queries: strip(queries),
        prev_queries: strip(prevQueries),
        pages: strip(pages),
        prev_pages: strip(prevPages),
        query_pages: queryPages.map((r) => ({
          query: r.keys[0] ?? "",
          page: r.keys[1] ?? "",
          clicks: r.clicks,
          impressions: r.impressions,
          ctr: r.ctr,
          position: r.position,
        })),
        devices: strip(devices),
        countries: strip(countries),
        sitemaps,
      });
    }

    const query = async (dims: string[], limit: number) =>
      (await run(dims, limit, isoDay(start), isoDay(end))).map(({ keys, ...m }) => ({
        key: keys[0] ?? "",
        ...m,
      }));

    const [rows, totalRows] = await Promise.all([query([dimension], rowLimit), query([], 1)]);

    return json(200, {
      site_url: siteUrl,
      start_date: isoDay(start),
      end_date: isoDay(end),
      dimension,
      rows,
      totals: totalRows[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 },
    });
  } catch (err) {
    return json(502, { error: String((err as Error)?.message ?? err) });
  }
});
