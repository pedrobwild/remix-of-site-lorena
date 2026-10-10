import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installSectionSpy } from "@/lib/sectionSpy";

/** Posição (px) do topo de cada bloco em relação à janela, trocada por teste. */
const tops: Record<string, number> = {};

function mount() {
  document.body.innerHTML = `
    <main>
      <nav class="bwa-svcs-nav"><ul>
        <li><a href="#a">A</a></li>
        <li><a href="#b">B</a></li>
        <li><a href="#c">C</a></li>
        <li><a href="#nao-existe">X</a></li>
      </ul></nav>
      <section id="a"></section>
      <section id="b"></section>
      <section id="c"></section>
    </main>`;
  for (const id of ["a", "b", "c"]) {
    const el = document.getElementById(id)!;
    el.getBoundingClientRect = () => ({ top: tops[id] ?? 0 }) as DOMRect;
  }
  return document.querySelector("main") as HTMLElement;
}

const current = () =>
  Array.from(document.querySelectorAll(".bwa-svcs-nav a"))
    .filter((a) => a.hasAttribute("aria-current"))
    .map((a) => a.getAttribute("href"));

describe("installSectionSpy", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // rAF assíncrono como no navegador: o quadro roda em `scroll()` abaixo.
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => window.setTimeout(() => cb(0), 16));
    vi.stubGlobal("cancelAnimationFrame", (id: number) => window.clearTimeout(id));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  const scroll = () => {
    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("scroll")); // duas rolagens, um quadro só
    vi.runAllTimers();
  };

  it("marca o último bloco cujo topo passou da linha, e nenhum antes do primeiro", () => {
    Object.assign(tops, { a: 900, b: 1800, c: 2700 });
    const root = mount();
    const cleanup = installSectionSpy(root, { links: ".bwa-svcs-nav a[href^='#']", offset: 140 });
    expect(current()).toEqual([]);

    Object.assign(tops, { a: -200, b: 700, c: 1600 });
    scroll();
    expect(current()).toEqual(["#a"]);
    expect(document.querySelector("a[href='#a']")?.getAttribute("aria-current")).toBe("location");

    Object.assign(tops, { a: -2000, b: -1100, c: 100 });
    scroll();
    expect(current()).toEqual(["#c"]);

    cleanup();
    expect(current()).toEqual([]);
    Object.assign(tops, { a: -200, b: 700, c: 1600 });
    scroll();
    expect(current()).toEqual([]);
  });

  it("ignora links sem bloco correspondente e raiz nula", () => {
    Object.assign(tops, { a: -10, b: 500, c: 900 });
    const root = mount();
    const cleanup = installSectionSpy(root, { links: ".bwa-svcs-nav a[href^='#']", offset: 140 });
    expect(document.querySelector("a[href='#nao-existe']")?.hasAttribute("aria-current")).toBe(false);
    cleanup();
    expect(() => installSectionSpy(null)()).not.toThrow();
  });
});
