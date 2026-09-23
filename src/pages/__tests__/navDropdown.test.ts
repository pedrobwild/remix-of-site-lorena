/**
 * Dropdown "Parceiros" do menu desktop (initBwaNav / initHomeBwa).
 * Cobre abrir e fechar por clique, Esc devolvendo o foco ao botão e o item
 * "Incorporadoras", que só aparece com a flag ligada ou em prévia (?incorporadoras=1).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function mount(): { root: HTMLElement; button: HTMLButtonElement; wrapper: HTMLElement } {
  document.body.innerHTML = `
    <div id="chrome">
      <header data-nav>
        <nav class="bwa-nav-links">
          <a href="/faq">FAQ</a>
          <div class="bwa-nav-dd" data-nav-dd>
            <button type="button" class="bwa-nav-dd-button" aria-expanded="false"
                    aria-controls="bwa-nav-dd-parceiros" data-nav-dd-button>Parceiros</button>
            <div class="bwa-nav-dd-panel" id="bwa-nav-dd-parceiros" data-nav-dd-panel>
              <a href="/parceiros">Clientes e corretores</a>
              <a href="/parceiros/incorporadoras" hidden data-incorp-gated>Incorporadoras</a>
            </div>
          </div>
        </nav>
        <button type="button" data-menu-button aria-expanded="false" aria-label="Abrir menu"></button>
      </header>
      <div data-mobile-menu><nav><a href="/faq">FAQ</a></nav></div>
    </div>`;
  const root = document.getElementById("chrome")!;
  return {
    root,
    button: root.querySelector<HTMLButtonElement>("[data-nav-dd-button]")!,
    wrapper: root.querySelector<HTMLElement>("[data-nav-dd]")!,
  };
}

const realLocation = window.location;

/**
 * O host do jsdom é "localhost", que a flag trata como prévia interna.
 * Para os testes, o endereço finge ser o site publicado.
 */
function fakeHost(hostname: string) {
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: new Proxy(realLocation, {
      get: (alvo, chave) => {
        if (chave === "hostname") return hostname;
        const valor = Reflect.get(alvo, chave, alvo);
        return typeof valor === "function" ? valor.bind(alvo) : valor;
      },
    }),
  });
}

async function loadNav(search: string, hostname = "bewild.com.br") {
  window.history.replaceState({}, "", `/parceiros${search}`);
  fakeHost(hostname);
  vi.resetModules();
  const { initBwaNav } = await import("../home-bwa-script");
  return initBwaNav;
}

beforeEach(() => {
  // jsdom não faz layout: todo elemento conta como renderizado.
  vi.spyOn(HTMLElement.prototype, "getClientRects").mockImplementation(
    () => [{}] as unknown as DOMRectList,
  );
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: realLocation,
  });
  window.history.replaceState({}, "", "/");
});

describe("dropdown Parceiros", () => {
  it("abre e fecha por clique", async () => {
    const initBwaNav = await loadNav("");
    const { root, button, wrapper } = mount();
    const cleanup = initBwaNav(root);

    button.click();
    expect(wrapper.classList.contains("bwa-open")).toBe(true);
    expect(button.getAttribute("aria-expanded")).toBe("true");

    button.click();
    expect(wrapper.classList.contains("bwa-open")).toBe(false);
    expect(button.getAttribute("aria-expanded")).toBe("false");
    cleanup();
  });

  it("Esc fecha e devolve o foco ao botão", async () => {
    const initBwaNav = await loadNav("");
    const { root, button, wrapper } = mount();
    const cleanup = initBwaNav(root);

    button.click();
    const primeiro = wrapper.querySelector<HTMLAnchorElement>("[data-nav-dd-panel] a")!;
    primeiro.focus();
    primeiro.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));

    expect(wrapper.classList.contains("bwa-open")).toBe(false);
    expect(document.activeElement).toBe(button);
    cleanup();
  });

  it("Incorporadoras aparece no site publicado com a flag ligada", async () => {
    const initBwaNav = await loadNav("");
    const { root, wrapper } = mount();
    const cleanup = initBwaNav(root);
    expect(wrapper.querySelector("[data-incorp-gated]")!.hasAttribute("hidden")).toBe(false);
    cleanup();
  });

  it("Incorporadoras aparece na prévia do Lovable sem parâmetro", async () => {
    const initBwaNav = await loadNav("", "id-preview--abc.lovable.app");
    const { root, wrapper } = mount();
    const cleanup = initBwaNav(root);
    expect(wrapper.querySelector("[data-incorp-gated]")!.hasAttribute("hidden")).toBe(false);
    cleanup();
  });

  it("Incorporadoras aparece na prévia com ?incorporadoras=1", async () => {
    const initBwaNav = await loadNav("?incorporadoras=1");
    const { root, wrapper } = mount();
    const cleanup = initBwaNav(root);
    expect(wrapper.querySelector("[data-incorp-gated]")!.hasAttribute("hidden")).toBe(false);
    cleanup();
  });
});
