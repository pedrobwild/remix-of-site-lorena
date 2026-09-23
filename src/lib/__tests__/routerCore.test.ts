/**
 * Router (src/lib/useHashRoute.ts):
 *  - CORE-11: redirecionamentos legados resolvidos antes do render e em toda
 *    navegação SPA (antes: 404 renderizava primeiro e registrava falso 404).
 *  - CORE-20: chave de rota genérica (slug de qualquer rota; 404 por caminho).
 *  - CORE-16: posição de rolagem guardada no history.state.
 *  - Deep link: rola até a âncora esperando a seção montar.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  navigate,
  normalizeInitialUrl,
  normalizeLegacyPath,
  parseRoutePath,
  readSavedScroll,
  routeKeyOf,
  saveScrollPosition,
  scrollToHashTarget,
} from "../useHashRoute";

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  document.body.innerHTML = "";
});

describe("normalizeLegacyPath", () => {
  it.each([
    ["/admin", "/admin/dashboard"],
    ["/admin/", "/admin/dashboard"],
    ["/blog", "/conteudos"],
    ["/blog/", "/conteudos"],
    ["/blog/quanto-custa-reformar", "/conteudos/quanto-custa-reformar"],
    ["/blogueiro", "/blogueiro"],
    ["/admin/leads", "/admin/leads"],
    ["/portfolio", "/portfolio"],
  ])("%s → %s", (input, out) => {
    expect(normalizeLegacyPath(input)).toBe(out);
  });

  it("parsePath já devolve a rota canônica para URLs legadas (sem 404 intermediária)", () => {
    expect(parseRoutePath("/blog/meu-post")).toEqual({ name: "bewild-post", slug: "meu-post" });
    expect(parseRoutePath("/blog")).toEqual({ name: "conteudos" });
    expect(parseRoutePath("/admin")).toEqual({ name: "admin-dashboard" });
  });
});

describe("normalizeInitialUrl", () => {
  it("reescreve /blog/x?utm... com replaceState, preservando query e hash", () => {
    window.history.replaceState(null, "", "/blog/meu-post?utm_source=ig#faq");
    const before = window.history.length;
    normalizeInitialUrl();
    expect(window.location.pathname + window.location.search + window.location.hash).toBe(
      "/conteudos/meu-post?utm_source=ig#faq",
    );
    expect(window.history.length).toBe(before);
  });

  it("migra o hash-route legado #/rota", () => {
    window.history.replaceState(null, "", "/#/blog/x");
    normalizeInitialUrl();
    expect(window.location.pathname).toBe("/conteudos/x");
  });
});

describe("navigate", () => {
  it("navigate('/blog/x') vai direto para /conteudos/x", () => {
    navigate("/blog/x");
    expect(window.location.pathname).toBe("/conteudos/x");
  });

  it("replace: true não cria entrada nova no histórico", () => {
    navigate("/faq");
    const len = window.history.length;
    navigate("/portfolio", { replace: true });
    expect(window.history.length).toBe(len);
    expect(window.location.pathname).toBe("/portfolio");
  });

  it("guarda a rolagem da página que fica para trás no history.state dela", () => {
    window.history.replaceState({}, "", "/faq");
    Object.defineProperty(window, "scrollY", { value: 840, configurable: true });
    navigate("/portfolio");
    expect(readSavedScroll()).toBeNull(); // entrada nova, sem posição
    window.history.back();
    return new Promise<void>((resolve) => {
      window.addEventListener(
        "popstate",
        () => {
          expect(window.location.pathname).toBe("/faq");
          expect(readSavedScroll()).toBe(840);
          resolve();
        },
        { once: true },
      );
    });
  });
});

describe("routeKeyOf", () => {
  it("inclui o slug de qualquer rota com slug (inclusive admin-conteudos-edit)", () => {
    expect(routeKeyOf({ name: "bewild-post", slug: "a" })).toBe("bewild-post:a");
    expect(routeKeyOf({ name: "admin-conteudos-edit", slug: "b" })).toBe("admin-conteudos-edit:b");
    expect(routeKeyOf({ name: "admin-projetos-edit", slug: "c" })).toBe("admin-projetos-edit:c");
  });

  it("cada URL inexistente é uma 404 própria; âncora da home não muda a chave", () => {
    const a = routeKeyOf(parseRoutePath("/nao-existe-a"));
    const b = routeKeyOf(parseRoutePath("/nao-existe-b"));
    expect(a).not.toBe(b);
    expect(routeKeyOf({ name: "home", anchor: "faq" })).toBe(routeKeyOf({ name: "home" }));
  });
});

describe("memória de rolagem", () => {
  it("saveScrollPosition preserva o resto do history.state", () => {
    window.history.replaceState({ outro: 1 }, "", "/faq");
    Object.defineProperty(window, "scrollY", { value: 120, configurable: true });
    saveScrollPosition();
    expect(window.history.state).toMatchObject({ outro: 1 });
    expect(readSavedScroll()).toBe(120);
  });

  it("readSavedScroll ignora estado ausente ou inválido", () => {
    window.history.replaceState(null, "", "/");
    expect(readSavedScroll()).toBeNull();
    window.history.replaceState({ __bwScrollY: "x" }, "", "/");
    expect(readSavedScroll()).toBeNull();
  });
});

describe("scrollToHashTarget", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("espera a seção montar (chunk lazy) e rola até ela", () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "Date"] });
    window.history.replaceState(null, "", "/guia-do-investidor#faq");
    const cancel = scrollToHashTarget();

    const section = document.createElement("section");
    section.id = "faq";
    section.scrollIntoView = vi.fn();
    vi.advanceTimersByTime(50);
    expect(section.scrollIntoView).not.toHaveBeenCalled();

    document.body.appendChild(section);
    vi.advanceTimersByTime(50);
    expect(section.scrollIntoView).toHaveBeenCalledTimes(1);
    cancel();
  });

  it("ignora hash de rota legada (#/x) e hash vazio", () => {
    window.history.replaceState(null, "", "/#/faq");
    expect(() => scrollToHashTarget()()).not.toThrow();
    window.history.replaceState(null, "", "/faq");
    expect(() => scrollToHashTarget()()).not.toThrow();
  });
});
