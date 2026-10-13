import { describe, expect, it } from "vitest";
import {
  IDS_ITENS,
  areaValida,
  escopoParaQuery,
  lerEscopoDaQuery,
  montarEscopo,
  parseItens,
} from "@/lib/escopoCalc";

describe("escopo: faixa de investimento", () => {
  it("escopo completo de 28 m² usa R$ 2.457 / 2.744 / 3.125 por m² (base de 188 contratos)", () => {
    const r = montarEscopo({ areaM2: 28, itens: [...IDS_ITENS] });
    expect(r.completo).toBe(true);
    expect(r.faixa).toEqual({ baixo: 68796, mediano: 76832, alto: 87500 });
  });

  it("escopo parcial não publica faixa (a base não tem preço por item)", () => {
    const r = montarEscopo({ areaM2: 28, itens: ["projeto", "obra"] });
    expect(r.completo).toBe(false);
    expect(r.faixa).toBeNull();
  });

  it("metragem válida vai de 10 a 300 m²", () => {
    expect(areaValida(10)).toBe(true);
    expect(areaValida(300)).toBe(true);
    expect(areaValida(9)).toBe(false);
    expect(areaValida(301)).toBe(false);
    expect(areaValida(Number.NaN)).toBe(false);
  });
});

describe("escopo: entrega para /orcamento", () => {
  const validos = { estados: ["No contrapiso"], objetivos: ["Short stay"] };

  it("ida e volta mantém metragem, estado, objetivo e itens", () => {
    const q = escopoParaQuery({ areaM2: 28, estado: "No contrapiso", objetivo: "Short stay", itens: ["obra", "projeto"] });
    expect(lerEscopoDaQuery(`?${q}`, validos)).toEqual({
      area: 28,
      estado: "No contrapiso",
      objetivo: "Short stay",
      itens: ["projeto", "obra"],
    });
  });

  it("ignora estado, objetivo e itens que não existem", () => {
    const r = lerEscopoDaQuery("?area=abc&estado=x&objetivo=y&itens=hack,obra", validos);
    expect(r).toEqual({ area: undefined, estado: undefined, objetivo: undefined, itens: ["obra"] });
    expect(parseItens(null)).toEqual([]);
  });
});
