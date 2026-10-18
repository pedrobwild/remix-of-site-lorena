import { describe, expect, it } from "vitest";
import { formLeadRow, type FormLead } from "../formLeads";
import type { CrmLeadItem } from "../crmStage";

const lead: FormLead = { id: "lead-1", name: "Exemplo", created_at: "2026-10-18T00:53:00Z", objetivo: "Short stay", utm_campaign: "sea_investidor", utm_content: "airbnb", gclid: "clique", utm_source: "google", utm_medium: "cpc" };
const item: CrmLeadItem = { lead_id: lead.id, current_stage_key: "proposta", current_stage_name: "Proposta enviada", current_stage_position: 4, max_stage_key: "proposta", max_stage_position: 4, won: false, all_closed_lost: false, deal_count: 2, last_change_at: null };
describe("Leads do formulário", () => {
  it("preserva data, variante, origem e etapa do CRM em uma linha por lead", () => {
    expect(formLeadRow(lead, item, true)).toMatchObject({ id: "lead-1", createdAt: "2026-10-18T00:53:00Z", variant: "investidor", origin: "Google Ads", status: "Proposta enviada" });
  });
  it("não trata consulta indisponível como ausência de negócio", () => {
    expect(formLeadRow(lead, undefined, false).status).toBe("CRM indisponível");
    expect(formLeadRow(lead, undefined, true).status).toBe("Sem negócio no CRM");
  });
  it("não atribui variante de anúncio ao tráfego sem Google Ads", () => {
    expect(formLeadRow({ ...lead, gclid: null, utm_source: null, utm_medium: null }, item, true).variant).toBe("sem-atribuicao");
  });
  it("usa encerramentos reais do CRM", () => {
    expect(formLeadRow(lead, { ...item, won: true }, true).status).toBe("Contrato fechado");
    expect(formLeadRow(lead, { ...item, all_closed_lost: true }, true).status).toBe("Perdido");
  });
});
describe("perfil do imóvel", () => {
  it("repassa bairro, metragem e chaves como preenchidos e deixa vazio quando ausente", () => {
    const base = { id: "l", name: "A", created_at: "2026-10-18T00:00:00Z", utm_campaign: null, utm_content: null, objetivo: "Moradia" } as FormLead;
    expect(formLeadRow({ ...base, location: " Brás ", area_m2: 85, chaves: "Já tem" }, undefined, false)).toMatchObject({ bairro: "Brás", areaM2: 85, chaves: "Já tem", objetivo: "Moradia" });
    expect(formLeadRow(base, undefined, false)).toMatchObject({ bairro: null, areaM2: null, chaves: null });
  });
});
