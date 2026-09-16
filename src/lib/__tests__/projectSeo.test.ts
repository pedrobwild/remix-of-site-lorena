import { describe, it, expect } from "vitest";
import { projectMetaDescription } from "../projectSeo";

const FALLBACK = "texto genérico";

describe("projectMetaDescription", () => {
  it("prioriza seo_description e depois summary quando existem", () => {
    expect(projectMetaDescription({ seo_description: "  Desc própria " }, FALLBACK)).toBe("Desc própria");
    expect(projectMetaDescription({ summary: "Resumo", neighborhood: "Pinheiros" }, FALLBACK)).toBe("Resumo");
  });

  it("monta a frase com tipo, metragem e bairro reais", () => {
    expect(
      projectMetaDescription({ project_type: "short_stay", area_m2: 22, neighborhood: "Pinheiros" }, FALLBACK),
    ).toBe(
      "Studio para short stay de 22 m² em Pinheiros, São Paulo. Projeto, obra, marcenaria e mobiliário em um único contrato pela Bewild.",
    );
  });

  it("omite o que não está preenchido (só bairro, só metragem)", () => {
    expect(projectMetaDescription({ neighborhood: "Moema" }, FALLBACK)).toBe(
      "Apartamento reformado em Moema, São Paulo. Projeto, obra, marcenaria e mobiliário em um único contrato pela Bewild.",
    );
    expect(projectMetaDescription({ area_m2: 30.4 }, FALLBACK)).toBe(
      "Apartamento reformado de 30 m². Projeto, obra, marcenaria e mobiliário em um único contrato pela Bewild.",
    );
  });

  it("volta ao fallback quando não há dado nenhum (não inventa)", () => {
    expect(projectMetaDescription({ neighborhood: "  ", area_m2: null }, FALLBACK)).toBe(FALLBACK);
    expect(projectMetaDescription(null, FALLBACK)).toBe(FALLBACK);
  });

  it("gera descrições diferentes para projetos diferentes", () => {
    const a = projectMetaDescription({ neighborhood: "Brooklin", area_m2: 25 }, FALLBACK);
    const b = projectMetaDescription({ neighborhood: "Perdizes", area_m2: 25 }, FALLBACK);
    expect(a).not.toBe(b);
  });
});
