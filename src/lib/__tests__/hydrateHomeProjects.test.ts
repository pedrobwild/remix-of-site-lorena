/**
 * hydrateHomeProjects — vitrine "Projetos" da home.
 *
 * Desktop: loop infinito (lista duplicada com aria-hidden). Celular (até
 * 820 px): carrossel manual com encaixe, sem duplicata, com barra de posição
 * (um botão de 44 px por projeto, `aria-current` no ativo) — relatório
 * mobile de 27/10/2026, prioridade 3.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const rpcMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: (...args: unknown[]) => rpcMock(...args) },
}));

import { hydrateHomeProjects } from "@/lib/hydrateHomeProjects";

const PROJETOS = Array.from({ length: 4 }, (_, i) => ({
  slug: `studio-${i + 1}`,
  title: `Studio ${i + 1}`,
  cover_url: `https://cdn.exemplo.com/capa-${i + 1}.png`,
  project_type: "short_stay",
  neighborhood: "Pinheiros",
  location: null,
  area_m2: 28.21,
  duration: null,
  views: 10 - i,
}));

function mountGrid() {
  document.body.innerHTML = `
    <section class="bwa-projects">
      <div class="bwa-shell bwa-pgrid" aria-label="Projetos selecionados">
        <article class="bwa-pgrid-card"><a href="/portfolio">A</a></article>
        <article class="bwa-pgrid-card"><a href="/portfolio">B</a></article>
        <article class="bwa-pgrid-card"><a href="/portfolio">C</a></article>
      </div>
      <div class="bwa-shell bwa-projects-foot"></div>
    </section>`;
  return document.querySelector<HTMLElement>(".bwa-pgrid")!;
}

function setViewport(mobile: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === "(max-width: 820px)" ? mobile : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

beforeEach(() => {
  rpcMock.mockReset();
  rpcMock.mockResolvedValue({ data: PROJETOS, error: null });
  localStorage.clear();
  window.requestAnimationFrame = (cb: FrameRequestCallback) => {
    cb(0);
    return 1;
  };
});

describe("hydrateHomeProjects", () => {
  it("desktop: loop infinito com a lista duplicada (duplicatas fora da ordem de foco)", async () => {
    setViewport(false);
    const grid = mountGrid();
    await hydrateHomeProjects();
    expect(grid.classList.contains("bwa-pslider")).toBe(true);
    expect(grid.classList.contains("bwa-pslider--manual")).toBe(false);
    expect(grid.querySelectorAll(".bwa-pgrid-card")).toHaveLength(8);
    expect(grid.querySelectorAll('.bwa-pgrid-card[aria-hidden="true"] a[tabindex="-1"]')).toHaveLength(4);
    expect(document.querySelector(".bwa-pslider-nav")).toBeNull();
  });

  it("celular: carrossel manual sem duplicata, com barra de posição acessível", async () => {
    setViewport(true);
    const grid = mountGrid();
    await hydrateHomeProjects();
    expect(grid.classList.contains("bwa-pslider--manual")).toBe(true);
    expect(grid.getAttribute("aria-roledescription")).toBe("carrossel");
    expect(grid.querySelectorAll(".bwa-pgrid-card")).toHaveLength(4);
    expect(grid.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0);
    // A metragem real sai com vírgula, como no resto do site.
    expect(grid.textContent).toContain("28,21 m²");

    const nav = grid.nextElementSibling as HTMLElement;
    expect(nav.classList.contains("bwa-pslider-nav")).toBe(true);
    expect(nav.getAttribute("role")).toBe("group");
    const dots = Array.from(nav.querySelectorAll<HTMLButtonElement>("button"));
    expect(dots).toHaveLength(4);
    expect(dots[0].getAttribute("aria-current")).toBe("true");
    expect(dots[1].textContent).toBe("Projeto 2 de 4");
    expect(dots.every((d) => d.type === "button")).toBe(true);

    // Clicar num ponto leva ao card correspondente e marca a posição.
    grid.scrollTo = vi.fn();
    dots[2].click();
    expect(grid.scrollTo).toHaveBeenCalled();
    expect(dots[2].getAttribute("aria-current")).toBe("true");
    expect(dots[0].hasAttribute("aria-current")).toBe(false);
  });

  it("celular: rodar duas vezes (StrictMode) não duplica a barra de posição", async () => {
    setViewport(true);
    mountGrid();
    await hydrateHomeProjects();
    await hydrateHomeProjects();
    expect(document.querySelectorAll(".bwa-pslider-nav")).toHaveLength(1);
    expect(document.querySelectorAll(".bwa-pgrid-card")).toHaveLength(4);
  });

  it("com menos de 3 projetos, os cards estáticos ficam como estão", async () => {
    setViewport(true);
    rpcMock.mockResolvedValue({ data: PROJETOS.slice(0, 2), error: null });
    const grid = mountGrid();
    await hydrateHomeProjects();
    expect(grid.classList.contains("bwa-pslider")).toBe(false);
    expect(grid.querySelectorAll(".bwa-pgrid-card")).toHaveLength(3);
  });
});
