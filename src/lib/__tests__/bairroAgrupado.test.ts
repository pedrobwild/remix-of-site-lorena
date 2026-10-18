import { describe, expect, it } from "vitest";
import { bairroAgrupado, criarAgrupadorBairros } from "@/lib/bairroAgrupado";

describe("bairroAgrupado", () => {
  it("une maiúsculas, acentos e espaços do mesmo bairro", () => {
    expect(bairroAgrupado("consolação")).toBe("Consolação");
    expect(bairroAgrupado("CONSOLACAO ")).toBe("Consolação");
    expect(bairroAgrupado("lapa")).toBe(bairroAgrupado("Lapa - SP"));
  });
  it("não une bairros diferentes", () => {
    expect(bairroAgrupado("Vila Mariana")).not.toBe(bairroAgrupado("Vila Madalena"));
  });
  it("vazio continua sem bairro", () => {
    expect(bairroAgrupado("  ")).toBeNull();
    expect(bairroAgrupado("São Paulo- SP")).toBe("São Paulo");
  });
  it("mantém acentos de bairro fora do catálogo", () => {
    const agrupar = criarAgrupadorBairros(["bras", "Brás", "capão redondo"]);
    expect(agrupar("bras")).toBe("Brás");
    expect(agrupar("CAPAO REDONDO")).toBe("Capão Redondo");
  });
  it("e-mail ou telefone não vira bairro", () => {
    expect(bairroAgrupado("fulano@gmail.com")).toBeNull();
    expect(bairroAgrupado("(11) 99999-0000")).toBeNull();
  });
});
