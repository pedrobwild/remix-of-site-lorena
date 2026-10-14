/**
 * Conversões offline do Google Ads (conjunto `google_ads_offline` da
 * edge function `data-export`): quem entra, hash de e-mail/telefone, hora com
 * fuso e as janelas de 63/90 dias do Google.
 */
import { describe, expect, it } from "vitest";
import {
  buildGoogleAdsOfflineRows,
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
  crm_last_change_at: null,
  ...over,
});

const build = (leads: Record<string, unknown>[], qualifiedAt = new Map<string, string>()) =>
  buildGoogleAdsOfflineRows({ leads, qualifiedAt, now: NOW });

describe("google_ads_offline — quem entra", () => {
  it.each(["Short stay", "Locação tradicional", "Uso misto"])("qualificado com objetivo %s vira Lead qualificado investidor", async (objetivo) => {
    const rows = await build([lead({ objetivo })]);
    expect(rows.map((r) => r["Conversion Name"])).toEqual([GOOGLE_ADS_QUALIFIED_CONVERSION]);
  });

  it.each(["Moradia", "Ainda avaliando", null])("objetivo %s não conta como investidor", async (objetivo) => {
    expect(await build([lead({ objetivo })])).toEqual([]);
  });

  it("só qualificado conta (novo/contatado/descartado ficam fora)", async () => {
    for (const status of ["novo", "contatado", "descartado"]) expect(await build([lead({ status })])).toEqual([]);
  });

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

  it("hora da qualificação vem do histórico; sem histórico, updated_at", async () => {
    const at = "2026-10-05T13:30:00Z";
    const [comLog] = await build([lead()], new Map([["l1", at]]));
    expect(comLog["Conversion Time"]).toBe("2026-10-05 10:30:00-03:00");
    const [semLog] = await build([lead()]);
    expect(semLog["Conversion Time"]).toBe(googleAdsConversionTime(daysAgo(2)));
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

describe("google_ads_offline — hash e formato", () => {
  it("normaliza e-mail e telefone como o Google pede", () => {
    expect(normalizeEmailForHash("  Ana@Exemplo.COM ")).toBe("ana@exemplo.com");
    expect(normalizeEmailForHash("sem-arroba")).toBeNull();
    expect(normalizePhoneForHash("(11) 98765-4321")).toBe("+5511987654321");
    expect(normalizePhoneForHash("5511987654321")).toBe("+5511987654321");
    expect(normalizePhoneForHash("1133334444")).toBe("+551133334444");
    expect(normalizePhoneForHash("98765")).toBeNull();
  });

  it("e-mail e telefone saem só em hash SHA-256; gclid como está; BRL; valor vazio", async () => {
    const [row] = await build([lead()]);
    expect(row.Email).toBe(await sha256Hex("ana@exemplo.com"));
    expect(row["Phone Number"]).toBe(await sha256Hex("+5511987654321"));
    expect(row["Google Click ID"]).toBe("Cj0KCQjw-abc");
    expect(row["Conversion Currency"]).toBe("BRL");
    expect(row["Conversion Value"]).toBeNull();

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
