/**
 * Conversões offline do Google Ads (conjunto `google_ads_offline` da
 * edge function `data-export`): quem entra (pela movimentação no funil do
 * CRM, nunca pela marcação do painel do site), hash de e-mail/telefone, hora
 * com fuso e as janelas de 63/90 dias do Google.
 */
import { describe, expect, it } from "vitest";
import {
  buildGoogleAdsOfflineRows,
  canExportGoogleAdsLead,
  crmLossTimeAfterLead,
  crmPipelineQuality,
  pickPipelineTimes,
  type GoogleAdsExportConsent,
  DATASETS,
  GOOGLE_ADS_QUALIFIED_CONVERSION,
  GOOGLE_ADS_WON_CONVERSION,
  googleAdsConversionTime,
  keyAllowsDataset,
  normalizeEmailForHash,
  normalizePhoneForHash,
  sha256Hex,
  toCsv,
  toExportRecord,
} from "../../../supabase/functions/_shared/data-export";

const NOW = new Date("2026-10-14T15:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();

const lead = (over: Record<string, unknown> = {}) => ({
  id: "l1",
  created_at: daysAgo(10),
  updated_at: daysAgo(2),
  status: "qualificado",
  objetivo: "Short stay",
  gclid: "Cj0KCQjw-abc",
  email: "  Ana@Exemplo.com ",
  whatsapp: "11987654321",
  crm_won: false,
  crm_lost: false,
  crm_max_stage_key: "lead",
  crm_last_change_at: null,
  consent_marketing: true,
  ...over,
});
/** Perdido no CRM sem ter chegado a Lead, com a perda depois da chegada do lead ao site. */
const perdido = (over: Record<string, unknown> = {}) => lead({ crm_max_stage_key: "qualificacao", crm_lost: true, crm_last_change_at: daysAgo(2), ...over });

const consent = (): GoogleAdsExportConsent => ({
  event: { recordId: "acceptance-1", noticeVersion: "ads-v2", acceptedAt: daysAgo(12), advertising: true },
  current: { recordId: "acceptance-1", noticeVersion: "ads-v2", acceptedAt: daysAgo(12), advertising: true },
});
const consentByLead = (leads: Record<string, unknown>[]) => new Map(leads.map((row) => {
  const evidence = consent();
  evidence.event.acceptedAt = String(row.created_at);
  evidence.current.acceptedAt = String(row.created_at);
  return [String(row.id), evidence] as const;
}));

const build = (leads: Record<string, unknown>[], qualifiedAt = new Map<string, string>()) =>
  buildGoogleAdsOfflineRows({ leads, qualifiedAt, now: NOW, consentByLead: consentByLead(leads) });

describe("google_ads_offline — autorização publicitária", () => {
  it.each([false, null, undefined, "true"])("bloqueia consent_marketing=%s mesmo com evidência", async (value) => {
    expect(await build([lead({ consent_marketing: value })])).toEqual([]);
  });
  it("flag verdadeiro sem registros de aceite exporta qualificação e contrato", async () => {
    const rows = await buildGoogleAdsOfflineRows({ leads: [lead({ crm_won: true })], qualifiedAt: new Map(), now: NOW });
    expect(rows.map((row) => row["Conversion Name"])).toEqual([GOOGLE_ADS_QUALIFIED_CONVERSION, GOOGLE_ADS_WON_CONVERSION]);
  });
  it("recusa no aviso não muda o aceite explícito do formulário no offline", async () => {
    const evidence = consent();
    evidence.current = { ...evidence.current, advertising: false };
    expect(await buildGoogleAdsOfflineRows({ leads: [lead()], qualifiedAt: new Map(), now: NOW,
      consentByLead: new Map([["l1", evidence]]) })).toHaveLength(1);
  });
  it("captura recusada no aviso não bloqueia o aceite do formulário", async () => {
    const evidence = consent();
    evidence.event.advertising = false;
    expect(await buildGoogleAdsOfflineRows({ leads: [lead()], qualifiedAt: new Map(), now: NOW,
      consentByLead: new Map([["l1", evidence]]) })).toHaveLength(1);
  });
  it.each(["event", "current"] as const)("versão do aviso %s não condiciona offline", async (key) => {
    const evidence = consent();
    evidence[key].noticeVersion = "";
    expect(await buildGoogleAdsOfflineRows({ leads: [lead()], qualifiedAt: new Map(), now: NOW,
      consentByLead: new Map([["l1", evidence]]) })).toHaveLength(1);
  });
  it("data do aviso não condiciona offline", async () => {
    const evidence = consent();
    evidence.event.acceptedAt = daysAgo(1);
    expect(await buildGoogleAdsOfflineRows({ leads: [lead()], qualifiedAt: new Map(), now: NOW,
      consentByLead: new Map([["l1", evidence]]) })).toHaveLength(1);
  });
  it.each([null, "", "inválida"])("created_at inválido %s bloqueia", async (created_at) => {
    expect(canExportGoogleAdsLead(lead({ created_at }))).toBe(false);
    expect(await build([lead({ created_at })])).toEqual([]);
  });
});

describe("google_ads_offline — quem entra", () => {
  it.each(["Short stay", "Locação tradicional", "Uso misto"])("qualificado com objetivo %s vira Lead qualificado investidor", async (objetivo) => {
    const rows = await build([lead({ objetivo })]);
    expect(rows.map((r) => r["Conversion Name"])).toEqual([GOOGLE_ADS_QUALIFIED_CONVERSION]);
    expect(rows[0]["Conversion Value"]).toBe(10000);
    expect(rows[0]["Conversion Currency"]).toBe("BRL");
  });

  it.each(["Moradia", "Ainda avaliando", null])("objetivo %s não conta como investidor", async (objetivo) => {
    expect(await build([lead({ objetivo })])).toEqual([]);
  });

  it.each(["mql", "qualificacao", null])("etapa máxima %s com negócio aberto fica fora", async (crm_max_stage_key) => {
    expect(await build([lead({ crm_max_stage_key })])).toEqual([]);
  });

  it.each(["lead", "validacao_briefing", "entregue", "enviado", "negociacao"])("etapa máxima %s conta como chegada a Lead", async (crm_max_stage_key) => {
    const rows = await build([lead({ crm_max_stage_key })]);
    expect(rows.map((r) => r["Conversion Name"])).toEqual([GOOGLE_ADS_QUALIFIED_CONVERSION]);
  });

  it("perdido no CRM antes de Lead vai como \"Lead desqualificado\", na hora da perda", async () => {
    const rows = await buildGoogleAdsOfflineRows({
      leads: [perdido()], qualifiedAt: new Map(), lostAt: new Map([["l1", "2026-10-14T14:00:00Z"]]), now: NOW,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]["Conversion Name"]).toBe("Lead desqualificado");
    expect(rows[0]["Conversion Time"]).toBe("2026-10-14 11:00:00-03:00");
    expect(rows[0]["Conversion Value"]).toBeNull();
  });

  it("perda sem linha no histórico usa a última mudança no CRM", async () => {
    const [row] = await build([perdido({ crm_last_change_at: "2026-10-13T15:00:00Z" })]);
    expect(row["Conversion Time"]).toBe("2026-10-13 12:00:00-03:00");
  });

  // Pedro, 09/11/2026: lead recente que herda um negócio antigo já perdido
  // (o formulário do site não reabre negócio) não é desqualificado por isso.
  it("perda anterior à chegada do lead não vira desqualificado", async () => {
    const antigo = perdido({ created_at: "2026-10-10T12:00:00Z", crm_last_change_at: "2026-07-10T20:37:03Z" });
    const pelaLinha = await buildGoogleAdsOfflineRows({
      leads: [perdido({ created_at: "2026-10-10T12:00:00Z" })], qualifiedAt: new Map(), lostAt: new Map([["l1", "2026-07-10T20:37:03Z"]]), now: NOW,
    });
    expect(pelaLinha).toEqual([]);
    expect(await build([antigo])).toEqual([]);
  });

  it("perda sem hora conhecida no CRM não vira desqualificado", async () => {
    expect(await build([perdido({ crm_last_change_at: null })])).toEqual([]);
  });

  it("perdido antes, reaberto e perdido de novo depois do lead: vale a perda nova", async () => {
    const rows = await buildGoogleAdsOfflineRows({
      leads: [perdido({ created_at: "2026-10-10T12:00:00Z", crm_last_change_at: "2026-07-10T20:00:00Z" })],
      qualifiedAt: new Map(), lostAt: new Map([["l1", "2026-10-12T15:00:00Z"]]), now: NOW,
    });
    expect(rows.map((r) => [r["Conversion Name"], r["Conversion Time"]])).toEqual([["Lead desqualificado", "2026-10-12 12:00:00-03:00"]]);
  });

  it.each([
    [{ created_at: "2026-10-10T12:00:00Z", crm_last_change_at: "2026-10-10T12:00:00Z" }, undefined, "2026-10-10T12:00:00Z"],
    [{ created_at: "2026-10-10T12:00:00Z", crm_last_change_at: "2026-10-09T12:00:00Z" }, undefined, null],
    [{ created_at: "2026-10-10T12:00:00Z", crm_last_change_at: "2026-10-09T12:00:00Z" }, "2026-10-11T12:00:00Z", "2026-10-11T12:00:00Z"],
    [{ created_at: "2026-10-10T12:00:00Z", crm_last_change_at: "2026-10-12T12:00:00Z" }, "2026-10-01T12:00:00Z", null],
    [{ created_at: "2026-10-10T12:00:00Z", crm_last_change_at: null }, undefined, null],
    [{ created_at: null, crm_last_change_at: "2026-10-12T12:00:00Z" }, undefined, null],
  ] as const)("crmLossTimeAfterLead(%j, %s) = %s", (facts, lostAt, expected) => {
    expect(crmLossTimeAfterLead(facts, lostAt)).toBe(expected);
  });

  it("perdido depois de chegar a Lead continua qualificado e não vira desqualificado", async () => {
    const rows = await build([lead({ crm_lost: true })]);
    expect(rows.map((r) => r["Conversion Name"])).toEqual([GOOGLE_ADS_QUALIFIED_CONVERSION]);
  });
});

describe("google_ads_offline — a marcação do painel do site não decide (Pedro, 09/11/2026)", () => {
  it("marcado qualificado no site, ainda em MQL no CRM: não sai", async () => {
    expect(await build([lead({ status: "qualificado", manual_qualification: "qualificado", crm_max_stage_key: "mql" })])).toEqual([]);
  });

  it("marcado não qualificado no site, negócio aberto no CRM: não sai", async () => {
    expect(await build([lead({ status: "descartado", manual_qualification: "descartado", manual_qualification_at: "2026-10-14T14:00:00Z", crm_max_stage_key: "qualificacao" })])).toEqual([]);
  });

  it("marcado não qualificado no site, mas chegou a Lead no CRM: sai como qualificado", async () => {
    const rows = await build([lead({ status: "descartado", manual_qualification: "descartado", crm_max_stage_key: "enviado" })]);
    expect(rows.map((r) => r["Conversion Name"])).toEqual([GOOGLE_ADS_QUALIFIED_CONVERSION]);
  });

  it("sem marcação nenhuma, o funil basta: status novo que chegou a Lead sai; perdido antes de Lead sai como desqualificado", async () => {
    const ok = await build([lead({ status: "novo" })]);
    expect(ok.map((r) => r["Conversion Name"])).toEqual([GOOGLE_ADS_QUALIFIED_CONVERSION]);
    const fora = await build([perdido({ status: "novo", crm_last_change_at: daysAgo(1) })]);
    expect(fora.map((r) => r["Conversion Name"])).toEqual(["Lead desqualificado"]);
  });

  it.each([
    [{ crm_won: true, crm_max_stage_key: null, crm_lost: false }, "qualificado"],
    [{ crm_won: false, crm_max_stage_key: "lead", crm_lost: false }, "qualificado"],
    [{ crm_won: false, crm_max_stage_key: "negociacao", crm_lost: true }, "qualificado"],
    [{ crm_won: false, crm_max_stage_key: "mql", crm_lost: true }, "descartado"],
    [{ crm_won: false, crm_max_stage_key: "qualificacao", crm_lost: true }, "descartado"],
    [{ crm_won: false, crm_max_stage_key: null, crm_lost: true }, "descartado"],
    [{ crm_won: false, crm_max_stage_key: "qualificacao", crm_lost: false }, null],
    [{ crm_won: false, crm_max_stage_key: "mql", crm_lost: false }, null],
    [{ crm_won: null, crm_max_stage_key: null, crm_lost: null }, null],
  ] as const)("crmPipelineQuality(%j) = %s", (facts, expected) => {
    expect(crmPipelineQuality({ status: "qualquer", manual_qualification: "qualificado", ...facts })).toBe(expected);
  });
});

describe("google_ads_offline — contrato e identificadores", () => {
  it("contrato ganho entra com qualquer objetivo, e o lead investidor ganho gera as duas conversões", async () => {
    const moradia = await build([lead({ objetivo: "Moradia", status: "contatado", crm_won: true, crm_last_change_at: daysAgo(1) })]);
    expect(moradia.map((r) => r["Conversion Name"])).toEqual([GOOGLE_ADS_WON_CONVERSION]);
    const ambos = await build([lead({ crm_won: true, crm_last_change_at: daysAgo(1) })]);
    expect(ambos.map((r) => r["Conversion Name"])).toEqual([GOOGLE_ADS_QUALIFIED_CONVERSION, GOOGLE_ADS_WON_CONVERSION]);
  });

  it("parceria comercial e lead sem gclid, e-mail ou telefone ficam fora", async () => {
    expect(await build([lead({ objetivo: "Parceria comercial — corretor", crm_won: true })])).toEqual([]);
    expect(await build([lead({ gclid: null, email: null, whatsapp: "123" })])).toEqual([]);
  });

  it("hora da qualificação é a chegada a Lead no histórico; sem ela, a última mudança no CRM; sem as duas, updated_at", async () => {
    const at = "2026-10-05T13:30:00Z";
    const [comLog] = await build([lead({ crm_last_change_at: daysAgo(1) })], new Map([["l1", at]]));
    expect(comLog["Conversion Time"]).toBe("2026-10-05 10:30:00-03:00");
    const [semLog] = await build([lead({ crm_last_change_at: "2026-10-07T13:30:00Z" })]);
    expect(semLog["Conversion Time"]).toBe("2026-10-07 10:30:00-03:00");
    const [semNada] = await build([lead()]);
    expect(semNada["Conversion Time"]).toBe(googleAdsConversionTime(daysAgo(2)));
  });
});

describe("google_ads_offline — janelas do Google", () => {
  it("com gclid: até 90 dias do lead", async () => {
    expect(await build([lead({ created_at: daysAgo(89) })])).toHaveLength(1);
    expect(await build([lead({ created_at: daysAgo(91) })])).toEqual([]);
  });

  it("sem gclid (só e-mail/telefone): até 63 dias", async () => {
    expect(await build([lead({ gclid: null, created_at: daysAgo(62) })])).toHaveLength(1);
    expect(await build([lead({ gclid: null, created_at: daysAgo(64) })])).toEqual([]);
  });
});

describe("google_ads_offline — uma conversão por pessoa e nome", () => {
  it("mesmos hashes com 19 minutos de diferença mantêm só a qualificação mais antiga", async () => {
    const earlier = "2026-10-12T12:00:00Z";
    const later = "2026-10-12T12:19:00Z";
    const rows = await build([
      lead({ id: "later", updated_at: later }),
      lead({ id: "earlier", updated_at: earlier }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      Email: await sha256Hex("ana@exemplo.com"),
      "Phone Number": await sha256Hex("+5511987654321"),
      "Conversion Name": "Lead qualificado investidor",
      "Conversion Time": "2026-10-12 09:00:00-03:00",
      "Conversion Value": 10000,
    });
  });

  it("prioriza e-mail mesmo com telefones e gclids diferentes", async () => {
    expect(await build([lead(), lead({ id: "l2", email: "ana@exemplo.com", whatsapp: "11912345678", gclid: "other" })])).toHaveLength(1);
  });

  it("sem e-mail usa telefone normalizado; sem contatos usa gclid", async () => {
    expect(await build([lead({ email: null }), lead({ id: "l2", email: null, whatsapp: "+55 (11) 98765-4321", gclid: "other" })])).toHaveLength(1);
    expect(await build([lead({ email: null, whatsapp: null }), lead({ id: "l2", email: null, whatsapp: null })])).toHaveLength(1);
  });

  it("não une pessoas com e-mails distintos nem nomes de conversão diferentes", async () => {
    const rows = await build([
      lead({ crm_won: true, crm_last_change_at: daysAgo(1) }),
      lead({ id: "l2", email: "outra@exemplo.com" }),
      lead({ id: "l3", crm_won: true, crm_last_change_at: daysAgo(1) }), // mesma pessoa de l1
    ]);
    const names = rows.map((r) => r["Conversion Name"]);
    // Qualificação: uma por pessoa (l1 e l2). Contrato: um por lead, sem unir (l1 e l3).
    expect(names.filter((n) => n === "Lead qualificado investidor")).toHaveLength(2);
    expect(names.filter((n) => n === "Contrato assinado")).toHaveLength(2);
  });

  it("dois contratos da mesma pessoa saem em duas linhas", async () => {
    const l = lead({ crm_won: true });
    const rows = await buildGoogleAdsOfflineRows({
      leads: [l], qualifiedAt: new Map(), now: NOW, consentByLead: consentByLead([l]),
      contracts: new Map([["l1", [{ total: 60000, closed_at: daysAgo(3) }, { total: 70000, closed_at: daysAgo(1) }]]]),
    });
    const won = rows.filter((r) => r["Conversion Name"] === "Contrato assinado");
    expect(won.map((r) => r["Conversion Value"])).toEqual([60000, 70000]);
  });
});

describe("google_ads_offline — horas pelo histórico do funil", () => {
  it("chegada a Lead: primeira transição para Lead ou depois, nunca MQL nem Qualificação", () => {
    const t = pickPipelineTimes([
      { lead_id: "l1", created_at: "2026-10-01T10:00:00Z", note: "CRM: entrou em MQL" },
      { lead_id: "l1", created_at: "2026-10-02T10:00:00Z", note: "CRM: MQL → Qualificação" },
      { lead_id: "l1", created_at: "2026-10-03T10:00:00Z", note: "CRM: Qualificação → Lead" },
      { lead_id: "l1", created_at: "2026-10-04T10:00:00Z", note: "CRM: Lead → Solicitado" },
    ]);
    expect(t.reachedLeadAt.get("l1")).toBe("2026-10-03T10:00:00Z");
    expect(t.lostAt.has("l1")).toBe(false);
  });
  it("marcação manual e entrada no MQL não são chegada a Lead", () => {
    const t = pickPipelineTimes([
      { lead_id: "l1", created_at: "2026-10-01T10:00:00Z", note: "Qualificação manual: qualificado" },
      { lead_id: "l1", created_at: "2026-10-02T10:00:00Z", note: "CRM: entrou em MQL" },
    ]);
    expect(t.reachedLeadAt.has("l1")).toBe(false);
  });
  it("perda: a última transição para etapa terminal, e ela não conta como chegada a Lead", () => {
    const t = pickPipelineTimes([
      { lead_id: "l1", created_at: "2026-10-01T10:00:00Z", note: "CRM: entrou em MQL" },
      { lead_id: "l1", created_at: "2026-10-02T10:00:00Z", note: "CRM: MQL → Perdido" },
      { lead_id: "l1", created_at: "2026-10-05T10:00:00Z", note: "CRM: Perdido → MQL" },
      { lead_id: "l1", created_at: "2026-10-06T10:00:00Z", note: "CRM: MQL → Aquecer Futuramente" },
      { lead_id: "l2", created_at: "2026-10-03T10:00:00Z", note: "CRM: Qualificação → Desqualificado" },
    ]);
    expect(t.lostAt.get("l1")).toBe("2026-10-06T10:00:00Z");
    expect(t.lostAt.get("l2")).toBe("2026-10-03T10:00:00Z");
    expect(t.reachedLeadAt.size).toBe(0);
  });
});

describe("google_ads_offline — hash e formato", () => {
  it("normaliza e-mail e telefone como o Google pede", () => {
    expect(normalizeEmailForHash("  Ana@Exemplo.COM ")).toBe("ana@exemplo.com");
    expect(normalizeEmailForHash("sem-arroba")).toBeNull();
    expect(normalizePhoneForHash("(11) 98765-4321")).toBe("+5511987654321");
    expect(normalizePhoneForHash("5511987654321")).toBe("+5511987654321");
    expect(normalizePhoneForHash("1133334444")).toBe("+551133334444");
    expect(normalizePhoneForHash("98765")).toBeNull();
  });

  it("e-mail e telefone saem só em hash SHA-256; gclid como está; BRL; qualificado vale R$ 10.000", async () => {
    const [row] = await build([lead()]);
    expect(row.Email).toBe(await sha256Hex("ana@exemplo.com"));
    expect(row["Phone Number"]).toBe(await sha256Hex("+5511987654321"));
    expect(row["Google Click ID"]).toBe("Cj0KCQjw-abc");
    expect(row["Conversion Currency"]).toBe("BRL");
    expect(row["Conversion Value"]).toBe(10000);

    const csv = toCsv("google_ads_offline", [toExportRecord("google_ads_offline", row)], { sep: ",", dec: "." });
    expect(csv.split("\r\n")[0]).toBe(
      "Google Click ID,Email,Phone Number,Conversion Name,Conversion Time,Conversion Value,Conversion Currency",
    );
    expect(csv).not.toMatch(/exemplo\.com|98765/i);
  });

  it("hora em São Paulo com o fuso explícito", () => {
    expect(googleAdsConversionTime("2026-10-14T15:00:00Z")).toBe("2026-10-14 12:00:00-03:00");
    expect(googleAdsConversionTime("lixo")).toBeNull();
  });

  it("colunas na ordem do Data Manager", () => {
    expect(DATASETS.google_ads_offline.columns.map((c) => c.name)).toEqual([
      "Google Click ID",
      "Email",
      "Phone Number",
      "Conversion Name",
      "Conversion Time",
      "Conversion Value",
      "Conversion Currency",
    ]);
  });
});

describe("google_ads_offline — acesso pela chave", () => {
  it("vale para chave com o conjunto ou com leads; não para as outras", () => {
    expect(keyAllowsDataset(["google_ads_offline"], "google_ads_offline")).toBe(true);
    expect(keyAllowsDataset(["leads"], "google_ads_offline")).toBe(true);
    expect(keyAllowsDataset(["meta_ads_daily"], "google_ads_offline")).toBe(false);
    expect(keyAllowsDataset(["leads"], "meta_leads")).toBe(false);
  });
});

describe("Contrato assinado com valor real do CRM", () => {
  // Moradia: só o contrato sai (o qualificado é só de investidor).
  const won = lead({ objetivo: "Moradia", crm_won: true, crm_last_change_at: daysAgo(1) });
  it("usa o total e a data do contrato informados pelo CRM", async () => {
    const rows = await buildGoogleAdsOfflineRows({ leads: [won], qualifiedAt: new Map(), now: NOW, consentByLead: consentByLead([won]),
      contracts: new Map([["l1", [{ total: 71850, closed_at: daysAgo(3) }]]]) });
    expect(rows).toHaveLength(1);
    expect(rows[0]["Conversion Value"]).toBe(71850);
    expect(rows[0]["Conversion Time"]).toBe(googleAdsConversionTime(daysAgo(3)));
  });
  it("sem leitura do CRM o valor fica vazio, nunca o peso de R$ 10.000 do qualificado", async () => {
    const rows = await build([won]);
    expect(rows[0]["Conversion Value"]).toBeNull();
  });
  it("contrato sem valor no CRM também fica vazio", async () => {
    const rows = await buildGoogleAdsOfflineRows({ leads: [won], qualifiedAt: new Map(), now: NOW, consentByLead: consentByLead([won]),
      contracts: new Map([["l1", [{ total: null, closed_at: null }]]]) });
    expect(rows[0]["Conversion Value"]).toBeNull();
  });
});
