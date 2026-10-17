import { describe, expect, it, vi } from "vitest";
import { proxyExport } from "@/lib/apiExport.server";

describe("consulta externa somente leitura", () => {
  it("encaminha apenas parâmetros de leitura e credencial do chamador", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ rows: [] }));
    await proxyExport(new Request("https://bewild.com.br/api/public/export?dataset=leads&format=json&table=profiles", { headers: { "x-export-key": "test-credential", Cookie: "private-cookie" } }), "https://backend.example", fetcher);
    const [url, options] = fetcher.mock.calls[0];
    expect(url.toString()).toBe("https://backend.example/functions/v1/data-export?dataset=leads&format=json");
    expect(options.method).toBe("GET");
    expect(options.headers.get("x-export-key")).toBe("test-credential");
    expect(options.headers.has("cookie")).toBe(false);
    expect(options.headers.has("apikey")).toBe(false);
  });
  it("préserve refus de clé et empêche le cache partagé", async () => {
    const response = await proxyExport(new Request("https://bewild.com.br/api/public/export?dataset=leads"), "https://backend.example", vi.fn().mockResolvedValue(Response.json({ error: "unauthorized" }, { status: 401 })));
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ error: "unauthorized" });
  });
  it("préserve le refus d’un jeu de données non autorisé", async () => {
    const response = await proxyExport(new Request("https://bewild.com.br/api/public/export?dataset=analytics_daily"), "https://backend.example", vi.fn().mockResolvedValue(new Response("Forbidden", { status: 403 })));
    expect(response.status).toBe(403);
  });
});