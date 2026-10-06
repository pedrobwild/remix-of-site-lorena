import { describe, expect, it } from "vitest";
import { calcular, impostoGanhoCapital, parseNumeroBR } from "../reformaCalc";

describe("reformaCalc", () => {
  it("reproduz o gráfico de IR: compra 500 mil, venda 605.475, 45 m²", () => {
    const r = calcular({ bairro: "media-sp", areaM2: 45, precoCompra: 500_000, precoVenda: 605_475 });
    expect(Math.round(r.ir.semReforma)).toBe(10_372);
    expect(r.ir.comReforma).toBe(0);
  });

  it("mediana de meses de aluguel bate com o gráfico, qualquer metragem", () => {
    for (const area of [20, 45, 120]) {
      expect(Math.round(calcular({ bairro: "pinheiros", areaM2: area, precoCompra: 1, precoVenda: 1 }).meses.mediano)).toBe(28);
      expect(Math.round(calcular({ bairro: "moema", areaM2: area, precoCompra: 1, precoVenda: 1 }).meses.mediano)).toBe(33);
    }
  });

  it("custo = mediana × metragem", () => {
    expect(calcular({ bairro: "itaim-bibi", areaM2: 30, precoCompra: 1, precoVenda: 1 }).custo.mediano).toBe(82_740);
  });

  it("alíquotas progressivas por faixa", () => {
    expect(impostoGanhoCapital(5_000_000)).toBe(750_000);
    expect(impostoGanhoCapital(6_000_000)).toBe(750_000 + 175_000);
    expect(impostoGanhoCapital(-10)).toBe(0);
  });

  it("usa a reforma comprovada informada", () => {
    const r = calcular({ bairro: "media-sp", areaM2: 45, precoCompra: 500_000, precoVenda: 605_475, reformaComprovada: 10_000 });
    expect(r.ir.reformaUsada).toBe(10_000);
    expect(r.ir.comReforma).toBeLessThan(r.ir.semReforma);
  });

  it("parseNumeroBR", () => {
    expect(parseNumeroBR("500.000")).toBe(500000);
    expect(parseNumeroBR("R$ 1.234,56")).toBe(1234.56);
    expect(parseNumeroBR("45")).toBe(45);
    expect(parseNumeroBR("abc")).toBeNull();
    expect(parseNumeroBR("")).toBeNull();
  });
});
