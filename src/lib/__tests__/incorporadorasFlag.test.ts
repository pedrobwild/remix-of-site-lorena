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

const realLocation = window.location;

/** Troca o endereço da página (host + parâmetros) para o teste. */
function setLocation(hostname: string, search: string) {
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: { hostname, search, pathname: "/parceiros/incorporadoras" },
  });
}

async function load(search: string, hostname = "bewild.com.br") {
  setLocation(hostname, search);
  vi.resetModules();
  return await import("../incorporadorasFlag");
}

beforeEach(() => {
  flag.INCORPORADORAS_PAGE_ENABLED = false;
  window.sessionStorage.clear();
});

afterEach(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: realLocation,
  });
});

describe("isIncorporadorasEnabled", () => {
  it("no site publicado, com a flag desligada e sem parâmetro, a página não aparece", async () => {
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
    setLocation("bewild.com.br", "");
    expect(m.isIncorporadorasEnabled()).toBe(true);
  });

  it("?incorporadoras=0 desliga a prévia", async () => {
    const m = await load("?incorporadoras=1");
    expect(m.isIncorporadorasEnabled()).toBe(true);

    setLocation("bewild.com.br", "?incorporadoras=0");
    expect(m.isIncorporadorasEnabled()).toBe(false);
    expect(window.sessionStorage.getItem("bw_prev_incorporadoras")).toBe("0");
  });

  it.each([
    "id-preview--6a6657bf-3700-4d35-867e-c076acbf7613.lovable.app",
    "preview--bewild.lovable.app",
    "bewild.lovableproject.com",
    "localhost",
    "127.0.0.1",
  ])("prévia do Lovable ou ambiente local liga sem parâmetro: %s", async (host) => {
    const m = await load("", host);
    expect(m.isIncorporadorasEnabled()).toBe(true);
    expect(m.isIncorporadorasPreview()).toBe(true);
  });

  it("no host de prévia, ?incorporadoras=0 desliga e continua desligada na sessão", async () => {
    const m = await load("?incorporadoras=0", "localhost");
    expect(m.isIncorporadorasEnabled()).toBe(false);

    setLocation("localhost", "");
    expect(m.isIncorporadorasEnabled()).toBe(false);
  });

  it("o endereço publicado do Lovable continua escondendo a página", async () => {
    const m = await load("", "bewild-com-br.lovable.app");
    expect(m.isIncorporadorasEnabled()).toBe(false);
  });
});
