import { describe, expect, it } from "vitest";
import { inputBairro, oneOf, searchBairro } from "../lightValidators";

describe("validadores leves", () => {
  it("preserva a seleção pública e descarta busca inválida", () => {
    expect(searchBairro({ bairro: "Pinheiros", extra: "x" })).toEqual({ bairro: "Pinheiros" });
    for (const bairro of [null, 12, [], "x".repeat(101)]) expect(searchBairro({ bairro })).toEqual({});
    expect(searchBairro({})).toEqual({});
  });
  it("mantém o contrato estrito de entrada do Radar e o teto de 100", () => {
    expect(inputBairro({ bairro: "  Moema  " })).toEqual({ bairro: "Moema" });
    expect(inputBairro({ bairro: "x".repeat(100) })).toEqual({ bairro: "x".repeat(100) });
    expect(inputBairro({})).toEqual({});
    expect(inputBairro({ bairro: "   " })).toEqual({ bairro: "" });
    for (const input of [null, undefined, [], { bairro: null }, { bairro: 12 }, { bairro: "x".repeat(101) }]) {
      expect(() => inputBairro(input)).toThrow();
    }
  });
  it("aceita somente páginas públicas previstas", () => {
    const parse = oneOf(["/portfolio", "/conteudos", "/servicos", "/orcamento", "/contato"] as const);
    expect(parse("/orcamento")).toBe("/orcamento");
    for (const value of ["/admin", null, {}, "/orcamento "]) expect(() => parse(value)).toThrow();
  });
});