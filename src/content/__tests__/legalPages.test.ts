import { describe, expect, it } from "vitest";
import { LEGAL_PAGES, LEGAL_SLUGS, mergeLegalPage } from "@/content/pages/legal";

describe("páginas legais (privacidade e termos de uso)", () => {
  it("tem as duas páginas com caminhos públicos", () => {
    expect(LEGAL_SLUGS).toEqual(["privacidade", "termos-de-uso"]);
    expect(LEGAL_PAGES.privacidade.path).toBe("/privacidade");
    expect(LEGAL_PAGES["termos-de-uso"].path).toBe("/termos-de-uso");
  });

  it("cada página tem título, abertura, corpo e SEO preenchidos", () => {
    for (const slug of LEGAL_SLUGS) {
      const p = LEGAL_PAGES[slug];
      expect(p.title.trim().length).toBeGreaterThan(0);
      expect(p.intro.trim().length).toBeGreaterThan(0);
      expect(p.body.trim().length).toBeGreaterThan(200);
      expect(p.seo.title).toContain("Bewild");
      expect(p.seo.description.trim().length).toBeGreaterThan(0);
    }
  });

  it("usa o texto padrão quando o banco está vazio", () => {
    const m = mergeLegalPage("termos-de-uso", null);
    expect(m.title).toBe(LEGAL_PAGES["termos-de-uso"].title);
    expect(m.body).toBe(LEGAL_PAGES["termos-de-uso"].body);
  });

  it("o texto do banco prevalece sobre o padrão", () => {
    const m = mergeLegalPage("privacidade", { title: "Título novo", intro: "Abertura nova", body: "Corpo novo" });
    expect(m.title).toBe("Título novo");
    expect(m.intro).toBe("Abertura nova");
    expect(m.body).toBe("Corpo novo");
  });

  it("campo em branco no banco volta ao padrão", () => {
    const m = mergeLegalPage("privacidade", { title: "   ", intro: "", body: null });
    expect(m.title).toBe(LEGAL_PAGES.privacidade.title);
    expect(m.intro).toBe(LEGAL_PAGES.privacidade.intro);
    expect(m.body).toBe(LEGAL_PAGES.privacidade.body);
  });

  it("a privacidade cita a LGPD e os termos citam a política de privacidade", () => {
    expect(LEGAL_PAGES.privacidade.body).toContain("LGPD");
    expect(LEGAL_PAGES["termos-de-uso"].body).toContain("/privacidade");
  });
});
