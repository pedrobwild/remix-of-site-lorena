/**
 * Fontes por rota (src/lib/fonts.ts): as famílias das rotas internas
 * (Playfair Display, Poppins, Inter) entram numa folha só, uma única vez, e
 * nunca pedem estilo inexistente (a Manrope não tem itálico no Google Fonts).
 */
import { afterEach, describe, expect, it } from "vitest";
import { BRAND_FONTS_HREF, ensureBrandFonts, mountFontSheetAfterLoad } from "@/lib/fonts";

afterEach(() => {
  document.head.querySelectorAll("#bw-fonts-brand").forEach((n) => n.remove());
});

describe("ensureBrandFonts", () => {
  it("injeta a folha das famílias internas uma vez só", () => {
    expect(ensureBrandFonts()).toBe(true);
    expect(ensureBrandFonts()).toBe(false);
    const links = document.head.querySelectorAll<HTMLLinkElement>("#bw-fonts-brand");
    expect(links).toHaveLength(1);
    expect(links[0].rel).toBe("stylesheet");
    expect(links[0].getAttribute("href")).toBe(BRAND_FONTS_HREF);
  });

  it("traz Playfair Display, Poppins e Inter com display=swap — e não as famílias do index.html", () => {
    expect(BRAND_FONTS_HREF).toContain("family=Playfair+Display");
    expect(BRAND_FONTS_HREF).toContain("family=Poppins");
    expect(BRAND_FONTS_HREF).toContain("family=Inter");
    expect(BRAND_FONTS_HREF).toContain("display=swap");
    expect(BRAND_FONTS_HREF).not.toMatch(/Manrope|JetBrains|Sora/);
  });

  it("sem document não faz nada", () => {
    expect(ensureBrandFonts(null)).toBe(false);
  });
});

describe("mountFontSheetAfterLoad (Inter e Montserrat da réplica, na home)", () => {
  const ID = "bw-fonts-test";
  const HREF = "https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap";
  const sheet = () => document.getElementById(ID);
  function setReadyState(state: DocumentReadyState) {
    Object.defineProperty(document, "readyState", { configurable: true, get: () => state });
  }

  afterEach(() => {
    // Volta ao getter do protótipo.
    delete (document as { readyState?: DocumentReadyState }).readyState;
    sheet()?.remove();
  });

  it("com a página ainda carregando, espera o load para pedir a folha", () => {
    setReadyState("interactive");
    const cleanup = mountFontSheetAfterLoad(ID, HREF);
    expect(sheet()).toBeNull();
    window.dispatchEvent(new Event("load"));
    expect(sheet()).not.toBeNull();
    expect(sheet()!.getAttribute("href")).toBe(HREF);
    expect((sheet() as HTMLLinkElement).rel).toBe("stylesheet");
    cleanup();
    expect(sheet()).toBeNull();
  });

  it("depois do load (navegação pela SPA), pede na hora — e uma vez só", () => {
    setReadyState("complete");
    const a = mountFontSheetAfterLoad(ID, HREF);
    const b = mountFontSheetAfterLoad(ID, HREF);
    expect(document.querySelectorAll(`#${ID}`)).toHaveLength(1);
    b();
    a();
    expect(sheet()).toBeNull();
  });

  it("sair da página antes do load cancela o pedido", () => {
    setReadyState("loading");
    const cleanup = mountFontSheetAfterLoad(ID, HREF);
    cleanup();
    window.dispatchEvent(new Event("load"));
    expect(sheet()).toBeNull();
  });
});