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
