import { describe, it, expect } from "vitest";
import { projectMetaDescription, projectSeoTitle } from "../projectSeo";

const FALLBACK = "texto genérico";

describe("projectMetaDescription", () => {
  it("preserva textos personalizados e acrescenta o contexto local quando necessário", () => {
    expect(projectMetaDescription({ seo_description: "  Desc própria " }, FALLBACK)).toBe(
      "Desc própria Arquitetura em São Paulo-SP e projetos de reforma em São Paulo pela Bewild.",
    );
    expect(projectMetaDescription({ summary: "Arquitetura em São Paulo para uma reforma completa." }, FALLBACK)).toBe(
      "Arquitetura em São Paulo para uma reforma completa.",
    );
  });

  it("monta a frase com tipo, metragem e bairro reais", () => {
    expect(
      projectMetaDescription({ project_type: "short_stay", area_m2: 22, neighborhood: "Pinheiros" }, FALLBACK),
    ).toBe(
      "Studio para short stay de 22 m² em Pinheiros, São Paulo-SP. Arquitetura em São Paulo-SP e projetos de reforma em São Paulo pela Bewild.",
    );
  });

  it("omite o que não está preenchido (só bairro, só metragem)", () => {
    expect(projectMetaDescription({ neighborhood: "Moema" }, FALLBACK)).toBe(
      "Apartamento reformado em Moema, São Paulo-SP. Arquitetura em São Paulo-SP e projetos de reforma em São Paulo pela Bewild.",
    );
    expect(projectMetaDescription({ area_m2: 30.4 }, FALLBACK)).toBe(
      "Apartamento reformado de 30 m². Arquitetura em São Paulo-SP e projetos de reforma em São Paulo pela Bewild.",
    );
  });

  it("volta ao fallback quando não há dado nenhum (não inventa)", () => {
    expect(projectMetaDescription({ neighborhood: "  ", area_m2: null }, FALLBACK)).toBe(
      `${FALLBACK} Arquitetura em São Paulo-SP e projetos de reforma em São Paulo pela Bewild.`,
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
  it("gera título local único com o nome real do projeto", () => {
    expect(projectSeoTitle({ title: "PG Metrocasa Berrini" })).toBe(
      "PG Metrocasa Berrini | Projeto de reforma em São Paulo | Bewild",
    );
  });

  it("preserva título personalizado local e contextualiza os demais", () => {
    expect(projectSeoTitle({ seo_title: "Arquitetura em São Paulo | Bewild" })).toBe(
      "Arquitetura em São Paulo | Bewild",
    );
    expect(projectSeoTitle({ seo_title: "Apartamento compacto no Brooklin" })).toBe(
      "Apartamento compacto no Brooklin | Projeto de reforma em São Paulo | Bewild",
    );
  });
});
