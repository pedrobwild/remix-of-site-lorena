import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", async () => {
  const fake = await import("./helpers/supabaseFake");
  return { supabase: fake.fakeSupabase };
});

import { calls, functionsInvoke, hasOp, resetFake, setResponder } from "./helpers/supabaseFake";
import {
  campaignsFromDaily,
  dailyAdsSeries,
  displayMetaPhone,
  fetchMetaPaidSummary,
  isMetaSiteLead,
  leadAnswers,
  META_SITE_LEAD_FILTER,
  metaErrorHint,
  metaErrorReason,
  metaSyncSummary,
  metaWaLink,
  notifySummary,
  platformLabel,
  relativeTime,
  shiftDay,
  sumAdsDaily,
  triggerMetaSync,
  type MetaSyncStateRow,
} from "@/lib/metaAds";

beforeEach(() => {
  resetFake();
});

const day = (date: string, campaign: string, name: string | null, spend: number, extra: Partial<Record<string, number>> = {}) => ({
  date,
  campaign_id: campaign,
  campaign_name: name,
  currency: "BRL",
  spend,
  impressions: extra.impressions ?? 1000,
  clicks: extra.clicks ?? 30,
  link_clicks: extra.link_clicks ?? 20,
  leads: extra.leads ?? 1,
  form_leads: extra.form_leads ?? 1,
  site_leads: extra.site_leads ?? 0,
  conversations: extra.conversations ?? 0,
});

describe("somas das métricas", () => {
  it("totais e taxas: CTR e CPC pelo clique no link, CPL pelos leads da Meta", () => {
    const t = sumAdsDaily([day("2026-09-23", "1", "A", 100.1, { leads: 3 }), day("2026-09-24", "1", "A", 49.9, { leads: 2 })]);
    expect(t).toMatchObject({ spend: 150, impressions: 2000, linkClicks: 40, leads: 5, formLeads: 2, currency: "BRL" });
    expect(t.ctr).toBeCloseTo(2);
    expect(t.cpc).toBeCloseTo(3.75);
    expect(t.cpm).toBeCloseTo(75);
    expect(t.cpl).toBeCloseTo(30);
  });

  it("sem dados: zeros e taxas nulas (nunca divide por zero)", () => {
    expect(sumAdsDaily([])).toMatchObject({ spend: 0, leads: 0, ctr: null, cpc: null, cpm: null, cpl: null, currency: "BRL" });
  });

  it("valores numéricos que chegam como texto (numeric do Postgres)", () => {
    const row = { ...day("2026-09-24", "1", "A", 0), spend: "12.34" as unknown as number };
    expect(sumAdsDaily([row]).spend).toBe(12.34);
  });

  it("por campanha: maior investimento primeiro e o nome mais recente", () => {
    const list = campaignsFromDaily([
      day("2026-09-20", "1", "Nome antigo", 10),
      day("2026-09-24", "1", "Nome novo", 10),
      day("2026-09-24", "2", null, 50),
    ]);
    expect(list.map((c) => [c.campaignId, c.campaignName, c.spend])).toEqual([
      ["2", "Campanha 2", 50],
      ["1", "Nome novo", 20],
    ]);
  });

  it("série diária com os dias sem entrega zerados", () => {
    const s = dailyAdsSeries([day("2026-09-23", "1", "A", 10, { leads: 2 }), day("2026-09-23", "2", "B", 5)], "2026-09-22", "2026-09-24");
    expect(s.map((p) => [p.day, p.spend, p.leads])).toEqual([
      ["2026-09-22", 0, 0],
      ["2026-09-23", 15, 3],
      ["2026-09-24", 0, 0],
    ]);
    expect(shiftDay("2026-02-28", 1)).toBe("2026-03-01");
  });
});

describe("leads do site vindos da Meta", () => {
  it("utm_source da Meta (qualquer caixa) ou clique de anúncio", () => {
    expect(isMetaSiteLead({ utm_source: "Instagram" })).toBe(true);
    expect(isMetaSiteLead({ utm_source: " fb " })).toBe(true);
    expect(isMetaSiteLead({ utm_source: "google", fbclid: "IwAR1" })).toBe(true);
    expect(isMetaSiteLead({ utm_source: "google" })).toBe(false);
    expect(isMetaSiteLead({})).toBe(false);
    expect(META_SITE_LEAD_FILTER).toBe(
      "fbclid.not.is.null,utm_source.ilike.facebook,utm_source.ilike.fb,utm_source.ilike.instagram,utm_source.ilike.ig,utm_source.ilike.meta",
    );
  });
});

const NOW = Date.parse("2026-09-25T12:00:00Z");
const st = (key: string, o: Partial<MetaSyncStateRow>): MetaSyncStateRow => ({
  key,
  last_run_at: null,
  last_success_at: null,
  last_error: null,
  cursor: {},
  stats: {},
  updated_at: "2026-09-25T12:00:00Z",
  ...o,
});

describe("estado da sincronização", () => {
  it("nunca rodou / sem token", () => {
    expect(metaSyncSummary([], NOW)).toMatchObject({ tone: "off", label: "ainda não sincronizado", connected: false });
    const s = metaSyncSummary([st("ads", { last_error: "no_token" }), st("leads", { last_error: "no_token" })], NOW);
    expect(s).toMatchObject({ tone: "off", label: "não conectado", connected: false });
    expect(s.hint).toContain("META_ADS_ACCESS_TOKEN");
  });

  it("em dia", () => {
    const s = metaSyncSummary(
      [st("ads", { last_success_at: "2026-09-25T11:48:00Z" }), st("leads", { last_success_at: "2026-09-25T11:40:00Z" })],
      NOW,
    );
    expect(s).toEqual({ tone: "ok", label: "sincronizado há 12 min", hint: null, connected: true, lastSuccessAt: "2026-09-25T11:48:00Z" });
  });

  it("só o token dos formulários: métricas sem token não contam como erro", () => {
    const s = metaSyncSummary([st("ads", { last_error: "no_token" }), st("leads", { last_success_at: "2026-09-25T11:50:00Z" })], NOW);
    expect(s.tone).toBe("ok");
  });

  it("erro numa parte: diz qual e o que fazer", () => {
    const s = metaSyncSummary(
      [
        st("ads", { last_success_at: "2026-09-25T09:00:00Z", last_error: "token_invalid: Error validating access token (code 190/463)" }),
        st("leads", { last_success_at: "2026-09-25T11:50:00Z" }),
      ],
      NOW,
    );
    expect(s).toMatchObject({ tone: "error", label: "erro na última sincronização (métricas)", connected: true });
    expect(s.hint).toContain("expirou");
  });

  it("parcial é aviso; sem sucesso há mais de 2h é desatualizado", () => {
    expect(metaSyncSummary([st("leads", { last_success_at: "2026-09-25T11:00:00Z", last_error: "parcial: form:server" })], NOW).tone).toBe("warn");
    const stale = metaSyncSummary([st("ads", { last_success_at: "2026-09-25T06:00:00Z" })], NOW);
    expect(stale).toMatchObject({ tone: "warn", label: "sem sincronizar há 6 h" });
  });

  it("motivos e textos", () => {
    expect(metaErrorReason("permission: (#200) Requires ads_read")).toBe("permission");
    expect(metaErrorReason("parcial: deadline")).toBe("partial");
    expect(metaErrorReason("no_token")).toBe("no_token");
    expect(metaErrorReason("algo estranho")).toBe("unknown");
    expect(metaErrorReason(null)).toBeNull();
    expect(metaErrorHint("permission")).toContain("leads_retrieval");
    expect(relativeTime("2026-09-25T11:59:40Z", NOW)).toBe("agora");
    expect(relativeTime("2026-09-22T12:00:00Z", NOW)).toBe("há 3 dias");
    expect(relativeTime(null, NOW)).toBe("—");
  });
});

describe("leads dos formulários — exibição", () => {
  it("telefone, WhatsApp e plataforma", () => {
    expect(displayMetaPhone("+5511912345678")).toBe("(11) 91234-5678");
    expect(displayMetaPhone("+551132511000")).toBe("(11) 3251-1000");
    expect(displayMetaPhone("+351912345678")).toBe("+351912345678");
    expect(metaWaLink("+5511912345678")).toBe("https://wa.me/5511912345678");
    expect(metaWaLink("123")).toBeNull();
    expect(platformLabel("IG")).toBe("Instagram");
    expect(platformLabel(null)).toBeNull();
  });

  it("respostas: ignora lixo e usa a chave quando falta o rótulo", () => {
    expect(
      leadAnswers([{ key: "a", label: "Pergunta A", value: "sim" }, { key: "b", value: "x" }, { key: "c", label: "C", value: "  " }, null, "x"]),
    ).toEqual([
      { key: "a", label: "Pergunta A", value: "sim" },
      { key: "b", label: "b", value: "x" },
    ]);
    expect(leadAnswers(null)).toEqual([]);
  });

  it("resumo do aviso ao time", () => {
    expect(notifySummary({ slack: "sent", email: "sent", crm: "error" })).toBe("Slack ✓ · e-mail ✓ · CRM erro");
    expect(notifySummary({ skipped: "backfill" })).toBe("importado sem aviso (carga inicial)");
    expect(notifySummary({ skipped: "old" })).toContain("72h");
    expect(notifySummary({ state: "sending" })).toBe("aviso em envio");
    expect(notifySummary(null)).toContain("pendente");
  });
});

describe("consultas", () => {
  it("resumo do período: métricas, formulários (sem teste nem excluídos) e leads do site via Meta", async () => {
    setResponder((call) => {
      if (call.table === "meta_ads_daily") return { data: [day("2026-09-24", "1", "A", 80, { leads: 4 })] };
      if (call.table === "meta_sync_state") return { data: [st("ads", { last_success_at: "2026-09-25T11:50:00Z" })] };
      if (call.table === "meta_leads") return { count: 3 };
      if (call.table === "leads") return { count: 2 };
      return {};
    });
    const res = await fetchMetaPaidSummary(new Date("2026-09-18T03:00:00Z"), new Date("2026-09-25T12:00:00Z"));
    expect(res).toMatchObject({ hasRows: true, formLeads: 3, siteLeadsFromMeta: 2, error: null });
    expect(res.totals.cpl).toBe(20);
    const forms = calls.find((c) => c.table === "meta_leads")!;
    expect(hasOp(forms, "is", "deleted_at", null)).toBe(true);
    expect(hasOp(forms, "eq", "is_test", false)).toBe(true);
    const site = calls.find((c) => c.table === "leads")!;
    expect(hasOp(site, "or", META_SITE_LEAD_FILTER)).toBe(true);
  });

  it("erro numa consulta vira `error` sem derrubar o resto", async () => {
    setResponder((call) => (call.table === "meta_ads_daily" ? { error: { message: "permission denied" } } : { data: [], count: 0 }));
    const res = await fetchMetaPaidSummary(new Date(), new Date());
    expect(res.error).toBe("permission denied");
    expect(res.hasRows).toBe(false);
  });

  it("sincronizar agora: resumo legível do resultado", async () => {
    functionsInvoke.mockResolvedValueOnce({
      data: { ok: true, ads: { status: "ok", rows: 12 }, leads: { status: "ok", inserted: 2, notified: 2 } },
      error: null,
    });
    expect(await triggerMetaSync()).toEqual({
      ok: true,
      message: "métricas: 12 linha(s) atualizada(s) · formulários: 2 lead(s) novo(s), 2 avisado(s)",
    });
    expect(functionsInvoke).toHaveBeenCalledWith("meta-sync", { body: {} });

    functionsInvoke.mockResolvedValueOnce({
      data: { ok: true, ads: { status: "skipped", reason: "no_token" }, leads: { status: "skipped", reason: "no_token" } },
      error: null,
    });
    const noToken = await triggerMetaSync();
    expect(noToken.ok).toBe(false);
    expect(noToken.message).toContain("META_ADS_ACCESS_TOKEN");

    functionsInvoke.mockResolvedValueOnce({
      data: { ok: true, ads: { status: "error", reason: "token_invalid" }, leads: { status: "partial", inserted: 0 } },
      error: null,
    });
    const err = await triggerMetaSync();
    expect(err.ok).toBe(false);
    expect(err.message).toContain("expirou");
    expect(err.message).toContain("leitura parcial");

    functionsInvoke.mockResolvedValueOnce({ data: null, error: { message: "Edge Function returned a non-2xx status code" } });
    expect((await triggerMetaSync()).ok).toBe(false);
  });
});
