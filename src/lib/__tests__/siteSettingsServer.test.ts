import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SETTINGS_MEMO_MS, readPublicSiteSettings, resetSiteSettingsMemo } from "../siteSettingsServer";

describe("readPublicSiteSettings (memo de 60 s no servidor)", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    resetSiteSettingsMemo();
    process.env["SUPABASE_URL"] = "https://x.supabase.co";
    process.env["SUPABASE_PUBLISHABLE_KEY"] = "k";
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  const ok = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));

  it("chamadas simultâneas e seguintes dentro de 60 s fazem uma consulta só", async () => {
    fetchMock.mockImplementation(() => ok({ pages_seo: { "/": { title: "T" } } }));
    let t = 10_000;
    const now = () => t;
    const [a, b] = await Promise.all([readPublicSiteSettings({ now }), readPublicSiteSettings({ now })]);
    expect(a).toEqual(b);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    t += SETTINGS_MEMO_MS - 1;
    expect(await readPublicSiteSettings({ now })).toEqual(a);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    t += 2;
    await readPublicSiteSettings({ now });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("falha não entra no memo; `fresh` ignora o memo", async () => {
    fetchMock.mockImplementationOnce(() => Promise.resolve(new Response("x", { status: 500 })));
    expect(await readPublicSiteSettings()).toBeNull();
    fetchMock.mockImplementation(() => ok({ a: 1 }));
    expect(await readPublicSiteSettings()).toEqual({ a: 1 });
    expect(await readPublicSiteSettings({ fresh: true })).toEqual({ a: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("sem chaves devolve null sem consultar", async () => {
    delete process.env["SUPABASE_URL"];
    vi.stubEnv("VITE_SUPABASE_URL", "");
    expect(await readPublicSiteSettings()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("sem SUPABASE_URL no servidor (Vercel) usa as VITE_* embutidas no build", async () => {
    delete process.env["SUPABASE_URL"];
    delete process.env["SUPABASE_PUBLISHABLE_KEY"];
    vi.stubEnv("VITE_SUPABASE_URL", "https://v.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "pk");
    fetchMock.mockImplementation(() => ok({ a: 1 }));
    expect(await readPublicSiteSettings()).toEqual({ a: 1 });
    expect(fetchMock.mock.calls[0][0]).toBe("https://v.supabase.co/rest/v1/rpc/get_public_site_settings");
    vi.unstubAllEnvs();
  });
});
