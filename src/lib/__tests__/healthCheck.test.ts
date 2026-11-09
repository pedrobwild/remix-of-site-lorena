/**
 * Edge function `health` (sonda do banco para monitor externo, depois do
 * backend pausado de 06–08/11/2026): 200 só quando o banco responde; nunca
 * expõe dado.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { databaseResponds, HEALTH_TIMEOUT_MS, healthResponse } from "@/../supabase/functions/health/check";

const env = (vars: Record<string, string>) => (name: string) => vars[name];
const ENV = env({ SUPABASE_URL: "https://x.supabase.co/", SUPABASE_SERVICE_ROLE_KEY: "service" });

afterEach(() => vi.useRealTimers());

describe("databaseResponds", () => {
  it("HEAD leve em site_settings, sem trazer linhas", async () => {
    const fetchFn = vi.fn(async () => new Response(null, { status: 200 }));
    await expect(databaseResponds(ENV, fetchFn)).resolves.toBe(true);
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://x.supabase.co/rest/v1/site_settings?select=id&limit=1");
    expect(init.method).toBe("HEAD");
  });

  it("erro HTTP, rede ou falta de credencial → false", async () => {
    await expect(databaseResponds(ENV, async () => new Response(null, { status: 503 }))).resolves.toBe(false);
    await expect(databaseResponds(ENV, async () => Promise.reject(new TypeError("rede")))).resolves.toBe(false);
    await expect(databaseResponds(env({}), vi.fn())).resolves.toBe(false);
  });

  it("banco que não responde: aborta no teto", async () => {
    vi.useFakeTimers();
    const fetchFn = (_url: string, init: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
      });
    const pending = databaseResponds(ENV, fetchFn);
    await vi.advanceTimersByTimeAsync(HEALTH_TIMEOUT_MS);
    await expect(pending).resolves.toBe(false);
  });
});

describe("healthResponse", () => {
  it("só ok, com 200 ou 503", () => {
    expect(healthResponse(true)).toEqual({ status: 200, body: { ok: true } });
    expect(healthResponse(false)).toEqual({ status: 503, body: { ok: false } });
  });
});
