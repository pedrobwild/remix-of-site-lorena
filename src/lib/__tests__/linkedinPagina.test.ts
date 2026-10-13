import { describe, expect, it } from "vitest";
import { ORG_SAME_AS } from "@/lib/orgJsonLd";
import { readFileSync } from "node:fs";
import { CONTACT } from "@/components/landing/content";

// Decisão do Pedro (12/10/2026): a página da empresa no LinkedIn é a
// linkedin.com/company/bwil-d (nome "Bewild", 1,9 mil seguidores). A antiga
// linkedin.com/company/bewild-reformas (38 seguidores, sem publicações) vai ser
// consolidada nela pelo suporte do LinkedIn. Rodapé e JSON-LD apontam para a
// mesma página.
const PAGINA = "https://www.linkedin.com/company/bwil-d/";

describe("página da empresa no LinkedIn", () => {
  it("o rodapé aponta para a página Bewild (bwil-d)", () => {
    expect(CONTACT.linkedin).toBe(PAGINA);
  });

  it("o JSON-LD (sameAs) aponta para a mesma página e não para a que será consolidada", () => {
    expect(ORG_SAME_AS).toContain(PAGINA);
    expect(ORG_SAME_AS.join(" ")).not.toContain("linkedin.com/company/bewild-reformas");
  });
});

describe("canal do YouTube no rodapé", () => {
  it("CONTACT e o JSON-LD apontam para o canal oficial", () => {
    expect(CONTACT.youtube).toBe("https://www.youtube.com/@bewild.oficial");
    expect(ORG_SAME_AS).toContain(CONTACT.youtube);
  });

  it("o rodapé mostra Instagram, LinkedIn e YouTube nessa ordem", () => {
    const src = readFileSync("src/components/BwaFooter.tsx", "utf8");
    const i = src.indexOf(">Instagram<");
    const l = src.indexOf(">LinkedIn<");
    const y = src.indexOf(">YouTube<");
    expect(i).toBeGreaterThan(0);
    expect(l).toBeGreaterThan(i);
    expect(y).toBeGreaterThan(l);
    expect(src).toContain("CONTACT.youtube");
  });
});
