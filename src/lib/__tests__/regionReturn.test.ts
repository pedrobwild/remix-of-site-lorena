import { describe, expect, it } from "vitest";
import { summarizeRegionReturn } from "../regionReturn";
import type { ClosedContract } from "@/lib/closedContracts";

describe("retorno por região", () => {
  it("conta contrato assinado só com status Contrato fechado, por bairro e campanha", () => {
    const out = summarizeRegionReturn([
      { bairro: "Brás", campaign: "c1", status: "Contrato fechado" },
      { bairro: "brás ", campaign: "c1", status: "Perdido" },
      { bairro: null, campaign: null, status: "CRM indisponível" },
    ]);
    expect(out[0]).toEqual({ bairro: "Brás", campaign: "c1", leads: 2, contratos: 1, semLeitura: 0 });
    expect(out[1]).toEqual({ bairro: "Não informado", campaign: "Sem campanha", leads: 1, contratos: 0, semLeitura: 1 });
  });
});

describe("summarizeRegionReturn · grafias", () => {
  it("une Brooklin e brooklin na mesma linha", () => {
    const out = summarizeRegionReturn([
      { bairro: "Brooklin", campaign: "c", status: "Perdido" },
      { bairro: "brooklin ", campaign: "c", status: "Contrato fechado" },
    ] as never);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ bairro: "Brooklin", leads: 2, contratos: 1 });
  });
});

describe("retorno regional com contratos reais", () => {
  const leads = [{ id: "lead", bairro: "Brás", campaign: "campanha", status: "Contrato fechado" }];
  const contract: ClosedContract = { id: "deal", lead_id: "lead", location: "brás", created_at: "2026-10-01T12:00:00Z", crm_won: true, crm_stage_name: "Contrato fechado", budget_id: "budget", total: 63500.25, closed_at: "2026-10-18T15:00:00Z" };
  it("soma só os valores reais e mantém a assinatura enviada", () => {
    const [row] = summarizeRegionReturn(leads, [contract]);
    expect(row).toMatchObject({ bairro: "Brás", campaign: "campanha", leads: 1, contratos: 1, valorReal: 63500.25 });
    expect(row?.assinaturas).toEqual([{ id: "deal", total: 63500.25, closed_at: "2026-10-18T15:00:00Z" }]);
  });
  it("preserva vários contratos por lead e não duplica versões", () => {
    const [row] = summarizeRegionReturn(leads, [contract, contract, { ...contract, id: "deal-2", total: 1000 }]);
    expect(row).toMatchObject({ contratos: 2, valorReal: 64500.25 });
  });
  it("mantém valor e assinatura ausentes sem usar a data do pedido", () => {
    const [row] = summarizeRegionReturn(leads, [{ ...contract, total: null, closed_at: null }]);
    expect(row?.semValor).toBe(1);
    expect(row?.assinaturas?.[0]).toEqual({ id: "deal", total: null, closed_at: null });
  });
  it("exportação indisponível não inventa receita", () => {
    const [row] = summarizeRegionReturn(leads, null);
    expect(row?.contratos).toBe(1);
    expect(row?.valorReal).toBeUndefined();
  });
  it("exportação vazia não converte status em contratos detalhados", () => {
    expect(summarizeRegionReturn(leads, [])[0]?.contratos).toBe(0);
  });
  it("usa bairro do contrato e campanha do lead, rejeitando leads externos", () => {
    const rows = summarizeRegionReturn(leads, [{ ...contract, location: "Mooca" }, { ...contract, id: "other", lead_id: "external", total: 999 }]);
    expect(rows.find(r => r.bairro === "Mooca")).toMatchObject({ campaign: "campanha", contratos: 1, valorReal: 63500.25 });
    expect(rows.reduce((sum, r) => sum + r.contratos, 0)).toBe(1);
  });
});
