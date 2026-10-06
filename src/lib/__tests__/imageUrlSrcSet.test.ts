import { describe, it, expect } from "vitest";
import {
  optimizedSrcSet,
  responsiveImage,
  projectCoverImage,
  GALLERY_WIDTHS,
  WIDE_WIDTHS,
} from "@/lib/imageUrl";

const base = "https://x.supabase.co/storage/v1/object/public/project-images/a/b.jpg";

describe("optimizedSrcSet", () => {
  it("gera 4 larguras com o endpoint de render", () => {
    const s = optimizedSrcSet(base)!;
    const parts = s.split(", ");
    expect(parts).toHaveLength(4);
    expect(parts[0]).toContain("/render/image/public/project-images/a/b.jpg?width=480&quality=70 480w");
    expect(parts[3]).toMatch(/width=1280&quality=70 1280w$/);
  });
  it("devolve undefined para URL externa ou vazia", () => {
    expect(optimizedSrcSet("https://example.com/a.jpg")).toBeUndefined();
    expect(optimizedSrcSet("")).toBeUndefined();
  });
});

describe("imagens da página do projeto", () => {
  it("responsiveImage: src redimensionado + srcSet nas larguras pedidas", () => {
    const r = responsiveImage(base, GALLERY_WIDTHS, 640);
    expect(r.src).toBe(
      "https://x.supabase.co/storage/v1/render/image/public/project-images/a/b.jpg?width=640&quality=70",
    );
    expect(r.srcSet!.split(", ")).toHaveLength(GALLERY_WIDTHS.length);
  });
  it("responsiveImage: URL externa passa intacta e sem srcSet", () => {
    expect(responsiveImage("https://example.com/a.jpg", WIDE_WIDTHS, 1280)).toEqual({
      src: "https://example.com/a.jpg",
      srcSet: undefined,
    });
  });
  it("projectCoverImage nunca devolve o original pesado", () => {
    const r = projectCoverImage(base);
    expect(r.src).not.toContain("/object/public/");
    expect(r.srcSet).toContain("2400w");
  });
});

describe("capas de /conteudos e do artigo (MOB-06)", () => {
  it("capa do bucket: src redimensionado, srcSet e sizes — nunca o original", async () => {
    const { responsiveImageProps, CONTENT_CARD_SIZES, THUMB_WIDTHS, POST_COVER_WIDTHS, POST_COVER_SIZES } = await import("@/lib/imageUrl");
    const card = responsiveImageProps(base, THUMB_WIDTHS, 640, CONTENT_CARD_SIZES);
    expect(card.src).toContain("/render/image/public/project-images/a/b.jpg?width=640&quality=70");
    expect(card.srcSet!.split(", ")).toHaveLength(THUMB_WIDTHS.length);
    expect(card.srcSet).not.toContain("/object/public/");
    expect(card.sizes).toBe(CONTENT_CARD_SIZES);

    // Capa do artigo: o src continua sendo a variante de 1200 px de sempre.
    const cover = responsiveImageProps(base, POST_COVER_WIDTHS, 1200, POST_COVER_SIZES);
    expect(cover.src).toContain("width=1200&quality=70");
    expect(cover.srcSet).toContain("width=1200&quality=70 1200w");
  });

  it("imagem fora do bucket: só o src, sem srcSet nem sizes soltos", async () => {
    const { responsiveImageProps, CONTENT_CARD_SIZES, THUMB_WIDTHS } = await import("@/lib/imageUrl");
    for (const url of [
      "https://bewild.com.br/images/blog/capa.png",
      "https://x.supabase.co/storage/v1/object/public/blog-images/a/capa-lg.jpg",
    ]) {
      expect(responsiveImageProps(url, THUMB_WIDTHS, 640, CONTENT_CARD_SIZES)).toEqual({ src: url });
    }
  });
});
