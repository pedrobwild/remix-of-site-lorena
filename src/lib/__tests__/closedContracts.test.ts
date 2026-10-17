import { describe, expect, it } from "vitest";
import { selectClosedContracts, type ContractLead } from "@/lib/closedContracts";

const lead = (id: string, crm_won: boolean | null, location = "Pinheiros"): ContractLead => ({ id, crm_won, location, created_at: "2026-10-17T02:18:00Z", crm_stage_name: "Qualificado" });

describe("contratos fechados", () => {
  it("inclui somente pedidos explicitamente ganhos no CRM", () => {
    expect(selectClosedContracts([lead("ganho", true), lead("qualificado", false), lead("sem-confirmacao", null)]).map((row) => row.id)).toEqual(["ganho"]);
  });
  it("filtra pelo bairro sem misturar pedidos de outros bairros", () => {
    expect(selectClosedContracts([lead("p", true), lead("m", true, "Mooca")], "Mooca").map((row) => row.id)).toEqual(["m"]);
  });
});