import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, cleanup as cleanupReact } from "@testing-library/react";
import { initAnalytics } from "@/lib/analytics";
import { useCtaClickTracking } from "@/lib/trackCta";
import { setConsent } from "@/lib/cookieConsent";

const fetchMock = vi.fn().mockResolvedValue({ status: 204 });
const gtag = vi.fn();
let stop: (() => void) | undefined;
const noNavigation = (event: Event) => event.preventDefault();
const rows = () => fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body)).filter(row => row.event_type !== "pageview");
const click = () => document.querySelector("button, a, input, [role]")?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockClear();
  gtag.mockClear();
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState({}, "", "/");
  Object.assign(window, { gtag, __bewildGa4Inited: true });
  document.addEventListener("click", noNavigation);
});
afterEach(() => {
  stop?.();
  stop = undefined;
  cleanupReact();
  document.body.innerHTML = "";
  document.removeEventListener("click", noNavigation);
  Object.defineProperty(navigator, "doNotTrack", { value: null, configurable: true });
  delete window.gtag;
  delete (window as Window & { __bewildGa4Inited?: boolean }).__bewildGa4Inited;
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const start = () => { setConsent("accepted"); stop = initAnalytics(); vi.advanceTimersByTime(300); fetchMock.mockClear(); };

describe("todos os botões públicos", () => {
  it.each([
    '<button>Continuar</button>',
    '<a class="bwa-btn" href="/orcamento">Continuar</a>',
    '<a data-cta="pedido" href="/orcamento">Continuar</a>',
    '<div role="button" tabindex="0">Continuar</div>',
    '<input type="submit" value="Enviar">',
  ])("mede controle %s", html => {
    start(); document.body.innerHTML = html; click();
    expect(rows().map(row => row.event_type)).toEqual(["click_cta"]);
    expect(rows()[0].value.page).toBe("/");
    expect(gtag).toHaveBeenCalledWith("event", "cta_click", expect.objectContaining({ page: "/" }));
  });
  it("deduplica hook local e listener global, mas conta um novo clique", () => {
    start(); renderHook(() => useCtaClickTracking("home"));
    document.body.innerHTML = '<button data-cta="pedido"><span>Orçamento</span></button>';
    document.querySelector("span")?.click();
    expect(rows()).toHaveLength(1); expect(gtag).toHaveBeenCalledTimes(1);
    click(); expect(rows()).toHaveLength(2); expect(gtag).toHaveBeenCalledTimes(2);
  });
  it.each([
    ["/reforma-de-studio-sao-paulo", "servico-reforma-studio-sp-topo"],
    ["/reforma-de-apartamento-sao-paulo", "servico-reforma-apartamento-sp-topo"],
  ])("preserva campanha e identifica o pedido em %s", (path, cta) => {
    window.history.replaceState({}, "", `${path}?utm_source=google&utm_medium=cpc&utm_content=studio-ape-pequeno`);
    start(); renderHook(() => useCtaClickTracking(path));
    document.body.innerHTML = `<a class="bwa-button" href="/orcamento" data-cta="${cta}">Peça seu orçamento</a>`;
    click();
    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toMatchObject({ path, utm_source: "google", utm_medium: "cpc", utm_content: "studio-ape-pequeno", value: { cta } });
    expect(document.querySelector("a")?.getAttribute("href")).toBe("/orcamento");
  });
  it.each(["sem aceite", "recusa", "admin", "DNT"])("não mede: %s", reason => {
    if (reason !== "sem aceite") start(); else stop = initAnalytics();
    if (reason === "recusa") setConsent("declined");
    if (reason === "admin") window.history.replaceState({}, "", "/admin/seo");
    if (reason === "DNT") Object.defineProperty(navigator, "doNotTrack", { value: "1", configurable: true });
    fetchMock.mockClear(); document.body.innerHTML = "<button>Menu</button>"; click();
    expect(rows()).toEqual([]); expect(gtag).not.toHaveBeenCalled();
  });
  it.each(['<button disabled>Menu</button>', '<button aria-disabled="true">Menu</button>', '<a href="/faq">FAQ</a>'])("ignora desabilitado ou link editorial: %s", html => {
    start(); document.body.innerHTML = html; click(); expect(rows()).toEqual([]);
  });
  it("preserva evento explícito sem duplicar", () => {
    start(); document.body.innerHTML = '<button data-track="faq_question_click">Pergunta</button>'; click();
    expect(rows().map(row => row.event_type)).toEqual(["faq_question_click"]);
  });
  it("WhatsApp continua sendo somente contato", () => {
    start(); document.body.innerHTML = '<a class="bwa-btn" href="https://wa.me/5511911906183">WhatsApp</a>'; click();
    expect(rows().map(row => row.event_type)).toEqual(["click_whatsapp"]);
  });
  it("não envia valores de campos, query ou rótulos de escolhas", () => {
    start(); document.body.innerHTML = '<button role="combobox" aria-label="cliente@example.com" value="nome privado">Nome privado</button>'; click();
    expect(JSON.stringify(rows())).not.toContain("privado");
    expect(JSON.stringify(rows())).not.toContain("example.com");
  });
});