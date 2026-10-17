import { describe, expect, it, vi } from "vitest";
import { readCrmContracts } from "@/lib/crmContracts.server";

const leadId = "11111111-1111-4111-8111-111111111111";
const budgetId = "22222222-2222-4222-8222-222222222222";
const groupId = "33333333-3333-4333-8333-333333333333";
const row = { lead_id: leadId, budget_id: budgetId, version_group_id: groupId, total: 63500.25, closed_at: "2026-10-16T15:00:00Z", neighborhood: "Pinheiros" };
const response = (body: unknown) => new Response(JSON.stringify(body));

describe("leitura dos contratos protegidos", () => {
  it("mantém o valor canônico e closed_at enviados pelo CRM", async () => {
    const fetcher = vi.fn().mockResolvedValue(response({ contracts: [row], next_cursor: null }));
    expect(await readCrmContracts("teste", [leadId], fetcher)).toEqual([row]);
    expect(JSON.parse(fetcher.mock.calls[0]?.[1].body)).toEqual({ mode: "contracts", lead_ids: [leadId], cursor: null });
  });
  it("pagina sem perder contratos do mesmo lead", async () => {
    const second = { ...row, budget_id: groupId, version_group_id: budgetId, total: 0, closed_at: null };
    const fetcher = vi.fn().mockResolvedValueOnce(response({ contracts: [row], next_cursor: budgetId })).mockResolvedValueOnce(response({ contracts: [second], next_cursor: null }));
    expect(await readCrmContracts("teste", [leadId], fetcher)).toEqual([row, second]);
  });
  it("a resposta antiga não é tratada como zero contratos", async () => {
    await expect(readCrmContracts("teste", [leadId], vi.fn().mockResolvedValue(response({ leads: [], stages: [] })))).rejects.toThrow("crm_contracts_unavailable");
  });
  it("rejeita contrato sem vínculo com o pedido solicitado", async () => {
    await expect(readCrmContracts("teste", [leadId], vi.fn().mockResolvedValue(response({ contracts: [{ ...row, lead_id: groupId }], next_cursor: null })))).rejects.toThrow("crm_contracts_invalid_lead");
  });
  it("rejeita versões duplicadas do mesmo negócio", async () => {
    await expect(readCrmContracts("teste", [leadId], vi.fn().mockResolvedValue(response({ contracts: [row, row], next_cursor: null })))).rejects.toThrow("crm_contracts_duplicate_deal");
  });
  it("interrompe cursores repetidos", async () => {
    await expect(readCrmContracts("teste", [leadId], vi.fn().mockImplementation(async () => response({ contracts: [], next_cursor: budgetId })))).rejects.toThrow("crm_contracts_invalid_cursor");
  });
});