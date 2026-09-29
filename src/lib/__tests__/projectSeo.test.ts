import { describe, it, expect } from "vitest";
import { projectMetaDescription, projectSeoTitle } from "../projectSeo";

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
