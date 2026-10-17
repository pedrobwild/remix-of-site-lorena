import { describe, expect, it } from "vitest";
import { mergeClosedContracts, selectClosedContracts, type ContractLead } from "@/lib/closedContracts";

const lead = (id: string, crm_won: boolean | null, location = "Pinheiros"): ContractLead => ({ id, crm_won, location, created_at: "2026-10-17T02:18:00Z", crm_stage_name: "Qualificado" });

describe("contratos fechados", () => {
  it("inclui somente pedidos explicitamente ganhos no CRM", () => {
    expect(selectClosedContracts([lead("ganho", true), lead("qualificado", false), lead("sem-confirmacao", null)]).map((row) => row.id)).toEqual(["ganho"]);
  });
  it("filtra pelo bairro sem misturar pedidos de outros bairros", () => {
    expect(selectClosedContracts([lead("p", true), lead("m", true, "Mooca")], "Mooca").map((row) => row.id)).toEqual(["m"]);
  });
  it("preserva dois contratos reais do mesmo pedido", () => {
    const rows = mergeClosedContracts([lead("p", true)], [
      { lead_id: "p", budget_id: "b1", version_group_id: "v1", total: 63500.25, closed_at: "2026-10-16T15:00:00Z", neighborhood: "Mooca" },
      { lead_id: "p", budget_id: "b2", version_group_id: "v2", total: 71000, closed_at: "2026-10-17T15:00:00Z", neighborhood: "Pinheiros" },
    ]);
    expect(rows.map((row) => [row.id, row.total, row.closed_at])).toEqual([
      ["v1", 63500.25, "2026-10-16T15:00:00Z"], ["v2", 71000, "2026-10-17T15:00:00Z"],
    ]);
    expect(selectClosedContracts(rows, "Mooca").map((row) => row.id)).toEqual(["v1"]);
  });
  it("não substitui valor ou data ausentes pela data do pedido", () => {
    const rows = mergeClosedContracts([lead("p", true)], [{ lead_id: "p", budget_id: "b", version_group_id: "v", total: null, closed_at: null, neighborhood: null }]);
    expect(rows[0]?.total).toBeNull();
    expect(rows[0]?.closed_at).toBeNull();
    expect(mergeClosedContracts([lead("p", true)], null)[0]?.closed_at).toBeNull();
  });
  it("uma exportação vazia não transforma pedidos ganhos em contratos reais", () => {
    expect(mergeClosedContracts([lead("p", true)], [])).toEqual([]);
  });
  it("não inclui contratos de pedidos fora do painel", () => {
    expect(mergeClosedContracts([lead("p", true)], [{ lead_id: "outro", budget_id: "b", version_group_id: "v", total: 1, closed_at: null, neighborhood: null }])).toEqual([]);
  });
});