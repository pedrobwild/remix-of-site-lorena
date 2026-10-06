/**
 * CORE-12 — o orçamento anti-loop de reloads não pode ser zerado por um boot
 * "saudável". Antes, `markHealthy()` apagava o contador 5 s depois de todo
 * boot: um crash que acontecesse mais de 5 s após montar recarregava para
 * sempre (cada ciclo começava com o contador zerado).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hasRenderedContent, isIgnorableError, markHealthy, tryAutoReload } from "../crashRecovery";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-23T12:00:00Z"));
  sessionStorage.clear();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

/**
 * Tenta o reload e descarta o `location.reload` agendado (jsdom não navega).
 * `clearAllTimers` também volta o relógio falso ao início — restaura.
 */
function crash(): boolean {
  const now = Date.now();
  const reloaded = tryAutoReload();
  vi.clearAllTimers();
  vi.setSystemTime(now);
  return reloaded;
}

/** Simula um boot que fica "saudável" e roda por `ms` antes do próximo crash. */
function healthyBootFor(ms: number) {
  markHealthy();
  vi.advanceTimersByTime(ms);
}

describe("tryAutoReload + markHealthy", () => {
  it("crash tardio recorrente (> 5 s após o boot) esgota o orçamento e para de recarregar", () => {
    expect(crash()).toBe(true); // 1º reload
    healthyBootFor(10_000);
    expect(crash()).toBe(true); // 2º reload
    healthyBootFor(10_000);
    // 3º crash dentro da janela de 60 s: fallback estático, sem loop.
    expect(crash()).toBe(false);
  });

  it("markHealthy não zera o contador (nem depois de muito tempo de timers)", () => {
    crash();
    crash();
    markHealthy();
    vi.advanceTimersByTime(30_000);
    const state = JSON.parse(sessionStorage.getItem("lvbl:reload-attempts") || "{}");
    expect(state.count).toBe(2);
  });

  it("fora da janela de 60 s o orçamento volta (crash isolado bem depois ainda recarrega)", () => {
    crash();
    crash();
    expect(crash()).toBe(false);
    vi.setSystemTime(Date.now() + 61_000);
    expect(crash()).toBe(true);
  });
});

/**
 * MOB-01 (06/10/2026) — com SSR não existe `#root`: o watchdog olhava para ele
 * e recarregava a página de quem ainda estava hidratando (celular lento) mesmo
 * com o site inteiro na tela.
 */
describe("hasRenderedContent", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("HTML do servidor na tela conta como conteúdo, mesmo sem #root", () => {
    document.body.innerHTML = '<header><a href="/">Bewild</a></header><main><h1>Reforma</h1></main>';
    expect(document.getElementById("root")).toBeNull();
    expect(hasRenderedContent()).toBe(true);
  });

  it("body vazio ou só com scripts/estilos é tela em branco", () => {
    document.body.innerHTML = "";
    expect(hasRenderedContent()).toBe(false);
    document.body.innerHTML = '<script>var a = 1;</script><style>p{color:red}</style><noscript>x</noscript>';
    expect(hasRenderedContent()).toBe(false);
    document.body.innerHTML = "<div></div><div>   </div>";
    expect(hasRenderedContent()).toBe(false);
  });

  it("o #root antigo (SPA) com filhos continua valendo", () => {
    document.body.innerHTML = '<div id="root"><p>ok</p></div>';
    expect(hasRenderedContent()).toBe(true);
  });
});

describe("isIgnorableError", () => {
  it("ignora ruído do navegador e do app da Meta", () => {
    for (const message of [
      "ResizeObserver loop completed with undelivered notifications.",
      "ResizeObserver loop limit exceeded",
      "Script error.",
      "Error invoking postMessage: Java object is gone",
      "undefined is not an object (evaluating 'window.webkit.messageHandlers')",
      "Can't find variable: _AutofillCallbackHandler",
    ]) {
      expect(isIgnorableError(message)).toBe(true);
      expect(isIgnorableError(new Error(message))).toBe(true);
    }
  });

  it("erro do site continua sendo registrado", () => {
    for (const message of [
      "Cannot read properties of null (reading 'useState')",
      "Failed to fetch dynamically imported module: https://bewild.com.br/assets/routes-x.js",
      "Minified React error #418",
      "Script error in checkout", // só o "Script error." puro é de outra origem
    ]) {
      expect(isIgnorableError(new Error(message))).toBe(false);
    }
    expect(isIgnorableError(undefined)).toBe(false);
    expect(isIgnorableError(null)).toBe(false);
    expect(isIgnorableError("")).toBe(false);
  });
});
