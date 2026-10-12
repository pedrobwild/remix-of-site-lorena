import { describe, expect, it } from "vitest";
import { ORG_SAME_AS } from "@/lib/orgJsonLd";
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
