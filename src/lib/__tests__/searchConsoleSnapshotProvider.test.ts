import { afterEach, describe, expect, it, vi } from "vitest";
import { refreshSnapshot } from "@/lib/searchConsoleSnapshot.server";
const request = { start_date: "2026-10-03", end_date: "2026-10-30", prev_start_date: "2026-09-05", prev_end_date: "2026-10-02" };
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("Leitura do Google para cópias privadas", () => {
  it("consulta a busca exata independentemente dos principais resultados e preserva totais distintos", async () => {
    vi.stubEnv("LOVABLE_API_KEY", "test-key"); vi.stubEnv("GOOGLE_SEARCH_CONSOLE_API_KEY", "test-connection");
    const calls: Record<string, unknown>[] = [];
    const fetch = vi.fn(async (url: string, options: RequestInit) => {
      if (url.endsWith("/sites")) return Response.json({ siteEntry: [{ siteUrl: "https://bewild.com.br/", permissionLevel: "siteOwner" }] });
      if (url.endsWith("/sitemaps")) return Response.json({ sitemap: [] });
      const body = JSON.parse(String(options.body)); calls.push(body);
      if (body.dimensionFilterGroups) return Response.json({ rows: [{ keys: body.dimensions.length === 2 ? ["reforma de studios", "https://bewild.com.br/"] : ["reforma de studios"], clicks: 1, impressions: body.dimensions.length === 2 ? 13 : 33, position: 4.5, ctr: 1 / 33 }] });
      return Response.json({ rows: [] });
    }); vi.stubGlobal("fetch", fetch);
    const upsert = vi.fn(async () => ({ error: null }));
    const db = { from: () => ({ upsert }) } as unknown as Parameters<typeof refreshSnapshot>[0];
    const result = await refreshSnapshot(db, request);
    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error("Missing report");
    expect(result.panel.studio?.impressions).toBe(33);
    expect(result.panel.studio_pages[0]?.impressions).toBe(13);
    expect(calls.filter(c => c.dimensionFilterGroups)).toHaveLength(2);
    expect(upsert).toHaveBeenCalledOnce();
  });
  it("interrompe o lote em 403 e não grava dados incompletos", async () => {
    vi.stubEnv("LOVABLE_API_KEY", "test-key"); vi.stubEnv("GOOGLE_SEARCH_CONSOLE_API_KEY", "test-connection");
    const fetch = vi.fn().mockResolvedValueOnce(Response.json({ siteEntry: [{ siteUrl: "https://bewild.com.br/" }] })).mockResolvedValueOnce(new Response("denied", { status: 403 }));
    vi.stubGlobal("fetch", fetch);
    const upsert = vi.fn(); const db = { from: () => ({ upsert }) } as unknown as Parameters<typeof refreshSnapshot>[0];
    await expect(refreshSnapshot(db, request)).rejects.toThrow("403");
    expect(fetch).toHaveBeenCalledTimes(2); expect(upsert).not.toHaveBeenCalled();
  });
});