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

  it("o inert entra e sai um quadro depois do toque (não segura a abertura do menu) e a limpeza desfaz na hora", () => {
    // Quadros controlados pelo teste (o beforeEach roda os callbacks na hora).
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      frames.push(cb);
      return frames.length;
    });
    const frame = () => frames.splice(0).forEach((cb) => cb(0));
    const { root, button, links, main } = mountChrome();
    const cleanup = initBwaNav(root);

    button.click();
    // No toque: menu aberto e foco dentro dele; a página ainda não está inerte.
    expect(document.body.classList.contains("bwa-menu-open")).toBe(true);
    expect(document.activeElement).toBe(links[0]);
    expect(document.querySelectorAll("[inert]")).toHaveLength(0);
    frame(); // quadro em que o menu é pintado
    expect(document.querySelectorAll("[inert]")).toHaveLength(0);
    frame(); // quadro seguinte
    expect(main.hasAttribute("inert")).toBe(true);

    // Fechar: some na hora; o inert sai dois quadros depois.
    button.click();
    expect(document.body.classList.contains("bwa-menu-open")).toBe(false);
    expect(main.hasAttribute("inert")).toBe(true);
    frame();
    frame();
    expect(document.querySelectorAll("[inert]")).toHaveLength(0);

    // Abrir e fechar antes do quadro: nada fica inerte.
    button.click();
    button.click();
    frame();
    frame();
    expect(document.querySelectorAll("[inert]")).toHaveLength(0);

    // Fechar e reabrir antes de o inert sair: continua inerte e ainda dá para desfazer.
    button.click();
    frame();
    frame();
    expect(main.hasAttribute("inert")).toBe(true);
    button.click(); // fecha
    button.click(); // reabre antes dos quadros
    frame();
    frame();
    expect(main.hasAttribute("inert")).toBe(true);

    // Desmontar com o menu aberto solta a página sem esperar quadro nenhum.
    cleanup();
    expect(document.querySelectorAll("[inert]")).toHaveLength(0);
    frame();
    frame();
    expect(document.querySelectorAll("[inert]")).toHaveLength(0);
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

/* ------------------------------------------------------------------------
 * UX mobile: barra "Solicitar orçamento", acordeão das disciplinas e
 * `data-bwa-typing` (teclado aberto).
 * ---------------------------------------------------------------------- */

/** matchMedia que responde `matches` e deixa o teste disparar a troca. */
function stubMatchMedia(matches: boolean): { setMatches: (next: boolean) => void; restore: () => void } {
  const previous = window.matchMedia;
  const listeners: Array<(event: MediaQueryListEvent) => void> = [];
  const mql = {
    matches,
    media: "",
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.push(listener),
    removeEventListener: () => {},
    dispatchEvent: () => false,
  };
  window.matchMedia = (() => mql) as unknown as typeof window.matchMedia;
  return {
    setMatches: (next) => {
      mql.matches = next;
      listeners.forEach((listener) => listener({ matches: next } as MediaQueryListEvent));
    },
    restore: () => {
      window.matchMedia = previous;
    },
  };
}

function mountMobileHome(): HTMLElement {
  document.body.innerHTML = `
    <div id="home">
      <main>
        <section class="bwa-hero"><div class="bwa-hero-bottom"><a href="/orcamento">Solicitar orçamento</a></div></section>
        <ul class="bwa-discipline-list">
          <li><b>01</b><p><strong>Consultoria.</strong> <span class="bwa-discipline-desc">Leitura do imóvel.</span></p></li>
          <li><b>02</b><p><strong>Projeto 3D.</strong> <span class="bwa-discipline-desc">Maquete realista.</span></p></li>
        </ul>
        <section class="bwa-final" id="contato"></section>
        <a class="bwa-mobile-cta is-hidden" href="/orcamento">Solicitar orçamento</a>
      </main>
    </div>`;
  return document.getElementById("home")!;
}

/** Posição de um elemento na tela (o jsdom não faz layout). */
function placeAt(el: Element, top: number, height = 60) {
  el.getBoundingClientRect = () =>
    ({ top, bottom: top + height, height, left: 0, right: 390, width: 390, x: 0, y: top, toJSON() {} }) as DOMRect;
}

describe("initHomeBwa — barra 'Solicitar orçamento' do celular", () => {
  it("aparece só depois do herói e some do fechamento até o fim da página, inclusive em saltos", () => {
    const root = mountMobileHome();
    const vh = window.innerHeight;
    const heroCta = root.querySelector(".bwa-hero-bottom")!;
    const finale = root.querySelector(".bwa-final")!;
    const bar = root.querySelector<HTMLElement>(".bwa-mobile-cta")!;
    const scrollTo = (heroTop: number, finaleTop: number) => {
      placeAt(heroCta, heroTop);
      placeAt(finale, finaleTop, 900);
      window.dispatchEvent(new Event("scroll"));
    };

    // Topo da página: o botão do herói está na tela, a barra seria repetida.
    placeAt(heroCta, 400);
    placeAt(finale, 20000, 900);
    const cleanup = initHomeBwa(root);
    let cleaned = false;
    try {
      expect(bar).toHaveClass("is-hidden");

      // Rolou além do herói.
      scrollTo(-100, 15000);
      expect(bar).not.toHaveClass("is-hidden");
      // O fechamento entrou por baixo da tela.
      scrollTo(-9000, vh - 10);
      expect(bar).toHaveClass("is-hidden");
      // Rodapé: o fechamento já ficou para trás.
      scrollTo(-12000, -2500);
      expect(bar).toHaveClass("is-hidden");
      // Salto direto do rodapé para o meio (âncora, Voltar): volta a aparecer.
      scrollTo(-3000, 9000);
      expect(bar).not.toHaveClass("is-hidden");

      cleanup();
      cleaned = true;
      expect(bar).toHaveClass("is-hidden");
      // Depois da limpeza, a rolagem não mexe mais na barra.
      scrollTo(-3000, 9000);
      expect(bar).toHaveClass("is-hidden");
    } finally {
      if (!cleaned) cleanup();
    }
  });
});

describe("initHomeBwa — disciplinas em acordeão no celular", () => {
  it("no celular, cada título vira botão e a explicação abre no toque; no desktop, nada muda", () => {
    const media = stubMatchMedia(true);
    try {
      const root = mountMobileHome();
      const cleanup = initHomeBwa(root);
      const list = root.querySelector<HTMLElement>(".bwa-discipline-list")!;
      const toggles = Array.from(list.querySelectorAll<HTMLButtonElement>("button.bwa-discipline-toggle"));
      expect(list).toHaveClass("is-collapsible");
      expect(toggles).toHaveLength(2);
      expect(toggles[0].textContent).toBe("Consultoria.");
      expect(toggles[0].getAttribute("aria-expanded")).toBe("false");
      const desc = document.getElementById(toggles[0].getAttribute("aria-controls")!)!;
      expect(desc).toHaveClass("bwa-discipline-desc");
      expect(desc.textContent).toBe("Leitura do imóvel.");

      toggles[0].click();
      expect(toggles[0].closest("li")).toHaveClass("is-open");
      expect(toggles[0].getAttribute("aria-expanded")).toBe("true");
      expect(toggles[1].closest("li")).not.toHaveClass("is-open");
      toggles[0].click();
      expect(toggles[0].closest("li")).not.toHaveClass("is-open");

      // Girou o tablet para a largura de desktop: volta ao texto corrido.
      toggles[1].click();
      media.setMatches(false);
      expect(list).not.toHaveClass("is-collapsible");
      expect(list.querySelector("button")).toBeNull();
      expect(list.querySelector("li.is-open")).toBeNull();
      expect(list.querySelector("li > p > strong")!.textContent).toBe("Consultoria.");

      media.setMatches(true);
      expect(list.querySelectorAll("button.bwa-discipline-toggle")).toHaveLength(2);
      cleanup();
      expect(list.querySelector("button")).toBeNull();
      expect(list).not.toHaveClass("is-collapsible");
    } finally {
      media.restore();
    }
  });

  it("no desktop o HTML fica como veio", () => {
    const root = mountMobileHome();
    const before = root.querySelector(".bwa-discipline-list")!.innerHTML;
    const cleanup = initHomeBwa(root);
    expect(root.querySelector(".bwa-discipline-list")!.innerHTML).toBe(before);
    cleanup();
  });
});

describe("data-bwa-typing — teclado aberto no celular", () => {
  it("marca o <html> enquanto um campo de texto tem o foco e limpa ao desmontar", () => {
    const { root } = mountChrome();
    const form = document.createElement("form");
    form.innerHTML = `<input name="nome" type="text"><textarea name="mensagem"></textarea><input type="checkbox"><button type="submit">Enviar</button>`;
    document.body.appendChild(form);
    const [text, area, check, submit] = Array.from(form.elements) as HTMLElement[];
    const html = document.documentElement;
    const classBefore = html.className;
    const cleanup = initBwaNav(root);

    text.focus();
    expect(html).toHaveAttribute("data-bwa-typing");
    area.focus(); // de um campo para outro: continua
    expect(html).toHaveAttribute("data-bwa-typing");
    // Atributo, não classe: a classe do <html> não é tocada (MOB-03).
    expect(html.className).toBe(classBefore);
    check.focus();
    expect(html).not.toHaveAttribute("data-bwa-typing");
    text.focus();
    submit.focus();
    expect(html).not.toHaveAttribute("data-bwa-typing");

    text.focus();
    cleanup();
    expect(html).not.toHaveAttribute("data-bwa-typing");
    area.focus();
    expect(html).not.toHaveAttribute("data-bwa-typing");
  });
});
