import { describe, expect, it } from "vitest";
import { bairroAgrupado } from "@/lib/bairroAgrupado";

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
    expect(bairroAgrupado("São Paulo- SP")).toBe("Sao Paulo");
  });
});
