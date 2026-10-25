import { beforeEach, describe, expect, it, vi } from "vitest";
import { ARRIVAL_DESTINATION, reportGoogleAdsArrival } from "../googleAdsArrival";
describe("chegada por anúncio", () => {
  const gtag = vi.fn();
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); gtag.mockClear(); Object.assign(window, { gtag }); window.history.replaceState(null, "", "/orcamento?gclid=click_real_123"); });
  it("envia uma chegada por clique apenas após aceite, sem identificação do cliente", () => {
    expect(reportGoogleAdsArrival("AW-16893787587")).toBe(false);
    localStorage.setItem("bewild_cookie_consent_v2", "accepted");
    expect(reportGoogleAdsArrival("AW-16893787587")).toBe(true);
    expect(gtag).toHaveBeenCalledWith("set", "user_data", null);
    expect(gtag).toHaveBeenCalledWith("event", "conversion", expect.objectContaining({ send_to: ARRIVAL_DESTINATION }));
    expect(reportGoogleAdsArrival("AW-16893787587")).toBe(false);
  });
  it("não mede UTMs artificiais nem navegação sem identificador de clique", () => {
    localStorage.setItem("bewild_cookie_consent_v2", "accepted");
    window.history.replaceState(null, "", "/orcamento?utm_source=google&utm_medium=cpc");
    expect(reportGoogleAdsArrival("AW-16893787587")).toBe(false);
    expect(gtag).not.toHaveBeenCalled();
  });
  it("recusa, painel e outra conta nunca enviam", () => {
    localStorage.setItem("bewild_cookie_consent_v2", "declined");
    expect(reportGoogleAdsArrival("AW-16893787587")).toBe(false);
    localStorage.setItem("bewild_cookie_consent_v2", "accepted");
    expect(reportGoogleAdsArrival("AW-123456789")).toBe(false);
    window.history.replaceState(null, "", "/admin/leads?gclid=click_real_123");
    expect(reportGoogleAdsArrival("AW-16893787587")).toBe(false);
    expect(gtag).not.toHaveBeenCalled();
  });
});