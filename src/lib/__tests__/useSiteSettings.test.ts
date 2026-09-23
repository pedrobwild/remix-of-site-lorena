/**
 * CORE-10 — `fetchSiteSettings` não pode cachear DEFAULTS quando a leitura
 * falha (antes o `{ error }` do supabase-js era ignorado e os defaults ficavam
 * a sessão inteira: sem trackers, sem verificações, sem og:image), nem ficar
 * com `inflight` preso quando a promise rejeita.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const maybeSingle = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => maybeSingle() }) }) }),
  },
}));
vi.mock("@/lib/devLog", () => ({ devWarn: vi.fn(), devError: vi.fn() }));

import { fetchSiteSettings, getCachedSiteSettings, invalidateSiteSettings } from "../useSiteSettings";

const ROW = { id: 1, meta_pixel_id: "123456789", seo_keywords: "reforma" };

beforeEach(() => {
  maybeSingle.mockReset();
  invalidateSiteSettings();
});

describe("fetchSiteSettings", () => {
  it("erro do backend: devolve defaults SEM cachear; a próxima chamada tenta de novo", async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: { message: "timeout" } });
    const first = await fetchSiteSettings();
    expect(first.meta_pixel_id).toBeNull();
    expect(getCachedSiteSettings().meta_pixel_id).toBeNull();

    maybeSingle.mockResolvedValueOnce({ data: ROW, error: null });
    const second = await fetchSiteSettings();
    expect(maybeSingle).toHaveBeenCalledTimes(2);
    expect(second.meta_pixel_id).toBe("123456789");

    // Agora sim em cache: sem nova ida ao banco.
    await fetchSiteSettings();
    expect(maybeSingle).toHaveBeenCalledTimes(2);
  });

  it("promise rejeitada: não lança, não prende o inflight e permite nova tentativa", async () => {
    maybeSingle.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(fetchSiteSettings()).resolves.toMatchObject({ id: 1 });

    maybeSingle.mockResolvedValueOnce({ data: ROW, error: null });
    await expect(fetchSiteSettings()).resolves.toMatchObject({ seo_keywords: "reforma" });
    expect(maybeSingle).toHaveBeenCalledTimes(2);
  });

  it("chamadas simultâneas compartilham a mesma leitura", async () => {
    maybeSingle.mockResolvedValueOnce({ data: ROW, error: null });
    const [a, b] = await Promise.all([fetchSiteSettings(), fetchSiteSettings()]);
    expect(a).toBe(b);
    expect(maybeSingle).toHaveBeenCalledTimes(1);
  });

  it("force com erro mantém o último valor bom", async () => {
    maybeSingle.mockResolvedValueOnce({ data: ROW, error: null });
    await fetchSiteSettings();
    maybeSingle.mockResolvedValueOnce({ data: null, error: { message: "500" } });
    const forced = await fetchSiteSettings(true);
    expect(forced.meta_pixel_id).toBe("123456789");
  });
});
