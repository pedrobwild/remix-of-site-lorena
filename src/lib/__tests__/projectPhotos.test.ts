import { describe, it, expect } from "vitest";
import { hasReadyPhotos, photoKind, photoKindLabel, readyPhotos, renderPhotos } from "../projectPhotos";
import { applyPortfolioFilter, PORTFOLIO_FILTERS } from "../portfolioFilter";

describe("projectPhotos", () => {
  it("projeto sem fotos da obra é Projeto 3D", () => {
    expect(photoKind({ gallery_urls: ["a.jpg"], ready_gallery_urls: [] })).toBe("projeto_3d");
    expect(photoKindLabel({ gallery_urls: ["a.jpg"] })).toBe("Projeto 3D");
    expect(photoKindLabel(null)).toBe("Projeto 3D");
    expect(hasReadyPhotos({ ready_gallery_urls: null })).toBe(false);
  });

  it("projeto com ao menos uma foto da obra é Obra pronta, mesmo tendo renders", () => {
    const p = { gallery_urls: ["r1.jpg", "r2.jpg"], ready_gallery_urls: ["o1.jpg"] };
    expect(photoKind(p)).toBe("obra_pronta");
    expect(photoKindLabel(p)).toBe("Obra pronta");
    expect(renderPhotos(p)).toEqual(["r1.jpg", "r2.jpg"]);
    expect(readyPhotos(p)).toEqual(["o1.jpg"]);
  });

  it("ignora entradas vazias nas galerias", () => {
    expect(readyPhotos({ ready_gallery_urls: ["", "  "] })).toEqual([]);
    expect(hasReadyPhotos({ ready_gallery_urls: ["", "x.jpg"] })).toBe(true);
    expect(renderPhotos({ gallery_urls: ["", "y.jpg"] })).toEqual(["y.jpg"]);
  });
});

describe("applyPortfolioFilter", () => {
  const list = [
    { id: "a", project_type: "turn_key" as const, ready_gallery_urls: ["o.jpg"] },
    { id: "b", project_type: "turn_key" as const, ready_gallery_urls: [] },
    { id: "c", project_type: null, ready_gallery_urls: ["o2.jpg"] },
  ];

  it("'all' devolve tudo; 'obra_pronta' só quem tem foto da obra; tipo continua funcionando", () => {
    expect(applyPortfolioFilter(list, "all").map((p) => p.id)).toEqual(["a", "b", "c"]);
    expect(applyPortfolioFilter(list, "obra_pronta").map((p) => p.id)).toEqual(["a", "c"]);
    expect(applyPortfolioFilter(list, "turn_key").map((p) => p.id)).toEqual(["a", "b"]);
    expect(applyPortfolioFilter(list, "planta")).toEqual([]);
  });

  it("chip Obra pronta existe e vem logo depois de Todos", () => {
    expect(PORTFOLIO_FILTERS[0].value).toBe("all");
    expect(PORTFOLIO_FILTERS[1]).toEqual({ value: "obra_pronta", label: "Obra pronta" });
  });
});
