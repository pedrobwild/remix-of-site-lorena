/**
 * O estudo de 188 contratos fechados (out/2026) deixou de ser a base oficial
 * do Índice em 16/11/2026, mas fica guardado: estes números não mudam.
 */
import { describe, expect, it } from "vitest";
import { BASE_CUSTO } from "@/content/baseCusto";
import { ESTUDO_CONTRATOS_2026 as E } from "@/content/estudoContratos2026";
import { CONTRATOS_ANALISADOS, ORCAMENTOS_ANALISADOS } from "@/content/provas";

describe("estudo de 188 contratos (histórico)", () => {
  it("preserva os números de cabeçalho", () => {
    expect(CONTRATOS_ANALISADOS).toBe(188);
    expect(E).toMatchObject({
      contratos: 188,
      m2P25: 2457,
      m2Mediano: 2744,
      m2P75: 3125,
      orcamentoMediano: 71850,
      orcamentoMedio: 80054,
      areaMediana: 27.5,
      orcamentoMinimo: 55000,
    });
  });

  it("fecha as contas: exclusões, faixas e distribuição", () => {
    expect(E.registrosIniciais - E.exclusoes.reduce((s, e) => s + e.n, 0)).toBe(E.contratos);
    expect(E.faixasMetragem.reduce((s, f) => s + f.contratos, 0)).toBe(E.contratos);
    expect(E.faixasValor.reduce((s, f) => s + f.pct, 0)).toBe(100);
  });

  it("não é a base que o site publica como custo", () => {
    expect(BASE_CUSTO.orcamentos).toBe(ORCAMENTOS_ANALISADOS);
    expect(BASE_CUSTO.m2Mediano).not.toBe(E.m2Mediano);
  });
});
