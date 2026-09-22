import { describe, it, expect } from "vitest";
import { CATALOG_ROOMS, catalogRoomUrl, catalogThumbnailUrl, parseCatalogItems } from "../homeCatalog";
import { INSTAGRAM_TESTIMONIAL_POSTS, instagramPostRef, parseInstagramMeasure } from "../homeInstagram";

describe("homeCatalog", () => {
  it("miniatura usa a transformação de imagem do Storage e mantém URLs externas", () => {
    const u = "https://x.supabase.co/storage/v1/object/public/catalog/sala/item.jpg";
    expect(catalogThumbnailUrl(u)).toBe(
      "https://x.supabase.co/storage/v1/render/image/public/catalog/sala/item.jpg?width=800&height=600&resize=cover&quality=75",
    );
    expect(catalogThumbnailUrl("https://cdn.example.com/a.jpg")).toBe("https://cdn.example.com/a.jpg");
  });

  it("descarta linhas sem id ou sem imagem e normaliza a legenda", () => {
    const items = parseCatalogItems([
      { id: 1, image_url: " https://a/1.jpg ", caption: "  Cozinha  " },
      { id: "2", image_url: "", caption: null },
      { image_url: "https://a/3.jpg" },
      null,
    ]);
    expect(items).toEqual([{ id: "1", image_url: "https://a/1.jpg", caption: "Cozinha" }]);
    expect(parseCatalogItems("nada")).toEqual([]);
  });

  it("cômodos do catálogo e link por cômodo", () => {
    expect(CATALOG_ROOMS.map((r) => r.slug)).toEqual(["sala", "cozinha", "dormitorio", "banheiros", "armarios-abertos"]);
    expect(catalogRoomUrl("cozinha")).toBe("https://catalogobewild.com/modulos/cozinha");
  });
});

describe("homeInstagram", () => {
  it("são as 3 postagens do orçamento público, com URL canônica e de embed", () => {
    expect(INSTAGRAM_TESTIMONIAL_POSTS).toEqual(["DZbjyUQNaOL", "DVyeOxXjQKI", "DQ2zDmujdso"]);
    expect(instagramPostRef("DQ2zDmujdso")).toEqual({
      kind: "p",
      code: "DQ2zDmujdso",
      url: "https://www.instagram.com/p/DQ2zDmujdso/",
      embedUrl: "https://www.instagram.com/p/DQ2zDmujdso/embed/",
    });
    expect(instagramPostRef("abc/../x")).toBeNull();
  });

  it("lê a altura da mensagem MEASURE (objeto ou JSON) e ignora o resto", () => {
    expect(parseInstagramMeasure({ type: "MEASURE", details: { height: 812.4 } })).toBe(813);
    expect(parseInstagramMeasure(JSON.stringify({ type: "MEASURE", details: { height: 700 } }))).toBe(700);
    expect(parseInstagramMeasure({ type: "LOADING" })).toBeNull();
    expect(parseInstagramMeasure("{nope")).toBeNull();
  });
});
