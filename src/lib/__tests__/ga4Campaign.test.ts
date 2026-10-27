import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetGa4PageViewDedupe, initGa4, trackEvent, trackPageView } from "@/lib/ga4";

vi.mock("@/lib/whenIdle", () => ({ ensureGoogleTagScript: vi.fn() }));
const gtag = vi.fn();
type TaggedWindow = Window & { gtag?: typeof gtag; __bewildGa4Inited?: boolean };

beforeEach(() => {
  gtag.mockClear();
  localStorage.clear();
  __resetGa4PageViewDedupe();
  window.history.replaceState({}, "", "/orcamento?gclid=abc&utm_source=google&email=a@b.com");
  const w = window as TaggedWindow;
  delete w.__bewildGa4Inited;
  w.gtag = gtag;
});
afterEach(() => {
  delete (window as TaggedWindow).gtag;
  delete (window as TaggedWindow).__bewildGa4Inited;
  __resetGa4PageViewDedupe();
});

describe("Atribuição do GA4 com privacidade", () => {
  it("generate_lead envia 10000 BRL sem alterar outros eventos ou o consentimento", () => {
    trackEvent("generate_lead", { method: "orcamento_form" });
    expect(gtag).not.toHaveBeenCalled();
    localStorage.setItem("bewild_cookie_consent_v2", "accepted");
    initGa4();
    gtag.mockClear();
    trackEvent("generate_lead", { method: "orcamento_form", delivery: "confirmed", value: 5000, currency: "USD" });
    expect(gtag).toHaveBeenCalledWith("event", "generate_lead", expect.objectContaining({
      method: "orcamento_form", delivery: "confirmed", value: 10000, currency: "BRL",
    }));
    trackEvent("cta_click", { value: 25, currency: "BRL" });
    expect(gtag).toHaveBeenLastCalledWith("event", "cta_click", expect.objectContaining({ value: 25, currency: "BRL" }));
    gtag.mockClear();
    localStorage.setItem("bewild_cookie_consent_v2", "declined");
    trackEvent("generate_lead");
    expect(gtag).not.toHaveBeenCalled();
  });
  it("preserva campanha no config, page_view e evento, mas não no caminho ou referrer", () => {
    localStorage.setItem("bewild_cookie_consent_v2", "accepted");
    const origin = window.location.origin;
    const pageLocation = `${origin}/orcamento?gclid=abc&utm_source=google`;
    initGa4();
    trackPageView(window.location.pathname + window.location.search);
    trackEvent("cta_click", { cta: "orcamento" });
    expect(gtag).toHaveBeenCalledWith("config", expect.any(String), expect.objectContaining({ page_location: pageLocation }));
    expect(gtag).toHaveBeenCalledWith("event", "page_view", expect.objectContaining({ page_location: pageLocation, page_path: "/orcamento" }));
    expect(gtag).toHaveBeenCalledWith("event", "cta_click", expect.objectContaining({ page_location: pageLocation, page_referrer: `${origin}/orcamento` }));
    window.history.replaceState({}, "", "/faq");
    trackPageView("/faq");
    expect(gtag).toHaveBeenLastCalledWith("event", "page_view", expect.objectContaining({ page_referrer: `${origin}/orcamento` }));
  });
  it("não envia campanhas antes de aceitar ou depois de recusar", () => {
    initGa4();
    trackPageView("/orcamento");
    trackEvent("cta_click");
    expect(gtag).not.toHaveBeenCalled();
    localStorage.setItem("bewild_cookie_consent_v2", "accepted");
    initGa4();
    gtag.mockClear();
    localStorage.setItem("bewild_cookie_consent_v2", "declined");
    trackPageView("/orcamento");
    trackEvent("cta_click");
    expect(gtag).not.toHaveBeenCalled();
  });
});