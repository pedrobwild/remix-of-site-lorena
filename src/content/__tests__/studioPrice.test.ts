import { describe, expect, it } from "vitest";
import { BASE_CUSTO, STUDIO_TABELA_VIGENTE } from "@/content/baseCusto";

describe("referência de preço de studio aprovada em 26/10/2026", () => {
  it("usa a base oficial de 585 orçamentos e suas medianas", () => {
    expect(BASE_CUSTO).toMatchObject({ orcamentos: 585, orcamentoMediano: 74132, m2Mediano: 2831 });
  });
  it("metade central entre 2499 e 3283 por m²", () => {
    expect([BASE_CUSTO.m2P25, BASE_CUSTO.m2P75]).toEqual([2499, 3283]);
  });
  it("referência vigente de 25 m² é cerca de 73 mil, não a mediana histórica", () => {
    expect(STUDIO_TABELA_VIGENTE.referencias.find((r) => r.areaM2 === 25)?.valorMil).toBe(73);
  });
  it("referência vigente de 30 m² é cerca de 85 mil", () => {
    expect(STUDIO_TABELA_VIGENTE.referencias.find((r) => r.areaM2 === 30)?.valorMil).toBe(85);
  });
  it("prazo máximo é 60 dias úteis até 30 m² sem integração da varanda", () => {
    expect(STUDIO_TABELA_VIGENTE.prazo).toEqual({ areaMaxM2: 30, diasUteisMax: 60, integracaoVaranda: false });
  });
  it("tabela vigente se refere a outubro de 2026", () => {
    expect(STUDIO_TABELA_VIGENTE.edicao).toBe("outubro de 2026");
  });
});