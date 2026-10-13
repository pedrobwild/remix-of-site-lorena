import { describe, expect, it } from "vitest";
import { DEFAULT_POST_KEYWORDS, keywordsForPost } from "../postKeywords";
import { projectKeywords } from "../projectSeo";

describe("palavras-chave de conteúdos e projetos", () => {
  it("artigos publicados deixam de usar a lista genérica", () => {
    for (const slug of [
      "como-avaliar-studio-antes-de-comprar",
      "pedro-henrique-alves-ceo-bewild",
      "quanto-custa-reformar-apartamento-studio-ate-50-m2",
    ]) {
      expect(keywordsForPost(slug)).not.toBe(DEFAULT_POST_KEYWORDS);
    }
  });

  it("projeto leva bairro e tipo reais do cadastro", () => {
    const kw = projectKeywords({ neighborhood: "Vila Madalena", project_type: "studio" });
    expect(kw).toContain("reforma de apartamento Vila Madalena");
    expect(kw).toContain("studio reformado em SP");
  });

  it("projeto sem bairro nem tipo não inventa termos", () => {
    expect(projectKeywords({})).not.toContain("null");
    expect(projectKeywords(null)).toContain("Bewild");
  });
});
