/**
 * A auditoria de SEO do admin carrega páginas públicas num iframe oculto
 * (mesma origem). Esse carregamento não é visita: nenhum ponto de
 * rastreamento pode disparar — tracker interno, GA4, Meta Pixel, trackers
 * injetados por useSeo e o log de 404 — mesmo com cookies aceitos.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";

const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
vi.stubGlobal("fetch", fetchMock);
const beaconMock = vi.fn().mockReturnValue(true);
Object.defineProperty(navigator, "sendBeacon", { value: beaconMock, configurable: true, writable: true });

const rpcMock = vi.fn().mockResolvedValue({ data: null, error: null });
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...a: unknown[]) => rpcMock(...a),
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => new Promise(() => {}) }) }) }),
  },
}));
vi.mock("@/lib/useSiteSettings", async () => {
  const actual = await vi.importActual<typeof import("@/lib/useSiteSettings")>("@/lib/useSiteSettings");
  return {
    ...actual,
    fetchSiteSettings: vi.fn(async () => ({
      ...actual.getCachedSiteSettings(),
      meta_pixel_id: "123456789012",
      clarity_id: "abcdef1234",
    })),
  };
});

import { initAnalytics, logConsentAudit, track } from "@/lib/analytics";
import { initGa4, trackPageView } from "@/lib/ga4";
import { useSeo } from "@/lib/useSeo";
import { logNotFound } from "@/lib/notFoundLog";
import { isFramed } from "@/lib/cookieConsent";
import MetaPixel from "@/components/MetaPixel";

type W = Window & { __bewildGa4Inited?: boolean; fbq?: unknown };
const originalTop = Object.getOwnPropertyDescriptor(window, "top")!;

function Page() {
  useSeo({ title: "FAQ", canonicalPath: "/faq" });
  return null;
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.localStorage.setItem("lal_cookie_consent", "accepted");
  window.history.replaceState(null, "", "/faq");
  fetchMock.mockClear();
  beaconMock.mockClear();
  rpcMock.mockClear();
  // Simula a página carregada dentro do iframe da auditoria.
  Object.defineProperty(window, "top", { get: () => ({}), configurable: true });
});

afterEach(() => {
  cleanup();
  Object.defineProperty(window, "top", originalTop);
  vi.useRealTimers();
  delete (window as W).__bewildGa4Inited;
  delete (window as W).fbq;
  document.head.querySelectorAll("[data-seo-injected]").forEach((n) => n.remove());
});

describe("página dentro de iframe (auditoria de SEO do admin)", () => {
  it("isFramed detecta o frame; acesso bloqueado a window.top também conta", () => {
    expect(isFramed()).toBe(true);
    Object.defineProperty(window, "top", {
      get: () => {
        throw new DOMException("Blocked a frame with origin", "SecurityError");
      },
      configurable: true,
    });
    expect(isFramed()).toBe(true);
  });

  it("tracker interno: nem pageview, nem evento, nem auditoria de consentimento, nem ids gravados", () => {
    const cleanupAnalytics = initAnalytics();
    vi.advanceTimersByTime(1000);
    track("click_cta", { value: { cta: "x" } });
    logConsentAudit("accepted");
    window.dispatchEvent(new Event("pagehide"));
    cleanupAnalytics();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(beaconMock).not.toHaveBeenCalled();
    expect(Object.keys(window.localStorage)).toEqual(["lal_cookie_consent"]);
  });

  it("GA4 não inicializa nem envia page_view", () => {
    initGa4();
    trackPageView("/faq");
    expect((window as W).__bewildGa4Inited).toBeFalsy();
    expect(document.head.querySelector('script[src*="googletagmanager"]')).toBeNull();
  });

  it("useSeo não injeta Meta Pixel/Clarity; o <head> ainda é aplicado", async () => {
    render(<Page />);
    await waitFor(() => expect(document.title).toBe("FAQ"));
    await vi.advanceTimersByTimeAsync(10);
    expect(document.head.querySelector("[data-seo-injected]")).toBeNull();
  });

  it("MetaPixel não dispara PageView", () => {
    const fbq = vi.fn();
    (window as W).fbq = fbq;
    render(<MetaPixel />);
    window.history.pushState(null, "", "/portfolio");
    window.dispatchEvent(new Event("lovable:navigate"));
    expect(fbq).not.toHaveBeenCalled();
  });

  it("404 aberta no iframe não vira hit em seo_404_log", async () => {
    await logNotFound("/rota-auditada-inexistente");
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
