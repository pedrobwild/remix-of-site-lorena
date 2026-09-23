/**
 * Flag da página /parceiros/incorporadoras.
 * A flag em src/config/site.ts é mockada para cobrir os dois estados.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const flag = { INCORPORADORAS_PAGE_ENABLED: false };
vi.mock("@/config/site", () => ({
  get INCORPORADORAS_PAGE_ENABLED() {
    return flag.INCORPORADORAS_PAGE_ENABLED;
  },
}));

async function load(search: string) {
  window.history.replaceState({}, "", `/parceiros/incorporadoras${search}`);
  vi.resetModules();
  return await import("../incorporadorasFlag");
}

beforeEach(() => {
  flag.INCORPORADORAS_PAGE_ENABLED = false;
  window.sessionStorage.clear();
});

afterEach(() => {
  window.history.replaceState({}, "", "/");
});

describe("isIncorporadorasEnabled", () => {
  it("com a flag desligada e sem parâmetro, a página não aparece", async () => {
    const m = await load("");
    expect(m.isIncorporadorasEnabled()).toBe(false);
    expect(m.isIncorporadorasPreview()).toBe(false);
  });

  it("com a flag ligada, a página aparece e não é prévia", async () => {
    flag.INCORPORADORAS_PAGE_ENABLED = true;
    const m = await load("");
    expect(m.isIncorporadorasEnabled()).toBe(true);
    expect(m.isIncorporadorasPreview()).toBe(false);
  });

  it("?incorporadoras=1 liga a prévia e persiste na sessão", async () => {
    const m = await load("?incorporadoras=1");
    expect(m.isIncorporadorasEnabled()).toBe(true);
    expect(m.isIncorporadorasPreview()).toBe(true);
    expect(window.sessionStorage.getItem("bw_prev_incorporadoras")).toBe("1");

    // Navegação seguinte, sem o parâmetro: continua ligada na sessão.
    window.history.replaceState({}, "", "/parceiros/incorporadoras");
    expect(m.isIncorporadorasEnabled()).toBe(true);
  });

  it("?incorporadoras=0 desliga a prévia", async () => {
    const m = await load("?incorporadoras=1");
    expect(m.isIncorporadorasEnabled()).toBe(true);

    window.history.replaceState({}, "", "/parceiros/incorporadoras?incorporadoras=0");
    expect(m.isIncorporadorasEnabled()).toBe(false);
    expect(window.sessionStorage.getItem("bw_prev_incorporadoras")).toBeNull();
  });
});
