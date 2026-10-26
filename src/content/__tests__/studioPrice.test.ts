import { describe, expect, it } from "vitest";
import { BASE_CUSTO, STUDIO_TABELA_VIGENTE } from "@/content/baseCusto";

describe("referência de preço de studio aprovada em 26/10/2026", () => {
  it("preserva a base histórica de 188 contratos e suas medianas", () => {
    expect(BASE_CUSTO).toMatchObject({ contratos: 188, orcamentoMediano: 71850, m2Mediano: 2744 });
  });
  it("preserva a metade central entre 2457 e 3125 por m²", () => {
    expect([BASE_CUSTO.m2P25, BASE_CUSTO.m2P75]).toEqual([2457, 3125]);
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