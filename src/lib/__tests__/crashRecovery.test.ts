/**
 * CORE-12 — o orçamento anti-loop de reloads não pode ser zerado por um boot
 * "saudável". Antes, `markHealthy()` apagava o contador 5 s depois de todo
 * boot: um crash que acontecesse mais de 5 s após montar recarregava para
 * sempre (cada ciclo começava com o contador zerado).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { markHealthy, tryAutoReload } from "../crashRecovery";

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
