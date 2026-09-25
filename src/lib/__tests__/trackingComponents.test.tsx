/**
 * Rastreamento em componentes/hooks:
 *  - trackCta (CORE-17/23): não lança com target = document; clique no
 *    WhatsApp não gera evento interno em dobro (analytics.ts já captura).
 *  - MetaPixel (CORE-01/18): PageView só com aceite, fora do /admin, e por
 *    caminho+query (âncora não conta); ViewContent em projeto e Contact no
 *    clique em WhatsApp/telefone (Fase 1 de conversões).
 *  - ga4 (CORE-06): init não manda page_view; page_view deduplicado.
 *  - CookieBanner (CORE-08/02): ESC só com foco no banner; auditoria sai do clique.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, renderHook } from "@testing-library/react";

const trackEventMock = vi.fn();
vi.mock("@/lib/ga4", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ga4")>("@/lib/ga4");
  return { ...actual, trackEvent: (...a: unknown[]) => trackEventMock(...a) };
});
const trackMock = vi.fn();
const logConsentAuditMock = vi.fn();
vi.mock("@/lib/analytics", async () => {
  const actual = await vi.importActual<typeof import("@/lib/analytics")>("@/lib/analytics");
  return {
    ...actual,
    track: (...a: unknown[]) => trackMock(...a),
    logConsentAudit: (...a: unknown[]) => logConsentAuditMock(...a),
  };
});

import { useCtaClickTracking } from "@/lib/trackCta";
import MetaPixel from "@/components/MetaPixel";
import { __resetMetaPixelQueue, flushMetaPixelQueue } from "@/lib/metaPixel";
import CookieBanner from "@/components/CookieBanner";
import { setConsent, openCookiePreferences } from "@/lib/cookieConsent";

const noNavigation = (e: Event) => e.preventDefault();

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/diagnostico");
  document.body.innerHTML = "";
  trackEventMock.mockReset();
  trackMock.mockReset();
  logConsentAuditMock.mockReset();
  document.addEventListener("click", noNavigation);
});

afterEach(() => {
  cleanup();
  document.removeEventListener("click", noNavigation);
  delete (window as Window & { fbq?: unknown }).fbq;
});

describe("useCtaClickTracking", () => {
  it("clique sintético no document e em nó de texto não lançam", () => {
    renderHook(() => useCtaClickTracking("diagnostico"));
    expect(() => document.dispatchEvent(new MouseEvent("click", { bubbles: true }))).not.toThrow();

    document.body.innerHTML = '<a href="https://wa.me/5511911906183">Falar no WhatsApp</a>';
    const text = document.querySelector("a")!.firstChild as Text;
    const ev = new MouseEvent("click", { bubbles: true, cancelable: true });
    Object.defineProperty(ev, "target", { value: text });
    expect(() => document.dispatchEvent(ev)).not.toThrow();
    expect(trackEventMock).toHaveBeenCalledWith("cta_click", expect.objectContaining({ cta: "whatsapp" }));
  });

  it("WhatsApp/telefone: só o cta_click do GA4 (o evento interno sai de analytics.ts)", () => {
    renderHook(() => useCtaClickTracking("diagnostico"));
    document.body.innerHTML =
      '<a id="w" href="https://wa.me/5511911906183">WhatsApp</a><a id="t" href="tel:+5511911906183">Ligar</a>';
    fireEvent.click(document.getElementById("w")!);
    fireEvent.click(document.getElementById("t")!);
    expect(trackEventMock.mock.calls.map(([, p]) => (p as { cta: string }).cta)).toEqual(["whatsapp", "telefone"]);
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("submit e data-cta: GA4 + click_cta interno", () => {
    renderHook(() => useCtaClickTracking("contato"));
    document.body.innerHTML = '<form><button type="submit">Enviar</button></form><a href="/faq" data-cta="faq">FAQ</a>';
    fireEvent.click(document.querySelector("button")!);
    fireEvent.click(document.querySelector("a")!);
    expect(trackMock.mock.calls.map(([type, p]) => [type, (p as { value: { cta: string } }).value.cta])).toEqual([
      ["click_cta", "enviar-formulario"],
      ["click_cta", "faq"],
    ]);
  });
});

describe("MetaPixel", () => {
  function go(url: string, event = "lovable:navigate") {
    window.history.pushState(null, "", url);
    window.dispatchEvent(new Event(event));
  }

  it("PageView por caminho+query, só com aceite e fora do /admin", () => {
    const fbq = vi.fn();
    (window as Window & { fbq?: unknown }).fbq = fbq;
    window.history.replaceState(null, "", "/");
    render(<MetaPixel />);

    go("/faq"); // sem aceite
    expect(fbq).not.toHaveBeenCalled();

    window.localStorage.setItem("lal_cookie_consent", "accepted");
    go("/portfolio");
    expect(fbq).toHaveBeenCalledTimes(1);
    expect(fbq).toHaveBeenCalledWith("track", "PageView");

    go("/portfolio#projetos", "hashchange"); // âncora: não é página nova
    expect(fbq).toHaveBeenCalledTimes(1);

    go("/admin/leads");
    expect(fbq).toHaveBeenCalledTimes(1);

    window.localStorage.setItem("lal_cookie_consent", "declined"); // retirada
    go("/contato");
    expect(fbq).toHaveBeenCalledTimes(1);
  });

  it("ViewContent: na entrada direta espera o Pixel; na navegação sai junto do PageView", () => {
    __resetMetaPixelQueue();
    window.localStorage.setItem("lal_cookie_consent", "accepted");
    window.history.replaceState(null, "", "/portfolio/studio-a");
    render(<MetaPixel />);

    const fbq = vi.fn();
    (window as Window & { fbq?: unknown }).fbq = fbq;
    flushMetaPixelQueue(); // o que useSeo faz ao injetar o Pixel
    expect(fbq.mock.calls).toEqual([
      ["track", "ViewContent", { content_type: "product", content_ids: ["studio-a"], content_category: "projeto" }],
    ]);

    go("/portfolio/studio-b");
    expect(fbq.mock.calls.slice(1)).toEqual([
      ["track", "PageView"],
      ["track", "ViewContent", { content_type: "product", content_ids: ["studio-b"], content_category: "projeto" }],
    ]);
    go("/portfolio"); // a lista não é projeto
    expect(fbq).toHaveBeenLastCalledWith("track", "PageView");
  });

  it("Contact no clique em WhatsApp/telefone, só com aceite", () => {
    const fbq = vi.fn();
    (window as Window & { fbq?: unknown }).fbq = fbq;
    window.history.replaceState(null, "", "/");
    render(<MetaPixel />);
    const holder = document.createElement("div");
    holder.innerHTML =
      '<a id="w" href="https://wa.me/5511911906183" data-cta="hero">WhatsApp</a><a id="t" href="tel:+5511911906183">Ligar</a><a id="f" href="/faq">FAQ</a>';
    document.body.appendChild(holder);

    fireEvent.click(document.getElementById("w")!); // sem aceite
    expect(fbq).not.toHaveBeenCalled();

    window.localStorage.setItem("lal_cookie_consent", "accepted");
    fireEvent.click(document.getElementById("w")!);
    fireEvent.click(document.getElementById("t")!);
    fireEvent.click(document.getElementById("f")!);
    expect(fbq.mock.calls).toEqual([
      ["track", "Contact", { content_name: "hero", content_category: "whatsapp" }],
      ["track", "Contact", { content_name: "link", content_category: "phone" }],
    ]);
  });
});

describe("GA4 (ga4.ts)", () => {
  it("initGa4 não envia page_view; trackPageView deduplica por caminho+query", async () => {
    const ga4 = await vi.importActual<typeof import("@/lib/ga4")>("@/lib/ga4");
    type G = Window & { dataLayer?: unknown[]; gtag?: unknown; __bewildGa4Inited?: boolean };
    const w = window as G;
    delete w.__bewildGa4Inited;
    delete w.gtag;
    w.dataLayer = [];
    ga4.__resetGa4PageViewDedupe();

    window.history.replaceState(null, "", "/faq");
    ga4.initGa4(); // sem aceite: no-op
    expect(w.__bewildGa4Inited).toBeFalsy();

    window.localStorage.setItem("lal_cookie_consent", "accepted");
    ga4.initGa4();
    const pageViews = () =>
      (w.dataLayer ?? []).filter((a) => (a as IArguments)[0] === "event" && (a as IArguments)[1] === "page_view");
    expect(pageViews()).toHaveLength(0);

    ga4.trackPageView("/faq");
    ga4.trackPageView("/faq"); // re-render / hashchange
    expect(pageViews()).toHaveLength(1);

    window.history.replaceState(null, "", "/portfolio");
    ga4.trackPageView("/portfolio");
    expect(pageViews()).toHaveLength(2);
    const second = pageViews()[1] as IArguments;
    expect(second[2]).toMatchObject({ page_referrer: "http://localhost:3000/faq" });

    window.history.replaceState(null, "", "/admin/leads");
    ga4.trackPageView("/admin/leads");
    expect(pageViews()).toHaveLength(2);

    document.head.querySelectorAll('script[src*="googletagmanager"]').forEach((n) => n.remove());
    delete w.__bewildGa4Inited;
    delete w.gtag;
  });
});

describe("CookieBanner", () => {
  function showBanner() {
    const utils = render(
      <>
        <button id="fora">Fechar lightbox</button>
        <CookieBanner />
      </>,
    );
    act(() => openCookiePreferences());
    return utils;
  }

  it("ESC com o foco FORA do banner não registra recusa (CORE-08)", () => {
    showBanner();
    const outside = document.getElementById("fora")!;
    outside.focus();
    fireEvent.keyDown(outside, { key: "Escape" });
    fireEvent.keyDown(window, { key: "Escape" });
    expect(window.localStorage.getItem("lal_cookie_consent")).toBeNull();
    expect(document.querySelector(".cookie-banner")).not.toBeNull();
  });

  it("ESC com o foco no banner recusa; a auditoria sai do clique/tecla, não do evento", () => {
    showBanner();
    const accept = document.querySelector<HTMLButtonElement>(".cookie-banner__btn--solid")!;
    expect(document.activeElement).toBe(accept);
    fireEvent.keyDown(accept, { key: "Escape" });
    expect(window.localStorage.getItem("lal_cookie_consent")).toBe("declined");
    expect(logConsentAuditMock).toHaveBeenCalledWith("declined", "banner");
    expect(document.querySelector(".cookie-banner")).toBeNull();
  });

  it("mudança vinda de outra aba (storage) não gera registro de auditoria nesta", () => {
    render(<CookieBanner />);
    window.dispatchEvent(
      new StorageEvent("storage", { key: "lal_cookie_consent", oldValue: null, newValue: "accepted" }),
    );
    expect(logConsentAuditMock).not.toHaveBeenCalled();
  });

  it("reabertura pelas preferências registra a origem 'preferences'", () => {
    setConsent("accepted");
    showBanner();
    fireEvent.click(document.querySelector(".cookie-banner__btn--ghost")!);
    expect(logConsentAuditMock).toHaveBeenCalledWith("declined", "preferences");
  });
});
