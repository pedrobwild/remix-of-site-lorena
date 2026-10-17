import { describe, expect, it } from "vitest";
import { collectRequestPages, groupRequestsByNeighborhood, selectBudgetRequests, type BudgetRequest } from "@/lib/budgetRequests";

const request = (id: string, location: string | null, status: BudgetRequest["status"]): BudgetRequest => ({ id, location, status, name: null, created_at: "2026-10-17T00:00:00Z", form_path: "/orcamento", crm_stage_name: null, crm_won: null, crm_lost: null, crm_deal_count: null });

describe("pedidos do /orcamento", () => {
  it("inclui só o formulário de orçamento, independente da página de entrada", () => {
    const rows = [{ id: "pedido", form_path: "/orcamento", landing_path: "/" }, { id: "contato", form_path: "/contato", landing_path: "/orcamento" }, { id: "antigo", form_path: null, landing_path: "/orcamento" }, { id: "lp", form_path: "/o" }, { id: "diagnostico", form_path: "/diagnostico" }];
    expect(selectBudgetRequests(rows).map((row) => row.id)).toEqual(["pedido", "antigo"]);
  });
  it("soma pedidos por bairro e pelos status reais do lead", () => {
    const groups = groupRequestsByNeighborhood([request("1", " Vila Olímpia ", "novo"), request("2", "vila olimpia", "qualificado"), request("3", "Pinheiros", "contatado"), request("4", null, "descartado")]);
    expect(groups.find((group) => group.key === "vila olimpia")).toMatchObject({ total: 2, novo: 1, qualificado: 1, contatado: 0, descartado: 0 });
    expect(groups.find((group) => group.name === "Pinheiros")).toMatchObject({ total: 1, contatado: 1 });
    expect(groups.find((group) => group.name === "Não informado")).toMatchObject({ total: 1, descartado: 1 });
  });
  it("carrega todos os pedidos mesmo acima de mil linhas", async () => {
    const data = Array.from({ length: 1201 }, (_, id) => ({ id }));
    expect(await collectRequestPages(async (from, to) => ({ data: data.slice(from, to + 1), error: null }))).toHaveLength(1201);
  });
  it("não apresenta totais parciais quando uma página falha", async () => {
    await expect(collectRequestPages(async () => ({ data: null, error: { message: "Falha" } }))).rejects.toThrow("Falha");
  });
});