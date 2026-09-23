/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INSTAGRAM_TESTIMONIAL_POSTS, installInstagramEmbeds } from "../homeInstagram";
import { setConsent } from "../cookieConsent";

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

/** Mesma estrutura da seção `#depoimentos` da home (home-bwa-body.ts). */
function mountHome(): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML =
    `<section id="depoimentos" data-instagram>` +
    INSTAGRAM_TESTIMONIAL_POSTS.map(
      (code) =>
        `<article data-ig-post="${code}" data-ig-kind="p"><div data-ig-frame>` +
        `<button type="button" data-ig-load>Carregar depoimento</button></div></article>`,
    ).join("") +
    `</section>`;
  document.body.appendChild(root);
  return root;
}

const iframes = (root: HTMLElement) => Array.from(root.querySelectorAll<HTMLIFrameElement>("[data-ig-frame] iframe"));
const states = (root: HTMLElement) => Array.from(root.querySelectorAll<HTMLElement>("[data-ig-frame]")).map((h) => h.dataset.igState ?? "-");

describe("installInstagramEmbeds (DOM)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    window.localStorage.clear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("com cookies aceitos, monta os 3 embeds quando o bloco se aproxima da tela, não card a card", () => {
    window.localStorage.setItem("lal_cookie_consent", "accepted");
    const observers = stubIntersectionObserver();
    const root = mountHome();
    const cleanup = installInstagramEmbeds(root);

    expect(observers).toHaveLength(1);
    expect(observers[0].targets).toEqual([root.querySelector("[data-instagram]")]);
    expect(iframes(root)).toHaveLength(0);

    observers[0].cb([{ isIntersecting: false, target: observers[0].targets[0] }]);
    expect(iframes(root)).toHaveLength(0);

    observers[0].cb([{ isIntersecting: true, target: observers[0].targets[0] }]);
    const mounted = iframes(root);
    expect(mounted.map((f) => f.getAttribute("src"))).toEqual(
      INSTAGRAM_TESTIMONIAL_POSTS.map((code) => `https://www.instagram.com/p/${code}/embed/`),
    );
    expect(mounted.every((f) => f.style.height === "640px" && f.getAttribute("loading") === "lazy")).toBe(true);
    expect(states(root)).toEqual(["loaded", "loaded", "loaded"]);

    // Idempotente: um segundo disparo não duplica iframes.
    observers[0].cb([{ isIntersecting: true, target: observers[0].targets[0] }]);
    expect(iframes(root)).toHaveLength(3);
    cleanup();
  });

  it("com cookies recusados não monta nada sozinho; o botão carrega só aquele card", () => {
    window.localStorage.setItem("lal_cookie_consent", "declined");
    const observers = stubIntersectionObserver();
    const root = mountHome();
    const cleanup = installInstagramEmbeds(root);

    expect(observers).toHaveLength(0);
    expect(iframes(root)).toHaveLength(0);
    expect(states(root)).toEqual(["consent", "consent", "consent"]);

    root.querySelectorAll<HTMLButtonElement>("[data-ig-load]")[1].click();
    expect(iframes(root)).toHaveLength(1);
    expect(iframes(root)[0].getAttribute("src")).toBe(`https://www.instagram.com/p/${INSTAGRAM_TESTIMONIAL_POSTS[1]}/embed/`);
    expect(states(root)).toEqual(["consent", "loaded", "consent"]);
    cleanup();
  });

  it("sem decisão de cookies (CORE-09): nada da Meta monta sozinho; o botão carrega sob demanda", () => {
    const observers = stubIntersectionObserver();
    const root = mountHome();
    const cleanup = installInstagramEmbeds(root);

    // Antes: consentimento `null` montava os iframes do Instagram sozinho.
    expect(observers).toHaveLength(0);
    expect(iframes(root)).toHaveLength(0);
    expect(states(root)).toEqual(["consent", "consent", "consent"]);

    root.querySelectorAll<HTMLButtonElement>("[data-ig-load]")[0].click();
    expect(iframes(root)).toHaveLength(1);
    expect(states(root)).toEqual(["loaded", "consent", "consent"]);
    cleanup();
  });

  it("aceitar depois (sem recarregar) liga a montagem automática", () => {
    const observers = stubIntersectionObserver();
    const root = mountHome();
    const cleanup = installInstagramEmbeds(root);
    expect(observers).toHaveLength(0);

    setConsent("accepted");
    expect(observers).toHaveLength(1);
    observers[0].cb([{ isIntersecting: true, target: observers[0].targets[0] }]);
    expect(iframes(root)).toHaveLength(3);
    expect(states(root)).toEqual(["loaded", "loaded", "loaded"]);

    // Um segundo "aceitar" (outra aba, reabertura do banner) não duplica nada.
    setConsent("accepted");
    expect(observers).toHaveLength(1);
    cleanup();
  });

  it("depois do cleanup, aceitar não monta mais nada", () => {
    const observers = stubIntersectionObserver();
    const root = mountHome();
    installInstagramEmbeds(root)();
    setConsent("accepted");
    expect(observers).toHaveLength(0);
    expect(iframes(root)).toHaveLength(0);
  });

  it("sem cards, não faz nada e o cleanup é inofensivo", () => {
    stubIntersectionObserver();
    const root = document.createElement("div");
    expect(() => installInstagramEmbeds(root)()).not.toThrow();
  });
});
