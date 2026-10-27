/**
 * PageView/ViewContent pelo servidor (src/lib/metaCapiBeacon.ts): sai em toda
 * página pública COM OU SEM aceite de cookies, nunca no /admin, nunca em
 * automação (`navigator.webdriver`) nem em iframe; leva `_fbp`/`_fbc` só se
 * os cookies já existem; nunca lança.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildMetaServerPayload,
  canSendMetaServerEvent,
  metaPageviewEndpoint,
  sendMetaServerEvent,
} from "@/lib/metaCapiBeacon";

const SB = "https://proj.supabase.co";
const fetchMock = vi.fn();

function clearCookies() {
  for (const c of document.cookie.split(";")) {
    const name = c.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
}

function lastBody(): Record<string, unknown> {
  const [, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  return JSON.parse(String(init.body)) as Record<string, unknown>;
}

beforeEach(() => {
  vi.stubEnv("VITE_SUPABASE_URL", SB);
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "pk-test");
  fetchMock.mockReset().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);
  window.localStorage.clear();
  window.history.replaceState(null, "", "/portfolio/studio-a?utm_source=meta");
  clearCookies();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  clearCookies();
});

describe("metaPageviewEndpoint", () => {
  it("monta o endereço da edge function; sem VITE_SUPABASE_URL devolve null", () => {
    expect(metaPageviewEndpoint(SB)).toBe(`${SB}/functions/v1/meta-pageview`);
    expect(metaPageviewEndpoint(`${SB}/`)).toBe(`${SB}/functions/v1/meta-pageview`);
    expect(metaPageviewEndpoint("")).toBeNull();
    expect(metaPageviewEndpoint("  ")).toBeNull();
    // Sem argumento usa VITE_SUPABASE_URL.
    expect(metaPageviewEndpoint()).toBe(`${SB}/functions/v1/meta-pageview`);
  });
});

describe("sendMetaServerEvent", () => {
  it("PageView sai SEM aceite de cookies, com keepalive, apikey e o event_id dado", () => {
    expect(window.localStorage.getItem("bewild_cookie_consent_v2")).toBeNull();
    expect(sendMetaServerEvent("PageView", { eventId: "ev-1" })).toBe("sent");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${SB}/functions/v1/meta-pageview`);
    expect(init.method).toBe("POST");
    expect(init.keepalive).toBe(true);
    expect(init.headers).toEqual({ "content-type": "application/json", apikey: "pk-test" });
    expect(lastBody()).toEqual({
      event: "PageView",
      event_id: "ev-1",
      url: "http://localhost:3000/portfolio/studio-a?utm_source=meta",
    });
  });

  it("ViewContent leva os campos de conteúdo (sem fbp/fbc quando não há cookie)", () => {
    sendMetaServerEvent("ViewContent", {
      eventId: "ev-2",
      contentType: "product",
      contentIds: ["studio-a"],
      contentCategory: "projeto",
      contentName: "Studio A",
    });
    expect(lastBody()).toEqual({
      event: "ViewContent",
      event_id: "ev-2",
      url: "http://localhost:3000/portfolio/studio-a?utm_source=meta",
      content_type: "product",
      content_ids: ["studio-a"],
      content_category: "projeto",
      content_name: "Studio A",
    });
    expect(lastBody()).not.toHaveProperty("fbp");
    expect(lastBody()).not.toHaveProperty("fbc");
  });

  it("inclui _fbp/_fbc quando os cookies existem; cookie fora do formato é ignorado e nenhum cookie é criado", () => {
    document.cookie = "_fbp=fb.1.1700000000000.123456789; path=/";
    document.cookie = "_fbc=fb.1.1700000000000.AbC_dEf; path=/";
    sendMetaServerEvent("PageView", { eventId: "ev-3" });
    expect(lastBody()).toMatchObject({ fbp: "fb.1.1700000000000.123456789", fbc: "fb.1.1700000000000.AbC_dEf" });

    clearCookies();
    document.cookie = "_fbp=lixo; path=/";
    sendMetaServerEvent("PageView", { eventId: "ev-4" });
    expect(lastBody()).not.toHaveProperty("fbp");
    expect(document.cookie).not.toMatch(/_fbc/);
  });

  it("não sai no /admin nem sem eventId", () => {
    window.history.replaceState(null, "", "/admin/leads");
    expect(canSendMetaServerEvent()).toBe(false);
    expect(sendMetaServerEvent("PageView", { eventId: "ev-5" })).toBe("blocked");
    window.history.replaceState(null, "", "/admin");
    expect(sendMetaServerEvent("PageView", { eventId: "ev-5" })).toBe("blocked");
    window.history.replaceState(null, "", "/faq");
    expect(sendMetaServerEvent("PageView", { eventId: "" })).toBe("blocked");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("não sai em automação (navigator.webdriver) nem dentro de iframe", () => {
    const wd = Object.getOwnPropertyDescriptor(Navigator.prototype, "webdriver");
    Object.defineProperty(navigator, "webdriver", { value: true, configurable: true });
    try {
      expect(sendMetaServerEvent("PageView", { eventId: "ev-6" })).toBe("blocked");
    } finally {
      delete (navigator as unknown as Record<string, unknown>).webdriver;
      if (wd) Object.defineProperty(Navigator.prototype, "webdriver", wd);
    }

    const top = Object.getOwnPropertyDescriptor(window, "top")!;
    Object.defineProperty(window, "top", { value: {}, configurable: true });
    try {
      expect(sendMetaServerEvent("PageView", { eventId: "ev-7" })).toBe("blocked");
    } finally {
      Object.defineProperty(window, "top", top);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sem VITE_SUPABASE_URL fica bloqueado; erro de rede e exceção do fetch são engolidos", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    expect(sendMetaServerEvent("PageView", { eventId: "ev-8" })).toBe("blocked");
    expect(fetchMock).not.toHaveBeenCalled();

    vi.stubEnv("VITE_SUPABASE_URL", SB);
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    expect(sendMetaServerEvent("PageView", { eventId: "ev-9" })).toBe("sent");
    await Promise.resolve();

    fetchMock.mockImplementationOnce(() => {
      throw new Error("fetch indisponível");
    });
    expect(() => sendMetaServerEvent("PageView", { eventId: "ev-10" })).not.toThrow();
  });

  it("payload limita content_name a 200 e content_ids a 10", () => {
    const body = buildMetaServerPayload("ViewContent", {
      eventId: "ev-11",
      contentName: "x".repeat(300),
      contentIds: Array.from({ length: 12 }, (_, i) => `id-${i}`),
    });
    expect((body.content_name as string).length).toBe(200);
    expect(body.content_ids).toHaveLength(10);
  });
});
