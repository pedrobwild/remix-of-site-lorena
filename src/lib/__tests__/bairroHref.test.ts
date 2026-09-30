import { describe, it, expect } from "vitest";
import { bairroHref } from "../bairrosSp";

const pages = [
  { slug: "pinheiros", label: "Pinheiros" },
  { slug: "vila-olimpia", label: "Vila Olímpia" },
];

describe("bairroHref: bairros das páginas de serviço e /onde-atuamos", () => {
  it("bairro com página própria aponta para /reforma/<slug>", () => {
    expect(bairroHref("Pinheiros", pages)).toBe("/reforma/pinheiros");
    expect(bairroHref("Vila Olímpia", pages)).toBe("/reforma/vila-olimpia");
  });
  it("bairro sem página própria cai no portfólio geral", () => {
    expect(bairroHref("Liberdade", pages)).toBe("/portfolio");
  });
  it("sem dados do loader (null) todos vão para o portfólio", () => {
    expect(bairroHref("Pinheiros", null)).toBe("/portfolio");
  });
});
