/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  TOUR3D_IFRAME_ALLOW,
  TOUR3D_INLINE_QUERY,
  TOUR3D_ROOMS,
  TOUR3D_STAGGER_MS,
  enscapeViewUrl,
  installTour3d,
} from "../homeTour3d";
import { setConsent } from "../cookieConsent";
import { HOME_BWA_HTML } from "@/pages/home-bwa-body";

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
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  return observers;
}

/** Desktop com mouse (tours dentro dos cards) ou toque/tela estreita (<dialog>). */
function stubPointer(desktop: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: desktop && query === TOUR3D_INLINE_QUERY,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
}

/** O bloco real da home, recortado do HTML aprovado (home-bwa-body.ts). */
function tourBlockHtml(): string {
  const doc = new DOMParser().parseFromString(HOME_BWA_HTML, "text/html");
  const block = doc.querySelector("[data-tour3d]");
  if (!block) throw new Error("bloco #tour-3d não encontrado no HTML da home");
  return block.outerHTML;
}

function mountHome(): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = tourBlockHtml();
  document.body.appendChild(root);
  return root;
}

const frames = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>("[data-tour3d-frame]"));
const srcs = (root: HTMLElement) =>
  frames(root).map((f) => f.querySelector("iframe")?.getAttribute("src") ?? null);
const states = (root: HTMLElement) =>
  frames(root).map(
    (f) => `${f.dataset.tour3dState ?? "-"}${f.hasAttribute("data-tour3d-active") ? "+ativo" : ""}`
  );
const startButtons = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLButtonElement>("[data-tour3d-start]"));
const expected = TOUR3D_ROOMS.map((r) => `https://api2.enscape3d.com/v3/view/${r.viewId}`);

describe("enscapeViewUrl", () => {
  it("monta a URL do viewer só para ids no formato UUID", () => {
    expect(enscapeViewUrl("48C6D935-B812-4E73-AC78-1FEE136D0119 ")).toBe(
      "https://api2.enscape3d.com/v3/view/48c6d935-b812-4e73-ac78-1fee136d0119"
    );
    expect(enscapeViewUrl("")).toBeNull();
    expect(enscapeViewUrl("48c6d935-b812-4e73-ac78")).toBeNull();
    expect(enscapeViewUrl("../../x?y=48c6d935-b812-4e73-ac78-1fee136d0119")).toBeNull();
    expect(enscapeViewUrl('48c6d935-b812-4e73-ac78-1fee136d0119" onload="x')).toBeNull();
  });
});

describe("HTML da home — bloco Tour 3D", () => {
  it('fica entre a galeria "Atmosferas Bewild" e os depoimentos', () => {
    const doc = new DOMParser().parseFromString(HOME_BWA_HTML, "text/html");
    const all = Array.from(doc.querySelectorAll("[data-image-gallery], #tour-3d, #depoimentos"));
    expect(all.map((el) => el.id || "galeria")).toEqual(["galeria", "tour-3d", "depoimentos"]);
  });

  it("traz os 3 cômodos na ordem, com os mesmos ids do TOUR3D_ROOMS e glifo existente", () => {
    const doc = new DOMParser().parseFromString(HOME_BWA_HTML, "text/html");
    const cards = Array.from(doc.querySelectorAll<HTMLElement>("#tour-3d [data-tour3d-view]"));
    expect(
      cards.map((c) => ({
        id: c.dataset.tour3dRoom,
        label: c.dataset.tour3dLabel,
        viewId: c.dataset.tour3dView,
      }))
    ).toEqual(TOUR3D_ROOMS.map((r) => ({ ...r })));
    for (const card of cards) {
      expect(card.querySelector("h3")?.textContent).toBe(card.dataset.tour3dLabel);
      const glyph = card.querySelector("use")?.getAttribute("href") ?? "";
      expect(doc.querySelector(`symbol${glyph}`)).not.toBeNull();
    }
  });
});

describe("installTour3d (DOM)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    window.localStorage.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("desktop com cookies aceitos: nada antes do bloco chegar perto; depois monta os 3, escalonados", () => {
    vi.useFakeTimers();
    window.localStorage.setItem("lal_cookie_consent", "accepted");
    stubPointer(true);
    const observers = stubIntersectionObserver();
    const root = mountHome();
    const cleanup = installTour3d(root);

    expect(observers).toHaveLength(1);
    expect(observers[0].targets).toEqual([root.querySelector("[data-tour3d]")]);
    expect(srcs(root)).toEqual([null, null, null]);

    observers[0].cb([{ isIntersecting: true, target: observers[0].targets[0] }]);
    expect(srcs(root)).toEqual([expected[0], null, null]);
    vi.advanceTimersByTime(TOUR3D_STAGGER_MS);
    expect(srcs(root)).toEqual([expected[0], expected[1], null]);
    vi.advanceTimersByTime(TOUR3D_STAGGER_MS);
    expect(srcs(root)).toEqual(expected);

    const iframe = root.querySelector("iframe")!;
    expect(iframe.getAttribute("allow")).toBe(TOUR3D_IFRAME_ALLOW);
    expect(iframe.hasAttribute("allowfullscreen")).toBe(true);
    expect(iframe.getAttribute("loading")).toBe("lazy");
    expect(iframe.title).toBe("Tour 3D — Cozinha / Estar");
    expect(states(root)).toEqual(["loading", "loading", "loading"]);

    iframe.dispatchEvent(new Event("load"));
    expect(states(root)).toEqual(["ready", "loading", "loading"]);

    // Clique na capa libera aquele tour (a capa some) sem duplicar o iframe.
    startButtons(root)[0].click();
    expect(states(root)[0]).toBe("ready+ativo");
    expect(root.querySelectorAll("iframe")).toHaveLength(3);
    cleanup();
  });

  it("sem aceite de cookies nada monta sozinho; o clique carrega só aquele cômodo", () => {
    stubPointer(true);
    const observers = stubIntersectionObserver();
    const root = mountHome();
    const cleanup = installTour3d(root);

    expect(observers).toHaveLength(0);
    startButtons(root)[1].click();
    expect(srcs(root)).toEqual([null, expected[1], null]);
    expect(states(root)).toEqual(["-", "loading+ativo", "-"]);
    expect(root.querySelector("iframe")!.getAttribute("loading")).toBe("eager");
    cleanup();
  });

  it("aceitar os cookies depois liga a montagem automática, uma vez só", () => {
    stubPointer(true);
    const observers = stubIntersectionObserver();
    const root = mountHome();
    const cleanup = installTour3d(root);
    expect(observers).toHaveLength(0);

    setConsent("accepted");
    setConsent("accepted");
    expect(observers).toHaveLength(1);
    cleanup();
  });

  it("no toque, mesmo com cookies aceitos, nenhum iframe entra na página; o toque abre o diálogo", async () => {
    window.localStorage.setItem("lal_cookie_consent", "accepted");
    stubPointer(false);
    const observers = stubIntersectionObserver();
    const root = mountHome();
    const cleanup = installTour3d(root);

    observers[0].cb([{ isIntersecting: true, target: observers[0].targets[0] }]);
    expect(srcs(root)).toEqual([null, null, null]);

    startButtons(root)[2].click();
    const dialog = document.querySelector<HTMLDialogElement>("dialog.bwa-tour3d-dialog")!;
    expect(dialog).not.toBeNull();
    expect(dialog.hasAttribute("open")).toBe(true);
    expect(dialog.querySelector(".bwa-tour3d-dialog-title")?.textContent).toBe("Banho");
    expect(dialog.querySelector("iframe")?.getAttribute("src")).toBe(expected[2]);
    expect(srcs(root)).toEqual([null, null, null]);

    // Fechar tira o iframe (o WebGL não fica rodando atrás da página).
    dialog.querySelector<HTMLButtonElement>("[data-tour3d-close]")!.click();
    await new Promise((r) => setTimeout(r, 0));
    expect(dialog.hasAttribute("open")).toBe(false);
    expect(dialog.querySelector("iframe")).toBeNull();

    // Esc também fecha (caminho sem <dialog> nativo, como no jsdom).
    startButtons(root)[0].click();
    expect(dialog.querySelector("iframe")?.getAttribute("src")).toBe(expected[0]);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(dialog.hasAttribute("open")).toBe(false);
    expect(dialog.querySelector("iframe")).toBeNull();

    cleanup();
    expect(document.querySelector("dialog.bwa-tour3d-dialog")).toBeNull();
  });

  it("mover o mouse para fora do card devolve a capa", () => {
    stubPointer(true);
    stubIntersectionObserver();
    const root = mountHome();
    const cleanup = installTour3d(root);
    startButtons(root)[0].click();
    frames(root)[0].dataset.tour3dState = "ready";
    expect(states(root)[0]).toBe("ready+ativo");

    const inside = new Event("pointermove", { bubbles: true }) as Event & { pointerType?: string };
    Object.defineProperty(inside, "pointerType", { value: "mouse" });
    frames(root)[0].dispatchEvent(inside);
    expect(states(root)[0]).toBe("ready+ativo");

    const outside = new Event("pointermove", { bubbles: true });
    Object.defineProperty(outside, "pointerType", { value: "mouse" });
    root.querySelector(".bwa-tour3d-lead")!.dispatchEvent(outside);
    expect(states(root)[0]).toBe("ready");
    cleanup();
  });

  it("depois da limpeza não monta mais nada", () => {
    vi.useFakeTimers();
    window.localStorage.setItem("lal_cookie_consent", "accepted");
    stubPointer(true);
    const observers = stubIntersectionObserver();
    const root = mountHome();
    const cleanup = installTour3d(root);
    observers[0].cb([{ isIntersecting: true, target: observers[0].targets[0] }]);
    cleanup();
    vi.advanceTimersByTime(TOUR3D_STAGGER_MS * 3);
    expect(srcs(root)).toEqual([expected[0], null, null]);
    startButtons(root)[2].click();
    expect(srcs(root)[2]).toBeNull();
  });

  it("sem o bloco, não faz nada e a limpeza é inofensiva", () => {
    stubIntersectionObserver();
    expect(() => installTour3d(document.createElement("div"))()).not.toThrow();
  });
});
