import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { cacheKey, resolveProperty, STUDIO_QUERY, TRACKED_PATHS, type SnapshotRequest, type SearchPanel } from "@/lib/searchConsoleSnapshot";
import type { KeyRow, QueryPageRow } from "@/lib/seoPanel";

const TARGET = "https://bewild.com.br/";
type ApiRow = { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number };
const metric = (r: ApiRow): KeyRow => ({ key: r.keys?.[0] ?? "", clicks: r.clicks ?? 0, impressions: r.impressions ?? 0, ctr: r.ctr ?? 0, position: r.position ?? 0 });

export async function refreshSnapshot(db: SupabaseClient<Database>, request: SnapshotRequest) {
  const key = process.env["LOVABLE_API_KEY"];
  const connection = process.env["GOOGLE_SEARCH_CONSOLE_API_KEY"];
  if (!key || !connection) throw new Error("A conexão Search Console não está configurada.");
  async function api<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`https://connector-gateway.lovable.dev/google_search_console${path}`, {
      method: body ? "POST" : "GET",
      headers: { Authorization: `Bearer ${key}`, "X-Connection-Api-Key": connection ?? "", "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error(`Search Console [${res.status}]: ${detail}`);
      throw new Error(`O Google recusou a consulta (${res.status}). Confira o acesso à conexão.`);
    }
    return await res.json() as T;
  }
  const entries = await api<{ siteEntry?: { siteUrl: string; permissionLevel?: string }[] }>("/webmasters/v3/sites");
  const resolved = resolveProperty(entries.siteEntry ?? [], TARGET, request.site_url);
  if (!resolved.siteUrl) return { status: "selection_required" as const, candidates: resolved.candidates };
  const site = resolved.siteUrl;
  const root = `/webmasters/v3/sites/${encodeURIComponent(site)}`;
  async function run(dims: string[], startDate: string, endDate: string, exact = false) {
    const rows: ApiRow[] = [];
    let offset = 0;
    while (true) {
      const result = await api<{ rows?: ApiRow[] }>(`${root}/searchAnalytics/query`, {
        startDate, endDate, dimensions: dims, rowLimit: 25000, startRow: offset, type: "web", dataState: "all",
        ...(exact ? { dimensionFilterGroups: [{ filters: [{ dimension: "query", operator: "equals", expression: STUDIO_QUERY }] }] } : {}),
      });
      const batch = result.rows ?? [];
      rows.push(...batch);
      if (batch.length < 25000 || dims.length === 0) break;
      offset += batch.length;
    }
    return rows;
  }
  // Sequencial: interrompe imediatamente em 403/429, sem continuar o lote.
  const cs = request.start_date, ce = request.end_date, ps = request.prev_start_date, pe = request.prev_end_date;
  const zero = metric({});
  const totals = (await run([], cs, ce)).map(metric)[0] ?? zero;
  const prev_totals = (await run([], ps, pe)).map(metric)[0] ?? zero;
  const series = (await run(["date"], cs, ce)).map(metric);
  const prev_series = (await run(["date"], ps, pe)).map(metric);
  const queries = (await run(["query"], cs, ce)).map(metric);
  const prev_queries = (await run(["query"], ps, pe)).map(metric);
  const pages = (await run(["page"], cs, ce)).map(metric);
  const prev_pages = (await run(["page"], ps, pe)).map(metric);
  const mapPages = (rows: ApiRow[]): QueryPageRow[] => rows.map(r => ({ ...metric(r), query: r.keys?.[0] ?? "", page: r.keys?.[1] ?? "" }));
  const query_pages = mapPages(await run(["query", "page"], cs, ce));
  const devices = (await run(["device"], cs, ce)).map(metric);
  const countries = (await run(["country"], cs, ce)).map(metric);
  const studio = (await run(["query"], cs, ce, true)).map(metric)[0] ?? null;
  const studio_pages = mapPages(await run(["query", "page"], cs, ce, true));
  const sitemaps = (await api<{ sitemap?: SearchPanel["sitemaps"] }>(`${root}/sitemaps`)).sitemap ?? [];
  const panel: SearchPanel = { version: 2, ...request, site_url: site, totals, prev_totals, series, prev_series, queries, prev_queries, pages, prev_pages, query_pages, devices, countries, studio, studio_pages, sitemaps };
  const timestamp = new Date().toISOString();
  const saved = await db.from("search_console_snapshots").upsert({ cache_key: cacheKey(request), site_url: site, request: { ...request, site_url: site }, payload: JSON.parse(JSON.stringify(panel)), refreshed_at: timestamp, attempted_at: timestamp, error: null });
  if (saved.error) throw new Error("Não foi possível guardar o relatório do Google.");
  return { status: "ready" as const, panel, refreshed_at: timestamp };
}

export async function readSnapshot(db: SupabaseClient<Database>, request: SnapshotRequest) {
  const saved = await db.from("search_console_snapshots").select("payload,refreshed_at,error,site_url,attempted_at").eq("cache_key", cacheKey(request)).maybeSingle();
  if (saved.error) throw new Error("Não foi possível ler a cópia do Search Console.");
  const crawl = await db.from("seo_index_status").select("url,coverage_state,last_crawl_at,last_checked_at,error").in("url", TRACKED_PATHS.map(path => path === "/" ? TARGET : new URL(path, TARGET).href));
  return { status: "ready" as const, panel: saved.data?.payload as unknown as SearchPanel | null, refreshed_at: saved.data?.refreshed_at ?? null, error: saved.data?.error ?? null, crawls: crawl.data ?? [], crawl_error: crawl.error ? "Não foi possível ler o rastreio de indexação." : null };
}