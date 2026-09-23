import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initBwaNav, initHomeBwa } from "../home-bwa-script";

/**
 * PUB-07/09/13: o script da home e o header .bwa precisam (1) desfazer tudo
 * ao desmontar, (2) não duplicar nada no StrictMode, (3) não tocar no DOM de
 * fora da própria raiz e (4) ter menu mobile acessível pelo teclado.
 */

function key(k: string, opts: KeyboardEventInit = {}) {
  document.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...opts }));
}

function mountChrome(): { root: HTMLElement; button: HTMLButtonElement; links: HTMLAnchorElement[]; main: HTMLElement } {
  document.body.innerHTML = `
    <div id="root">
      <div class="route">
        <div class="page">
          <div id="chrome">
            <a class="bwa-skip" href="#main">Pular</a>
            <header data-nav>
              <button type="button" data-menu-button aria-expanded="false" aria-label="Abrir menu"></button>
            </header>
            <div data-mobile-menu>
              <nav><a href="/faq">FAQ</a><a href="/contato">Contato</a></nav>
            </div>
          </div>
          <main id="main"><a href="/x">Conteúdo</a></main>
        </div>
      </div>
    </div>
    <div class="portal"><a href="/faq">Dúvidas</a></div>`;
  const root = document.getElementById("chrome")!;
  return {
    root,
    button: root.querySelector("button")!,
    links: Array.from(root.querySelectorAll<HTMLAnchorElement>("[data-mobile-menu] a")),
    main: document.getElementById("main")!,
  };
}

beforeEach(() => {
  // jsdom não faz layout: todo elemento conta como renderizado.
  vi.spyOn(HTMLElement.prototype, "getClientRects").mockImplementation(
    () => [{}] as unknown as DOMRectList,
  );
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    cb(0);
    return 1;
  });
  // jsdom não implementa mídia.
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.className = "";
  document.body.style.overflow = "";
  document.body.innerHTML = "";
});

describe("initBwaNav — menu mobile", () => {
  it("abre com foco no menu, prende o Tab, deixa o resto inert e Esc devolve o foco", () => {
    const { root, button, links, main } = mountChrome();
    const cleanup = initBwaNav(root);

    button.click();
    expect(document.body.classList.contains("bwa-menu-open")).toBe(true);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(button.getAttribute("aria-label")).toBe("Fechar menu");
    expect(document.activeElement).toBe(links[0]);
    expect(main.hasAttribute("inert")).toBe(true);
    expect(root.querySelector(".bwa-skip")!.hasAttribute("inert")).toBe(true);
    expect(document.querySelector(".portal")!.hasAttribute("inert")).toBe(true);
    expect(root.querySelector("header")!.hasAttribute("inert")).toBe(false);

    links[1].focus();
    key("Tab");
    expect(document.activeElement).toBe(button);
    key("Tab", { shiftKey: true });
    expect(document.activeElement).toBe(links[1]);

    key("Escape");
    expect(document.body.classList.contains("bwa-menu-open")).toBe(false);
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(button);
    expect(document.querySelectorAll("[inert]")).toHaveLength(0);

    cleanup();
  });

  it("clicar num link fecha o menu", () => {
    const { root, button, links } = mountChrome();
    const cleanup = initBwaNav(root);
    button.click();
    links[0].addEventListener("click", (e) => e.preventDefault());
    links[0].click();
    expect(document.body.classList.contains("bwa-menu-open")).toBe(false);
    cleanup();
  });

  it("desmontar com o menu aberto não vaza classe, inert nem listeners", () => {
    const { root, button } = mountChrome();
    const cleanup = initBwaNav(root);
    button.click();
    cleanup();

    expect(document.body.classList.contains("bwa-menu-open")).toBe(false);
    expect(document.querySelectorAll("[inert]")).toHaveLength(0);
    expect(root.dataset.bwaNavInited).toBeUndefined();
    button.click();
    expect(document.body.classList.contains("bwa-menu-open")).toBe(false);
  });

  it("é idempotente e sobrevive ao ciclo do StrictMode", () => {
    const { root, button } = mountChrome();
    const first = initBwaNav(root);
    const second = initBwaNav(root); // sem cleanup entre as chamadas: no-op
    button.click();
    expect(document.body.classList.contains("bwa-menu-open")).toBe(true);
    button.click();
    expect(document.body.classList.contains("bwa-menu-open")).toBe(false);
    second();
    first();

    const again = initBwaNav(root); // mount → cleanup → mount
    button.click();
    expect(document.body.classList.contains("bwa-menu-open")).toBe(true);
    again();
  });

  it("aceita raiz nula", () => {
    expect(() => initBwaNav(null)()).not.toThrow();
  });
});

function mountHome(): HTMLElement {
  document.body.innerHTML = `
    <div class="bwa-faq-item bwa-open" id="fora">
      <button class="bwa-faq-question" aria-expanded="true"></button>
      <div class="bwa-faq-answer"><p>Resposta de outra página</p></div>
    </div>
    <div id="home">
      <header data-nav><button type="button" data-menu-button></button></header>
      <div data-mobile-menu><nav><a href="/faq">FAQ</a></nav></div>
      <main>
        <article class="bwa-faq-item">
          <button class="bwa-faq-question" type="button" aria-expanded="false"></button>
          <div class="bwa-faq-answer"><p>Resposta</p></div>
        </article>
        <button class="bwa-play" type="button" data-video-demo></button>
      </main>
      <div class="bwa-modal" role="dialog" aria-modal="true" data-video-modal>
        <div class="bwa-modal-card">
          <video data-video-element></video>
          <button type="button" data-close-modal>Fechar</button>
        </div>
      </div>
    </div>`;
  return document.getElementById("home")!;
}

describe("initHomeBwa", () => {
  it("fechar a página com o vídeo aberto devolve a rolagem do body", () => {
    const root = mountHome();
    const cleanup = initHomeBwa(root);
    const modal = root.querySelector<HTMLElement>("[data-video-modal]")!;

    root.querySelector<HTMLElement>("[data-video-demo]")!.click();
    expect(modal.classList.contains("bwa-open")).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.activeElement).toBe(root.querySelector("[data-close-modal]"));
    expect(root.querySelector("main")!.hasAttribute("inert")).toBe(true);

    cleanup();
    expect(modal.classList.contains("bwa-open")).toBe(false);
    expect(document.body.style.overflow).toBe("");
    expect(document.querySelectorAll("[inert]")).toHaveLength(0);
  });

  it("Esc fecha o vídeo e devolve o foco ao botão de play", () => {
    const root = mountHome();
    const cleanup = initHomeBwa(root);
    const play = root.querySelector<HTMLElement>("[data-video-demo]")!;
    play.focus();
    play.click();
    key("Escape");
    expect(root.querySelector("[data-video-modal]")!.classList.contains("bwa-open")).toBe(false);
    expect(document.body.style.overflow).toBe("");
    expect(document.activeElement).toBe(play);
    cleanup();
  });

  it("resize só mexe no FAQ da própria home e para depois da limpeza", () => {
    const root = mountHome();
    const outside = document.querySelector<HTMLElement>("#fora .bwa-faq-answer")!;
    const cleanup = initHomeBwa(root);
    const answer = root.querySelector<HTMLElement>(".bwa-faq-answer")!;

    root.querySelector<HTMLElement>(".bwa-faq-question")!.click();
    window.dispatchEvent(new Event("resize"));
    expect(outside.style.maxHeight).toBe("");

    cleanup();
    answer.style.maxHeight = "123px";
    window.dispatchEvent(new Event("resize"));
    expect(answer.style.maxHeight).toBe("123px");
    expect(outside.style.maxHeight).toBe("");
  });

  it("não duplica o handler do acordeão em chamadas repetidas", () => {
    const root = mountHome();
    const a = initHomeBwa(root);
    const b = initHomeBwa(root);
    const item = root.querySelector<HTMLElement>(".bwa-faq-item")!;
    const question = item.querySelector<HTMLElement>(".bwa-faq-question")!;

    question.click();
    expect(item.classList.contains("bwa-open")).toBe(true);
    expect(question.getAttribute("aria-expanded")).toBe("true");
    expect(question.getAttribute("aria-controls")).toBe(item.querySelector(".bwa-faq-answer")!.id);
    b();
    a();
  });

  it("desmontar com o menu aberto não deixa a próxima rota com o menu aberto", () => {
    const root = mountHome();
    const cleanup = initHomeBwa(root);
    root.querySelector<HTMLButtonElement>("[data-menu-button]")!.click();
    expect(document.body.classList.contains("bwa-menu-open")).toBe(true);
    cleanup();
    expect(document.body.classList.contains("bwa-menu-open")).toBe(false);
  });
});
