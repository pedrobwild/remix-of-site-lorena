/**
 * index.html — o que roda antes do bundle.
 *
 *  - Fontes: uma folha só no <head>, com as duas famílias da home e das
 *    internas (Manrope e JetBrains Mono). Nada de Manrope itálica (não existe
 *    no Google Fonts) nem das famílias que agora entram por src/lib/fonts.ts.
 *  - Preload do hero: criado só em "/", só para telas ≥ 901 px e com
 *    fetchpriority="high" (no celular o LCP é o título).
 *  - Splash: não aparece em visita de anúncio (fbclid/gclid/utm_*…), some no
 *    máximo em 400 ms e só na primeira carga da sessão.
 *
 * Os scripts inline são extraídos do arquivo e executados no jsdom.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const HTML = readFileSync(resolve(process.cwd(), "index.html"), "utf8");

/** Scripts inline (sem src e fora do JSON-LD), na ordem do arquivo. */
function inlineScripts(): string[] {
  const out: string[] = [];
  const re = /<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(HTML))) out.push(m[1]);
  return out;
}
function scriptWith(marker: string): string {
  const found = inlineScripts().filter((s) => s.includes(marker));
  expect(found, `script inline com "${marker}"`).toHaveLength(1);
  return found[0];
}
function run(code: string) {
  new Function(code)();
}

type SplashWindow = Window & { __bwSplashDone?: () => void };

describe("index.html — fontes", () => {
  it("uma folha do Google Fonts no <head>, só com Manrope e JetBrains Mono", () => {
    const links = HTML.match(/<link[^>]*href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]*"[^>]*>/g) ?? [];
    expect(links).toHaveLength(1);
    const href = links[0].match(/href="([^"]+)"/)![1];
    expect(href).toContain("family=Manrope:wght@");
    expect(href).toContain("family=JetBrains+Mono:wght@");
    expect(href).toContain("display=swap");
    expect(href).not.toMatch(/Playfair|Poppins|Inter|Sora/);
    // Manrope não tem itálico no Google Fonts (pedida sozinha com `ital`, a
    // URL volta 400).
    expect(href).not.toMatch(/Manrope:ital/);
  });
});

describe("index.html — preload do hero", () => {
  const code = scriptWith("hero-cozinha");

  afterEach(() => {
    document.head.querySelectorAll('link[rel="preload"][as="image"]').forEach((n) => n.remove());
    window.history.replaceState(null, "", "/");
  });

  it('na home: preload de imagem com fetchpriority="high", só para telas largas', () => {
    window.history.replaceState(null, "", "/?fbclid=abc");
    run(code);
    const link = document.head.querySelector<HTMLLinkElement>('link[rel="preload"][as="image"]');
    expect(link).not.toBeNull();
    expect(link!.getAttribute("href")).toMatch(/\/hero-cozinha\.jpg$/);
    expect(link!.getAttribute("fetchpriority")).toBe("high");
    expect(link!.getAttribute("media")).toBe("(min-width: 901px)");
  });

  it("fora da home não cria nada", () => {
    window.history.replaceState(null, "", "/portfolio");
    run(code);
    expect(document.head.querySelector('link[rel="preload"][as="image"]')).toBeNull();
  });
});

describe("index.html — splash", () => {
  const code = scriptWith("bw-splash");

  function mountSplash() {
    document.body.innerHTML =
      '<div id="bw-splash"><div class="bw-track"><i class="bw-fill"></i></div></div>';
  }
  const splash = () => document.getElementById("bw-splash");

  beforeEach(() => {
    vi.useFakeTimers();
    window.sessionStorage.clear();
    delete (window as SplashWindow).__bwSplashDone;
    mountSplash();
  });
  afterEach(() => {
    vi.useRealTimers();
    window.sessionStorage.clear();
    document.body.innerHTML = "";
    window.history.replaceState(null, "", "/");
    delete (window as SplashWindow).__bwSplashDone;
  });

  it.each([
    "/?fbclid=IwAR0abc",
    "/?utm_source=meta&utm_medium=paid_social",
    "/?gclid=Cj0KCQ",
    "/?gbraid=0AAAA",
    "/portfolio?utm_campaign=studio",
  ])("visita de anúncio (%s): sem splash", (url) => {
    window.history.replaceState(null, "", url);
    run(code);
    expect(splash()).toBeNull();
    expect((window as SplashWindow).__bwSplashDone).toBeUndefined();
  });

  it("visita comum: some em no máximo 400 ms (mais o fade de 320 ms)", () => {
    window.history.replaceState(null, "", "/?ref=indicacao");
    run(code);
    expect(splash()).not.toBeNull();
    expect(typeof (window as SplashWindow).__bwSplashDone).toBe("function");

    vi.advanceTimersByTime(399);
    expect(splash()!.classList.contains("is-done")).toBe(false);
    vi.advanceTimersByTime(1); // trava de 400 ms → finish()
    vi.advanceTimersByTime(1); // sem tempo mínimo: fecha no tick seguinte
    expect(splash()!.classList.contains("is-done")).toBe(true);
    vi.advanceTimersByTime(320);
    expect(splash()).toBeNull();
  });

  it("o primeiro commit do React fecha antes da trava", () => {
    run(code);
    vi.advanceTimersByTime(50);
    (window as SplashWindow).__bwSplashDone!();
    vi.advanceTimersByTime(0);
    expect(splash()!.classList.contains("is-done")).toBe(true);
    vi.advanceTimersByTime(320);
    expect(splash()).toBeNull();
  });

  it("segunda carga na mesma sessão: sem splash", () => {
    window.sessionStorage.setItem("bw-splash", "1");
    run(code);
    expect(splash()).toBeNull();
  });
});