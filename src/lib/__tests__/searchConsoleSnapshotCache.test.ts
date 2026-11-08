import { afterEach, describe, expect, it, vi } from "vitest";
import { readSnapshot } from "@/lib/searchConsoleSnapshot.server";

const current = { start_date: "2026-10-10", end_date: "2026-11-08", prev_start_date: "2026-09-10", prev_end_date: "2026-10-09" };
const saved = { payload: { version: 2, site_url: "https://bewild.com.br/", start_date: "2026-10-09", end_date: "2026-11-07", prev_start_date: "2026-09-09", prev_end_date: "2026-10-08", totals: { clicks: 131, impressions: 6439 } }, refreshed_at: "2026-11-07T07:15:00Z", error: null, site_url: "https://bewild.com.br/", attempted_at: "2026-11-07T07:15:00Z" };
function database(exact: unknown = null, rows: unknown[] = [saved]) {
  const query = { select: vi.fn(() => query), eq: vi.fn(() => query), not: vi.fn(() => query), order: vi.fn(() => query), limit: vi.fn(async () => ({ data: rows, error: null })), maybeSingle: vi.fn(async () => ({ data: exact, error: null })), in: vi.fn(async () => ({ data: [], error: null })) };
  return { from: vi.fn(() => query) } as unknown as Parameters<typeof readSnapshot>[0];
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
describe("Cópia diária ao abrir SEO", () => {
  it("mostra a última cópia de 30 dias na virada do dia sem consultar Google e sem trocar suas datas", async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-08T03:23:00Z"));
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    const result = await readSnapshot(database(), current);
    expect(result.panel?.totals.clicks).toBe(131);
    expect(result.panel?.end_date).toBe("2026-11-07");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("não substitui um período histórico por outro", async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-08T03:23:00Z"));
    const result = await readSnapshot(database(), { ...current, end_date: "2026-10-30" });
    expect(result.panel ?? null).toBeNull();
  });
  it("prioriza a cópia exata disponível", async () => {
    const result = await readSnapshot(database(saved), current);
    expect(result.panel).toEqual(saved.payload);
  });
});