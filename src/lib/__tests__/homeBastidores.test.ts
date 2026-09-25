/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HOME_BWA_HTML } from "../../pages/home-bwa-body";
import { installBastidores } from "../homeBastidores";
import { installInstagramEmbeds } from "../homeInstagram";

const BASTIDORES_CODES = [
  "DY27SVWvqoM",
  "DdKezjDRK8h",
  "DczVRdmxaoU",
  "Dcj1_8wRuta",
  "DchdJiqRhOT",
  "Ddm4dnNtNPI",
];
const DEPOIMENTOS_CODES = ["DZbjyUQNaOL", "DVyeOxXjQKI", "DQ2zDmujdso"];

type Entry = { isIntersecting: boolean; target: Element };
type Observer = { cb: (entries: Entry[]) => void; targets: Element[] };

function stubIntersectionObserver(): Observer[] {
  const observers: Observer[] = [];
  class FakeIntersectionObserver {
    private targets: Element[] = [];
    constructor(cb: (entries: Entry[]) => void) {
      observers.push({ cb, targets: this.targets });
    }
    observe(el: Element) {
      this.targets.push(el);
    }
    unobserve(el: Element) {
      const index = this.targets.indexOf(el);
      if (index >= 0) this.targets.splice(index, 1);
    }
    disconnect() {
      this.targets.length = 0;
    }
  }
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  return observers;
}

function mountHome(): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = HOME_BWA_HTML;
  document.body.appendChild(root);
  return root;
}

describe("seção Bastidores da home", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    window.localStorage.clear();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
  });

  it("mantém os 6 posts de Bastidores e os 3 depoimentos nas ordens esperadas", () => {
    const root = mountHome();
    const bastidores = root.querySelector<HTMLElement>("#bastidores");
    const depoimentos = root.querySelector<HTMLElement>("#depoimentos");

    expect(Array.from(bastidores?.querySelectorAll<HTMLElement>("[data-ig-post]") ?? []).map((post) => post.dataset.igPost)).toEqual(BASTIDORES_CODES);
    expect(Array.from(depoimentos?.querySelectorAll<HTMLElement>("[data-ig-post]") ?? []).map((post) => post.dataset.igPost)).toEqual(DEPOIMENTOS_CODES);
  });

  it("monta somente os 6 embeds de Bastidores quando esse bloco se aproxima", () => {
    window.localStorage.setItem("lal_cookie_consent", "accepted");
    const observers = stubIntersectionObserver();
    const root = mountHome();
    const cleanup = installInstagramEmbeds(root);
    const bastidores = root.querySelector<HTMLElement>("#bastidores");
    const depoimentos = root.querySelector<HTMLElement>("#depoimentos");

    expect(observers).toHaveLength(1);
    expect(observers[0].targets).toEqual([bastidores, depoimentos]);
    observers[0].cb([{ isIntersecting: true, target: bastidores as HTMLElement }]);

    const iframes = Array.from(bastidores?.querySelectorAll<HTMLIFrameElement>("iframe") ?? []);
    expect(iframes.map((iframe) => iframe.getAttribute("src"))).toEqual(
      BASTIDORES_CODES.map((code) => `https://www.instagram.com/p/${code}/embed/`),
    );
    expect(iframes.map((iframe) => iframe.title)).toEqual([
      "Bastidores Bewild no Instagram: Medição e estudo do espaço",
      "Bastidores Bewild no Instagram: A obra ganhando forma",
      "Bastidores Bewild no Instagram: Pintura, organização e limpeza",
      "Bastidores Bewild no Instagram: Instalações, ajustes e acabamentos",
      "Bastidores Bewild no Instagram: Finalizações antes da vistoria",
      "Bastidores Bewild no Instagram: Reta final com o coordenador técnico",
    ]);
    expect(depoimentos?.querySelectorAll("iframe")).toHaveLength(0);

    cleanup();
  });

  it("o cleanup de installBastidores remove os listeners", () => {
    const root = mountHome();
    const rail = root.querySelector<HTMLElement>("[data-bst-rail]");
    const next = root.querySelector<HTMLButtonElement>("[data-bst-next]");
    const scrollBy = vi.fn();
    if (rail) rail.scrollBy = scrollBy;
    const cleanup = installBastidores(root);

    next?.click();
    expect(scrollBy).toHaveBeenCalledTimes(1);
    cleanup();
    next?.click();
    expect(scrollBy).toHaveBeenCalledTimes(1);
  });
});
