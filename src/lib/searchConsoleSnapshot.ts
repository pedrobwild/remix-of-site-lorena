import { z } from "zod";
import type { KeyRow, QueryPageRow } from "@/lib/seoPanel";

export const STUDIO_QUERY = "reforma de studios";
export const SNAPSHOT_TTL = 86_400_000;
export const TRACKED_PATHS = ["/", "/reforma-de-studio-sao-paulo", "/conteudos/etapas-de-reforma-de-apartamento-cronograma"];
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
});
export const snapshotRequest = z.object({
  start_date: day, end_date: day, prev_start_date: day, prev_end_date: day,
  site_url: z.string().optional(),
}).refine(v => v.start_date <= v.end_date && v.prev_start_date <= v.prev_end_date &&
  new Date(v.end_date).getTime() - new Date(v.start_date).getTime() <= 486 * SNAPSHOT_TTL,
  "Período inválido.");
export type SnapshotRequest = z.infer<typeof snapshotRequest>;
export type CrawlRow = { url: string; coverage_state: string | null; last_crawl_at: string | null; last_checked_at: string | null; error: string | null };
export type SitemapRow = { path?: string; lastSubmitted?: string; lastDownloaded?: string; isPending?: boolean; errors?: string | number; warnings?: string | number; contents?: { submitted?: string | number }[] };
export type SearchPanel = {
  version: number; site_url: string; start_date: string; end_date: string; prev_start_date: string; prev_end_date: string;
  totals: KeyRow; prev_totals: KeyRow; series: KeyRow[]; prev_series: KeyRow[]; queries: KeyRow[]; prev_queries: KeyRow[];
  pages: KeyRow[]; prev_pages: KeyRow[]; query_pages: QueryPageRow[]; devices: KeyRow[]; countries: KeyRow[];
  sitemaps: SitemapRow[]; sitemap_error?: string | null; studio: KeyRow | null; studio_pages: QueryPageRow[];
};
export function cacheKey(v: SnapshotRequest) { return [v.start_date, v.end_date, v.prev_start_date, v.prev_end_date].join(":"); }
export function isFresh(timestamp: string | null, now = Date.now()) {
  if (!timestamp) return false;
  const age = now - new Date(timestamp).getTime();
  return Number.isFinite(age) && age >= 0 && age < SNAPSHOT_TTL;
}
export function resolveProperty(entries: { siteUrl: string; permissionLevel?: string }[], target: string, selected?: string) {
  const url = new URL(target);
  const candidates = entries.filter(e => {
    if (e.permissionLevel === "siteUnverifiedUser") return false;
    if (e.siteUrl.startsWith("sc-domain:")) {
      const domain = e.siteUrl.slice(10).toLowerCase();
      return url.hostname === domain || url.hostname.endsWith(`.${domain}`);
    }
    try { return url.href.startsWith(new URL(e.siteUrl).href); } catch { return false; }
  }).map(e => e.siteUrl);
  if (selected) {
    if (!candidates.includes(selected)) throw new Error("A propriedade escolhida não está verificada para este site.");
    return { siteUrl: selected, candidates: [] };
  }
  if (candidates.length === 0) throw new Error("Nenhuma propriedade verificada para este site.");
  return candidates.length === 1 ? { siteUrl: candidates[0], candidates: [] } : { siteUrl: null, candidates };
}
export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}