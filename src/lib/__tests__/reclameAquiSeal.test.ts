/**
 * Selo do Reclame Aqui (src/lib/reclameAquiSeal.ts): o script só entra
 * quando o rodapé se aproxima da tela, uma vez só.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { mountReclameAquiSealWhenVisible, RA_SEAL_SRC } from "@/lib/reclameAquiSeal";

type IOCallback = (entries: Array<{ isIntersecting: boolean }>) => void;

let lastCallback: IOCallback | null = null;
const disconnect = vi.fn();

class FakeIO {
  constructor(cb: IOCallback) {
    lastCallback = cb;
  }
  observe() {}
  disconnect = disconnect;
}

afterEach(() => {
  vi.unstubAllGlobals();
  lastCallback = null;
  disconnect.mockClear();
  document.body.innerHTML = "";
});

describe("mountReclameAquiSealWhenVisible", () => {
  it("não pede o script antes de o rodapé ficar visível", () => {
    vi.stubGlobal("IntersectionObserver", FakeIO);
    const holder = document.createElement("div");
    document.body.appendChild(holder);
    mountReclameAquiSealWhenVisible(holder);
    expect(holder.querySelector("script")).toBeNull();

    lastCallback!([{ isIntersecting: true }]);
    const s = holder.querySelector("script");
    expect(s?.getAttribute("src")).toBe(RA_SEAL_SRC);
    expect(s?.getAttribute("data-target")).toBe("ra-verified-seal");
    expect(disconnect).toHaveBeenCalled();

    lastCallback!([{ isIntersecting: true }]);
    expect(holder.querySelectorAll("script")).toHaveLength(1);
  });

  it("a limpeza desliga o observador", () => {
    vi.stubGlobal("IntersectionObserver", FakeIO);
    const holder = document.createElement("div");
    const cleanup = mountReclameAquiSealWhenVisible(holder);
    cleanup();
    expect(disconnect).toHaveBeenCalled();
  });

  it("sem contêiner não faz nada", () => {
    expect(() => mountReclameAquiSealWhenVisible(null)()).not.toThrow();
  });
});
