/**
 * CORE-10 — `fetchSiteSettings` não pode cachear DEFAULTS quando a leitura
 * falha (antes o `{ error }` do supabase-js era ignorado e os defaults ficavam
 * a sessão inteira: sem trackers, sem verificações, sem og:image), nem ficar
 * com `inflight` preso quando a promise rejeita.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const maybeSingle = vi.fn();
// Leitura pública via RPC get_public_site_settings (tabela é só admin), direto
// na API REST (publicRest), sem o SDK do Supabase.
vi.mock("@/integrations/supabase/publicRest", () => ({
  publicRpc: (...args: unknown[]) => maybeSingle(...args),
}));
vi.mock("@/lib/devLog", () => ({ devWarn: vi.fn(), devError: vi.fn() }));

import {
  fetchSiteSettings,
  getCachedSiteSettings,
  invalidateSiteSettings,
  mergeSiteSettings,
  SITE_SETTINGS_TIMEOUT_MS,
  TRACKER_DEFAULTS,
} from "../useSiteSettings";

const ROW = { id: 1, meta_pixel_id: "123456789", seo_keywords: "reforma" };

beforeEach(() => {
  maybeSingle.mockReset();
  invalidateSiteSettings();
});

describe("fetchSiteSettings", () => {
  it("erro do backend: devolve defaults SEM cachear; a próxima chamada tenta de novo", async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: { message: "timeout" } });
    const first = await fetchSiteSettings();
    // Sem banco, os IDs reais de produção (backend pausado em 06–08/11/2026).
    expect(first.meta_pixel_id).toBe(TRACKER_DEFAULTS.meta_pixel_id);
    // Nada em cache: antes da 1ª resposta, nenhum tracker (não prende um ID).
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

describe("IDs dos trackers sem banco (incidente de 06–08/11/2026)", () => {
  it("são os de produção", () => {
    expect(TRACKER_DEFAULTS).toEqual({
      meta_pixel_id: "644216424824915",
      google_ads_conversion_id: "AW-16893787587",
      google_ads_lead_label: "NY8ECIz844kdEMP7yvc-",
      google_ads_contact_label: "wMWECJmtp6AdEMP7yvc-",
      google_ads_application_label: "1AYaCKflp6AdEMP7yvc-",
    });
  });

  it("valor do banco vence; vazio, nulo ou ausente cai no padrão", () => {
    const merged = mergeSiteSettings({
      id: 1,
      meta_pixel_id: "999999999999999",
      google_ads_conversion_id: null,
      google_ads_lead_label: "  ",
    });
    expect(merged.meta_pixel_id).toBe("999999999999999");
    expect(merged.google_ads_conversion_id).toBe("AW-16893787587");
    expect(merged.google_ads_lead_label).toBe("NY8ECIz844kdEMP7yvc-");
    expect(merged.google_ads_contact_label).toBe("wMWECJmtp6AdEMP7yvc-");
    // Sem padrão: GA4 extra e GTM continuam só do banco.
    expect(merged.google_analytics_id).toBeNull();
    expect(merged.google_tag_manager_id).toBeNull();
  });

  it("leitura que trava não segura os trackers: aborta no teto e vale o padrão", async () => {
    vi.useFakeTimers();
    try {
      maybeSingle.mockImplementationOnce(
        (_fn: string, _args: unknown, init?: { signal?: AbortSignal }) =>
          new Promise((resolve) => {
            // publicRpc devolve { error } quando o fetch é abortado.
            init?.signal?.addEventListener("abort", () => resolve({ data: null, error: { message: "aborted" } }));
          }),
      );
      const pending = fetchSiteSettings();
      await vi.advanceTimersByTimeAsync(SITE_SETTINGS_TIMEOUT_MS);
      const settings = await pending;
      expect(settings.google_ads_conversion_id).toBe("AW-16893787587");
      expect(settings.meta_pixel_id).toBe("644216424824915");
    } finally {
      vi.useRealTimers();
    }
  });
});
