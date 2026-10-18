import { describe, expect, it } from "vitest";
import { awaitingContractRows, signedContractRows } from "@/lib/openContracts";
import type { CrmLeadItem } from "@/lib/crmStage";
import type { ClosedContract } from "@/lib/closedContracts";
const lead = { id: "lead", name: "Cliente", location: "Brás" };
const stage: CrmLeadItem = { lead_id: "lead", current_stage_key: "negociacao", current_stage_name: "Negociação", current_stage_position: 1, max_stage_key: "negociacao", max_stage_position: 1, won: false, all_closed_lost: false, deal_count: 1, last_change_at: "2026-10-18T15:00:00Z" };
const contract: ClosedContract = { id: "deal", lead_id: "lead", location: "Brás", created_at: "2026-10-01T00:00:00Z", crm_won: true, crm_stage_name: "Contrato fechado", budget_id: "budget", total: 71850, closed_at: "2026-10-18T15:00:00Z" };
describe("contratos em aberto", () => {
  it("negociação não inventa valor nem assinatura", () => {
    expect(awaitingContractRows([lead], [stage], {})[0]).toMatchObject({ total: null, signedAt: null, valueType: "proposta" });
  });
  it("mostra valor real de proposta sem usá-lo como contrato", () => {
    expect(awaitingContractRows([lead], [stage], { lead: [{ public_id: "p", url: "https://example.com/p", total: 63500, generated_at: "2026-10-18T15:00:00Z", prazo_dias_uteis: 60, version_number: 1 }] })[0]).toMatchObject({ total: 63500, signedAt: null, valueType: "proposta" });
  });
  it("exclui ganhos e perdidos da espera", () => {
    expect(awaitingContractRows([lead], [{ ...stage, won: true }], {})).toEqual([]);
    expect(awaitingContractRows([lead], [{ ...stage, all_closed_lost: true }], {})).toEqual([]);
  });
  it("preserva valor e assinatura reais sem inferir andamento", () => {
    expect(signedContractRows([lead], [contract])[0]).toMatchObject({ total: 71850, signedAt: "2026-10-18T15:00:00Z", progress: "Não informado pelo CRM" });
  });
  it("contrato sem data não é tratado como assinado", () => {
    expect(signedContractRows([lead], [{ ...contract, closed_at: null }])).toEqual([]);
  });
  it("mantém negócios distintos e rejeita duplicatas e leads externos", () => {
    expect(signedContractRows([lead], [contract, contract, { ...contract, id: "other" }, { ...contract, id: "external", lead_id: "x" }])).toHaveLength(2);
  });
});