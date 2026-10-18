import { describe, expect, it } from "vitest";
import { summarizeAdsQuality, type QualityLead } from "@/lib/googleAdsQualityReport";
const lead = (id: string, extra: Partial<QualityLead> = {}): QualityLead => ({ id, landing_path: "/orcamento", objetivo: "Moradia", utm_source: "google", utm_medium: "cpc", utm_campaign: "A", utm_content: null, gclid: null, status: "descartado", crm_synced_at: "2026-10-18", location: "Pinheiros", area_m2: 35, chaves: "Sim", ...extra });
describe("Qualidade dos leads de Google Ads", () => {
  it("compara descartes e demais sem duplicar pedidos", () => {
    const rows = summarizeAdsQuality([lead("a"), lead("a"), lead("b", { status: "contatado" })]);
    expect(rows.find(row => row.dimension === "objetivo")).toMatchObject({ leads: 2, disqualified: 1, other: 1, rate: 0.5 });
  });
  it("idade ausente não é deduzida pelo bairro nem pelas chaves", () => {
    expect(summarizeAdsQuality([lead("a")]).find(row => row.dimension === "idade")).toMatchObject({ value: "Não informado", leads: 1 });
  });
  it("leitura ausente não entra no denominador ou como descarte", () => {
    const rows = summarizeAdsQuality([lead("a"), lead("b", { crm_synced_at: null })]);
    expect(rows[0]).toMatchObject({ leads: 2, disqualified: 1, unavailable: 1, rate: 1 });
    expect(summarizeAdsQuality([lead("b", { crm_synced_at: null })])[0].rate).toBeNull();
  });
  it("filtra campanha e exclui tráfego sem atribuição", () => {
    expect(summarizeAdsQuality([lead("a"), lead("b", { utm_campaign: "B" }), lead("c", { utm_source: "organic" })], "A")[0].leads).toBe(1);
  });
  it("preserva os limites de 35 e 60 m² e metragem ausente", () => {
    const rows = summarizeAdsQuality([lead("a"), lead("b", { area_m2: 36 }), lead("c", { area_m2: 60 }), lead("d", { area_m2: 61 }), lead("e", { area_m2: null })]).filter(row => row.dimension === "metragem");
    expect(Object.fromEntries(rows.map(row => [row.value, row.leads]))).toEqual({ "Até 35 m²": 1, "36–60 m²": 2, "Acima de 60 m²": 1, "Não informado": 1 });
  });
});