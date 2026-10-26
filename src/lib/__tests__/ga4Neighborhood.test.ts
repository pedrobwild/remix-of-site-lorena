import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initGa4, trackEvent } from "@/lib/ga4";

vi.mock("@/lib/whenIdle", () => ({ ensureGoogleTagScript: vi.fn() }));
const gtag = vi.fn();
type TaggedWindow = Window & { gtag?: typeof gtag; __bewildGa4Inited?: boolean };
beforeEach(() => {
  gtag.mockClear();
  localStorage.clear();
  window.history.replaceState({}, "", "/reforma/vila-olimpia");
  const w = window as TaggedWindow;
  delete w.__bewildGa4Inited;
  w.gtag = gtag;
});
afterEach(() => {
  delete (window as TaggedWindow).gtag;
  delete (window as TaggedWindow).__bewildGa4Inited;
});
describe("GA4 por bairro", () => {
  it("mede CTA com categoria da página de Vila Olímpia", () => {
    localStorage.setItem("bewild_cookie_consent_v2", "accepted");
    initGa4();
    trackEvent("cta_click", { cta: "orcamento" });
    expect(gtag).toHaveBeenCalledWith("event", "cta_click", expect.objectContaining({ imovel_bairro: "vila_olimpia" }));
  });
  it("busca normalizada não transmite endereço livre", () => {
    localStorage.setItem("bewild_cookie_consent_v2", "accepted");
    initGa4();
    trackEvent("search", { search_type: "bairro", search_term: "Pinheiros" });
    trackEvent("search", { search_type: "bairro", search_term: "Rua Exemplo, 123" });
    expect(gtag.mock.calls.filter(([type, name]) => type === "event" && name === "search")).toHaveLength(1);
    expect(gtag).toHaveBeenCalledWith("event", "search", expect.objectContaining({ search_term: "pinheiros", imovel_bairro: "pinheiros" }));
  });
  it("não mede bairro sem consentimento ou após recusar", () => {
    initGa4();
    trackEvent("search", { search_type: "bairro", search_term: "Brooklin" });
    expect(gtag).not.toHaveBeenCalled();
    localStorage.setItem("bewild_cookie_consent_v2", "accepted");
    initGa4();
    gtag.mockClear();
    localStorage.setItem("bewild_cookie_consent_v2", "declined");
    trackEvent("cta_click", { cta: "orcamento" });
    expect(gtag).not.toHaveBeenCalled();
  });
});