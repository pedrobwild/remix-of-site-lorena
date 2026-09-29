import { describe, it, expect } from "vitest";
import { projectMetaDescription, projectSeoTitle, projectSeoTitleUnique } from "../projectSeo";

const FALLBACK = "texto genérico";

describe("projectMetaDescription", () => {
  it("preserva textos personalizados e acrescenta o contexto local quando necessário", () => {
    expect(projectMetaDescription({ seo_description: "  Desc própria " }, FALLBACK)).toBe(
      "Desc própria Reforma de apartamento em São Paulo pela Bewild, com entrega do apartamento pronto para morar ou rentabilizar.",
    );
    expect(projectMetaDescription({ summary: "Reforma de apartamento em São Paulo com entrega completa." }, FALLBACK)).toBe(
      "Reforma de apartamento em São Paulo com entrega completa.",
    );
  });

  it("monta a frase com tipo, metragem e bairro reais", () => {
    expect(
      projectMetaDescription({ project_type: "short_stay", area_m2: 22, neighborhood: "Pinheiros" }, FALLBACK),
    ).toBe(
      "Apartamento pronto para short stay de 22 m² em Pinheiros, São Paulo-SP. Projeto, obra e marcenaria integrados pela Bewild.",
    );
  });

  it("omite o que não está preenchido (só bairro, só metragem)", () => {
    expect(projectMetaDescription({ neighborhood: "Moema" }, FALLBACK)).toBe(
      "Apartamento pronto após reforma completa em Moema, São Paulo-SP. Projeto, obra e marcenaria integrados pela Bewild.",
    );
    expect(projectMetaDescription({ area_m2: 30.4 }, FALLBACK)).toBe(
      "Apartamento pronto após reforma completa de 30 m². Projeto, obra e marcenaria integrados pela Bewild.",
    );
  });

  it("volta ao fallback quando não há dado nenhum (não inventa)", () => {
    expect(projectMetaDescription({ neighborhood: "  ", area_m2: null }, FALLBACK)).toBe(
      `${FALLBACK} Reforma de apartamento em São Paulo pela Bewild, com entrega do apartamento pronto para morar ou rentabilizar.`,
    );
    expect(projectMetaDescription(null, FALLBACK)).toBe(FALLBACK);
  });

  it("gera descrições diferentes para projetos diferentes", () => {
    const a = projectMetaDescription({ neighborhood: "Brooklin", area_m2: 25 }, FALLBACK);
    const b = projectMetaDescription({ neighborhood: "Perdizes", area_m2: 25 }, FALLBACK);
    expect(a).not.toBe(b);
  });
});

describe("projectSeoTitle", () => {
  it("põe reforma, metragem e bairro na frente e o nome do projeto no fim", () => {
    expect(projectSeoTitle({ title: "AB - PENÍNSULA VILA MADALENA", neighborhood: "Vila Madalena", area_m2: 23 })).toBe(
      "Reforma de apartamento de 23 m² em Vila Madalena — Península | Bewild",
    );
  });

  it("remove o código interno do negócio do nome", () => {
    const title = projectSeoTitle({ title: "SX - GO BALKON" });
    expect(title).toBe("Reforma de apartamento em São Paulo — Go Balkon | Bewild");
    expect(title).not.toContain("SX -");
  });

  it("ignora o seo_title gerado com o código e respeita o escrito à mão", () => {
    expect(projectSeoTitle({ seo_title: "Reforma de apartamento em São Paulo | Bewild" })).toBe(
      "Reforma de apartamento em São Paulo | Bewild",
    );
    expect(
      projectSeoTitle({ seo_title: "SX - GO BALKON | Reforma, São Paulo | Bewild", title: "SX - GO BALKON" }),
    ).toBe("Reforma de apartamento em São Paulo — Go Balkon | Bewild");
  });

  it("limita o tamanho sem perder a intenção de busca", () => {
    const title = projectSeoTitle({
      title: "Apartamento completo no empreendimento mais desejado da Vila Olímpia",
      neighborhood: "Vila Olímpia",
    });
    expect(title.length).toBeLessThanOrEqual(78);
    expect(title).toContain("Reforma de apartamento");
    expect(title).toContain("Vila Olímpia");
  });

  it("gera títulos diferentes para projetos diferentes no mesmo bairro", () => {
    const a = projectSeoTitle({ title: "AB - MODERN CAMPO BELO", neighborhood: "Campo Belo" });
    const b = projectSeoTitle({ title: "TB - LATITUDE CAMPO BELO", neighborhood: "Campo Belo" });
    expect(a).not.toBe(b);
  });
});

describe("fase do projeto e tamanho da descrição", () => {
  it("projeto em desenvolvimento não vira 'reforma' no título", () => {
    expect(
      projectSeoTitle({ title: "BM - URBAN FLEX", neighborhood: "Consolação", status: "em_projeto" }),
    ).toBe("Projeto de interiores de apartamento em Consolação — Urban Flex | Bewild");
  });

  it("obra em andamento aparece como tal; entregue segue como reforma", () => {
    expect(projectSeoTitle({ title: "X - ALFA", neighborhood: "Moema", status: "em_obra" })).toContain("em obra");
    expect(projectSeoTitle({ title: "X - ALFA", neighborhood: "Moema", status: "entregue" })).toContain(
      "Reforma de apartamento em Moema",
    );
  });

  it("descrição longa é cortada em até 160 caracteres, sem palavra pela metade", () => {
    const long = "Apartamento reformado em São Paulo pela Bewild. " + "palavra ".repeat(40);
    const out = projectMetaDescription({ seo_description: long }, FALLBACK);
    expect(out.length).toBeLessThanOrEqual(161);
    expect(out.endsWith("palavr")).toBe(false);
  });
});

describe("projectSeoTitleUnique (data de cadastro só onde ajuda)", () => {
  const mk = (id: string, created_at: string) => ({
    id,
    title: "ZP - ZIP",
    neighborhood: "Brooklin",
    area_m2: 25,
    created_at,
  });

  it("título único não muda", () => {
    const a = mk("a", "2026-08-25T00:51:00Z");
    const b = { ...mk("b", "2026-09-25T21:20:00Z"), title: "XX - OUTRO" };
    expect(projectSeoTitleUnique(a, [a, b])).toBe(projectSeoTitle(a));
  });

  it("repetido com datas diferentes ganha a data (fuso de São Paulo)", () => {
    const a = mk("a", "2026-08-25T00:51:00Z"); // 24/08 21:51 em SP
    const b = mk("b", "2026-09-25T21:20:00Z");
    expect(projectSeoTitleUnique(a, [a, b])).toBe(
      "Reforma de apartamento de 25 m² em Brooklin — Zip (cadastro 24/08/2026) | Bewild",
    );
    expect(projectSeoTitleUnique(b, [a, b])).toContain("(cadastro 25/09/2026)");
  });

  it("irmãs com a mesma data ficam como estão (data não ajuda)", () => {
    const a = mk("a", "2026-09-05T12:00:00Z");
    const b = mk("b", "2026-09-05T15:00:00Z");
    expect(projectSeoTitleUnique(a, [a, b])).toBe(projectSeoTitle(a));
    expect(projectSeoTitleUnique(b, [a, b])).toBe(projectSeoTitle(b));
  });

  it("sem data de cadastro mantém o título", () => {
    const a = { ...mk("a", ""), created_at: null };
    const b = mk("b", "2026-09-25T21:20:00Z");
    expect(projectSeoTitleUnique(a, [a, b])).toBe(projectSeoTitle(a));
  });
});
