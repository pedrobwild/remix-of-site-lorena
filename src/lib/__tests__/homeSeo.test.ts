import { describe, expect, it } from "vitest";
import { HOME_DEFAULT_DESCRIPTION, HOME_DEFAULT_TITLE, resolveHomeSeo } from "@/lib/homeSeo";

describe("resolveHomeSeo", () => {
  it("sem configuração usa o texto padrão", () => {
    expect(resolveHomeSeo(null)).toMatchObject({
      title: HOME_DEFAULT_TITLE,
      description: HOME_DEFAULT_DESCRIPTION,
    });
  });
  it("título salvo na aba Home vence o padrão; vazio ou só espaços não", () => {
    expect(resolveHomeSeo({ home_seo_title: "  Título novo  " }).title).toBe("Título novo");
    expect(resolveHomeSeo({ home_seo_title: "   " }).title).toBe(HOME_DEFAULT_TITLE);
  });
  it("aba Páginas vence a aba Home, como no cliente", () => {
    const s = resolveHomeSeo({
      home_seo_title: "Da aba Home",
      pages_seo: { "/": { title: "Da aba Páginas" } },
    });
    expect(s.title).toBe("Da aba Páginas");
  });
  it("repassa Open Graph próprio", () => {
    const s = resolveHomeSeo({ home_og_title: "OG", home_og_description: "OGD", home_og_image: "/a.jpg" });
    expect(s).toMatchObject({ ogTitle: "OG", ogDescription: "OGD", ogImage: "/a.jpg" });
  });
});
