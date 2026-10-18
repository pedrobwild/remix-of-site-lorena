import { describe, expect, it } from "vitest";
import { summarizeQuoteCrm, type QuoteLead } from "../quoteCrmReport";

const lead = (id: string, patch: Partial<QuoteLead> = {}): QuoteLead => ({ id, form_path: "/orcamento", objetivo: "Short stay", utm_source: "google", utm_medium: "cpc", utm_campaign: "sea_investidor", utm_content: "aluguel", gclid: null, ...patch });
describe("Orçamento até o CRM", () => {
  it("conta uma vez por pedido confirmado, nunca por quantidade de negócios", () => {
    const rows = summarizeQuoteCrm([lead("1"), lead("1"), lead("2")], new Set(["1"]), new Set(["1", "2"]));
    expect(rows[0]).toMatchObject({ requests: 2, confirmed: 1, notConfirmed: 1, unavailable: 0, weight: 5000, variant: "investidor" });
  });
  it("falha de leitura não vira ausência no CRM", () => {
    expect(summarizeQuoteCrm([lead("1")], new Set(), new Set())[0]).toMatchObject({ confirmed: 0, notConfirmed: 0, unavailable: 1 });
  });
  it("mantém peso 1000 para Moradia e objetivo desconhecido sem valor", () => {
    const rows = summarizeQuoteCrm([lead("1", { objetivo: "Moradia" }), lead("2", { objetivo: null })], new Set(["1", "2"]), new Set(["1", "2"]));
    expect(rows.find(row => row.objetivo === "Moradia")?.weight).toBe(1000);
    expect(rows.find(row => row.objetivo === "Não informado")?.weight).toBeNull();
  });
  it("não atribui pedidos orgânicos ao Google Ads nem deduz formulário antigo", () => {
    const rows = summarizeQuoteCrm([lead("1", { utm_medium: "organic" }), lead("2", { form_path: null })], new Set(), new Set(["1"]));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ variant: "sem-atribuicao", campaign: "Sem atribuição ao Google Ads", requests: 1 });
  });
});