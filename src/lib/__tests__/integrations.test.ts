import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", async () => {
  const fake = await import("./helpers/supabaseFake");
  return { supabase: fake.fakeSupabase };
});

import {
  capiStatus,
  googleAdsStatus,
  googleAnalyticsStatus,
  logDetail,
  metaAdsStatus,
  pixelProprioStatus,
  pixelStatus,
  type IntegrationLogRow,
  type IntegrationSettings,
} from "@/lib/integrations";

const NOW = Date.parse("2026-09-25T12:00:00Z");
const EMPTY: IntegrationSettings = {
  meta_pixel_id: null,
  meta_capi_test_event_code: null,
  google_ads_conversion_id: null,
  google_ads_lead_label: null,
  google_ads_contact_label: null,
  google_analytics_id: null,
  google_tag_manager_id: null,
};
const WITH_PIXEL = { ...EMPTY, meta_pixel_id: "123456789012345" };

let seq = 0;
const log = (o: Partial<IntegrationLogRow>): IntegrationLogRow => ({
  id: ++seq,
  created_at: "2026-09-25T11:00:00Z",
  integration: "meta_capi",
  event_name: "Lead",
  lead_id: null,
  status: "sent",
  http_status: 200,
  detail: {},
  ...o,
});

describe("status das integrações", () => {
  it("Pixel da Meta", () => {
    expect(pixelStatus(EMPTY)).toMatchObject({ tone: "off", value: "Não configurado" });
    expect(pixelStatus(WITH_PIXEL)).toMatchObject({ tone: "ok", value: "Ativo" });
  });

  it("API de Conversões: sem Pixel, aguardando, enviando, falta token, erro e modo de teste", () => {
    expect(capiStatus(EMPTY, [], NOW)).toMatchObject({ tone: "off", value: "Sem Pixel" });
    expect(capiStatus(WITH_PIXEL, [], NOW)).toMatchObject({ tone: "off", value: "Aguardando" });
    const sent = capiStatus(WITH_PIXEL, [log({}), log({ created_at: "2026-09-20T10:00:00Z" }), log({ status: "skipped" })], NOW);
    expect(sent).toMatchObject({ tone: "ok", value: "Enviando" });
    expect(sent.detail).toContain("há 1 h");
    expect(sent.detail).toContain("2 evento(s) aceito(s) em 30 dias");
    const noToken = capiStatus(WITH_PIXEL, [log({ status: "skipped", detail: { reason: "no_token" } })], NOW);
    expect(noToken).toMatchObject({ tone: "warn", value: "Falta o token" });
    expect(noToken.detail).toContain("META_CAPI_ACCESS_TOKEN");
    expect(capiStatus(WITH_PIXEL, [log({ status: "skipped", detail: { reason: "no_user_data" } })], NOW).tone).toBe("ok");
    const err = capiStatus(WITH_PIXEL, [log({ status: "error", http_status: 400, detail: { error_code: 190 } })], NOW);
    expect(err).toMatchObject({ tone: "error", value: "Com erro" });
    expect(err.detail).toContain("código 190");
    const test = capiStatus({ ...WITH_PIXEL, meta_capi_test_event_code: "TEST123" }, [log({})], NOW);
    expect(test.tone).toBe("warn");
    expect(test.detail).toContain("modo de teste LIGADO");
    // Registros de outra integração não contam.
    expect(capiStatus(WITH_PIXEL, [log({ integration: "meta_sync" })], NOW).value).toBe("Aguardando");
  });

  it("Meta Ads: segue o estado da sincronização", () => {
    expect(metaAdsStatus([], NOW)).toMatchObject({ tone: "off", value: "Não conectado" });
    const ok = metaAdsStatus(
      [
        { key: "ads", last_run_at: null, last_success_at: "2026-09-25T11:50:00Z", last_error: null, cursor: {}, stats: {}, updated_at: "" },
      ],
      NOW,
    );
    expect(ok).toMatchObject({ tone: "ok", value: "Sincronizado", href: "/admin/analytics?tab=paid" });
  });

  it("Google Ads e GA4/GTM", () => {
    expect(googleAdsStatus(EMPTY).tone).toBe("off");
    expect(googleAdsStatus({ ...EMPTY, google_ads_conversion_id: "AW-1" })).toMatchObject({ tone: "warn", value: "Sem conversão de lead" });
    const ok = googleAdsStatus({ ...EMPTY, google_ads_conversion_id: "AW-1", google_ads_lead_label: "abcd" });
    expect(ok).toMatchObject({ tone: "ok" });
    expect(ok.detail).toContain("contato — (sem rótulo)");
    expect(googleAnalyticsStatus(EMPTY).tone).toBe("off");
    expect(googleAnalyticsStatus({ ...EMPTY, google_analytics_id: "G-1", google_tag_manager_id: "GTM-1" }).detail).toContain("G-1 · GTM-1");
  });

  it("pixel próprio", () => {
    expect(pixelProprioStatus(null, 0, NOW)).toMatchObject({ tone: "off", value: "Sem acessos" });
    expect(pixelProprioStatus("2026-09-25T11:30:00Z", 12, NOW).detail).toBe("Último acesso há 30 min · 12 nos últimos 7 dias.");
  });
});

describe("registro", () => {
  it("detalhe curto e sem dados pessoais", () => {
    expect(logDetail(log({ detail: { events_received: 1, fbtrace_id: "Tr4" } }))).toBe("1 evento(s) aceito(s) · fbtrace Tr4");
    expect(logDetail(log({ status: "skipped", detail: { reason: "no_token" } }))).toBe("sem token");
    expect(logDetail(log({ integration: "meta_sync", event_name: "leads", detail: { inserted: 2, notified: 2, backfill: false } }))).toBe(
      "2 lead(s) novo(s) · 2 avisado(s)",
    );
    expect(logDetail(log({ integration: "meta_sync", event_name: "ads", detail: { rows: 24, backfill: true } }))).toBe("24 linha(s) · carga inicial");
    expect(logDetail(log({ status: "error", detail: { reason: "token_invalid", error_code: 190 } }))).toBe("token expirado ou inválido · código 190");
    expect(logDetail(log({ detail: null }))).toBe("—");
  });
});
