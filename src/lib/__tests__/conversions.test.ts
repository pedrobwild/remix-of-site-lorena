/**
 * Conversões de mídia paga (Fase 1):
 *  - metaPixel.ts: eventos só com aceite e fora do /admin; fila curta até o
 *    Pixel ser injetado; eventID para deduplicar com a API de Conversões;
 *    `_fbp`/`_fbc` (com `_fbc` montado a partir do fbclid quando falta).
 *  - googleAds.ts: conversão com rótulo configurado, conversões otimizadas
 *    (user_data antes do evento) e transaction_id = id do lead.
 *  - conversions.ts: só formulários de cliente viram Lead.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetMetaPixelQueue,
  flushMetaPixelQueue,
  newEventId,
  readMetaBrowserIds,
  trackMetaEvent,
} from "../metaPixel";
import {
  __resetGoogleAds,
  brPhoneToE164,
  configureGoogleAds,
  getGoogleAdsConfig,
  trackGoogleAdsConversion,
  validAdsLabel,
} from "../googleAds";
import { isAdLeadForm, projectSlugFromPath, reportContact, reportLead, reportViewContent } from "../conversions";

type W = Window & { fbq?: unknown; gtag?: unknown };
const w = window as W;

function clearCookies() {
  for (const c of document.cookie.split(";")) {
    const name = c.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
}

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/orcamento");
  __resetMetaPixelQueue();
  __resetGoogleAds();
  delete w.fbq;
  delete w.gtag;
  clearCookies();
});

afterEach(() => {
  delete w.fbq;
  delete w.gtag;
  clearCookies();
});

const accept = () => window.localStorage.setItem("lal_cookie_consent", "accepted");

describe("metaPixel.trackMetaEvent", () => {
  it("sem aceite ou no /admin: nada sai nem entra na fila", () => {
    const fbq = vi.fn();
    w.fbq = fbq;
    expect(trackMetaEvent("Lead", { a: 1 }, { eventId: "ev-1" })).toBe("blocked");
    accept();
    window.history.replaceState(null, "", "/admin/leads");
    expect(trackMetaEvent("Contact")).toBe("blocked");
    delete w.fbq;
    flushMetaPixelQueue();
    expect(fbq).not.toHaveBeenCalled();
  });

  it("com aceite e Pixel no ar: track com eventID no 4º argumento", () => {
    accept();
    const fbq = vi.fn();
    w.fbq = fbq;
    expect(trackMetaEvent("Lead", { content_name: "orcamento_form" }, { eventId: "ev-123" })).toBe("sent");
    expect(fbq).toHaveBeenCalledWith("track", "Lead", { content_name: "orcamento_form" }, { eventID: "ev-123" });
    trackMetaEvent("Contact", { content_name: "link" });
    expect(fbq).toHaveBeenLastCalledWith("track", "Contact", { content_name: "link" });
  });

  it("antes do Pixel existir, espera na fila e sai na injeção (na ordem)", () => {
    accept();
    expect(trackMetaEvent("ViewContent", { content_ids: ["a"] })).toBe("queued");
    expect(trackMetaEvent("Contact")).toBe("queued");
    const fbq = vi.fn();
    w.fbq = fbq;
    flushMetaPixelQueue();
    expect(fbq.mock.calls).toEqual([
      ["track", "ViewContent", { content_ids: ["a"] }],
      ["track", "Contact", {}],
    ]);
    flushMetaPixelQueue(); // fila já vazia
    expect(fbq).toHaveBeenCalledTimes(2);
  });

  it("aceite retirado antes da injeção: a fila é descartada", () => {
    accept();
    trackMetaEvent("ViewContent");
    window.localStorage.setItem("lal_cookie_consent", "declined");
    const fbq = vi.fn();
    w.fbq = fbq;
    flushMetaPixelQueue();
    expect(fbq).not.toHaveBeenCalled();
  });

  it("fila tem teto (eventos velhos saem primeiro)", () => {
    accept();
    for (let i = 0; i < 25; i++) trackMetaEvent("Contact", { i });
    const fbq = vi.fn();
    w.fbq = fbq;
    flushMetaPixelQueue();
    expect(fbq).toHaveBeenCalledTimes(20);
    expect(fbq.mock.calls[0][2]).toEqual({ i: 5 });
  });
});

describe("metaPixel.readMetaBrowserIds", () => {
  it("lê _fbp e _fbc válidos", () => {
    document.cookie = "_fbp=fb.1.1790000000000.123456789; path=/";
    document.cookie = "_fbc=fb.1.1790000000001.IwAR3abc; path=/";
    expect(readMetaBrowserIds()).toEqual({
      fbp: "fb.1.1790000000000.123456789",
      fbc: "fb.1.1790000000001.IwAR3abc",
    });
  });

  it("sem _fbc, monta a partir do fbclid com o instante em que foi visto", () => {
    expect(readMetaBrowserIds({ fbclid: "IwAR3xyz", fbclidSeenAt: 1_790_000_000_123 })).toEqual({
      fbp: null,
      fbc: "fb.1.1790000000123.IwAR3xyz",
    });
    expect(readMetaBrowserIds({ fbclid: "IwAR3xyz", now: 1_790_000_000_999 }).fbc).toBe("fb.1.1790000000999.IwAR3xyz");
  });

  it("cookie malformado ou fbclid estranho = nulo", () => {
    document.cookie = "_fbp=qualquer-coisa; path=/";
    expect(readMetaBrowserIds({ fbclid: "a b<script>" })).toEqual({ fbp: null, fbc: null });
  });

  it("newEventId gera ids distintos e aceitos pelo servidor", () => {
    const a = newEventId();
    const b = newEventId();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
  });
});

describe("googleAds", () => {
  it("valida ID e rótulos", () => {
    configureGoogleAds({ id: " aw-123456789 ", leadLabel: "AbC-D_efG-h12", contactLabel: "x y" });
    expect(getGoogleAdsConfig()).toEqual({ id: "AW-123456789", leadLabel: "AbC-D_efG-h12", contactLabel: null });
    configureGoogleAds({ id: "AW-12'+alert(1)+'", leadLabel: "AbCdEf" });
    expect(getGoogleAdsConfig()).toBeNull();
    expect(validAdsLabel("AbC-D_efG-h12")).toBe("AbC-D_efG-h12");
    expect(validAdsLabel("abc")).toBeNull();
    expect(brPhoneToE164("11912345678")).toBe("+5511912345678");
    expect(brPhoneToE164("123")).toBeNull();
  });

  it("lead: user_data (e-mail e telefone) ANTES da conversão, com transaction_id", () => {
    accept();
    const gtag = vi.fn();
    w.gtag = gtag;
    configureGoogleAds({ id: "AW-123456789", leadLabel: "LeadLabel1" });
    expect(
      trackGoogleAdsConversion("lead", { transactionId: "ev-9", email: " Ana@Exemplo.com ", phoneDigits: "11912345678" }),
    ).toBe(true);
    expect(gtag.mock.calls).toEqual([
      ["set", "user_data", { email: "ana@exemplo.com", phone_number: "+5511912345678" }],
      ["event", "conversion", { send_to: "AW-123456789/LeadLabel1", transaction_id: "ev-9" }],
    ]);
  });

  it("sem aceite, sem rótulo, sem tag ou no /admin: não envia", () => {
    const gtag = vi.fn();
    w.gtag = gtag;
    configureGoogleAds({ id: "AW-123456789", leadLabel: "LeadLabel1" });
    expect(trackGoogleAdsConversion("lead")).toBe(false); // sem aceite
    accept();
    expect(trackGoogleAdsConversion("contact")).toBe(false); // sem rótulo de contato
    window.history.replaceState(null, "", "/admin");
    expect(trackGoogleAdsConversion("lead")).toBe(false);
    window.history.replaceState(null, "", "/");
    delete w.gtag;
    expect(trackGoogleAdsConversion("lead")).toBe(false);
    expect(gtag).not.toHaveBeenCalled();
  });
});

describe("conversions", () => {
  it("Lead só para formulários de cliente, com o mesmo id no Meta e no Google Ads", () => {
    accept();
    const fbq = vi.fn();
    const gtag = vi.fn();
    w.fbq = fbq;
    w.gtag = gtag;
    configureGoogleAds({ id: "AW-123456789", leadLabel: "LeadLabel1" });

    reportLead({ eventId: "ev-1", formPath: "/parceiros", method: "parceiros_form" });
    reportLead({ eventId: "ev-2", formPath: "/indique-um-amigo", method: "indique_um_amigo_form" });
    expect(fbq).not.toHaveBeenCalled();
    expect(gtag).not.toHaveBeenCalled();

    reportLead({ eventId: "ev-3", formPath: "/orcamento", method: "orcamento_form", email: "a@b.co", phoneDigits: "11912345678" });
    expect(fbq).toHaveBeenCalledWith(
      "track",
      "Lead",
      { content_name: "orcamento_form", content_category: "/orcamento" },
      { eventID: "ev-3" },
    );
    expect(gtag).toHaveBeenLastCalledWith("event", "conversion", {
      send_to: "AW-123456789/LeadLabel1",
      transaction_id: "ev-3",
    });
    expect(isAdLeadForm("/o")).toBe(true);
    expect(isAdLeadForm(null)).toBe(false);
  });

  it("Contact: Meta sempre; Google Ads só WhatsApp/telefone com rótulo", () => {
    accept();
    const fbq = vi.fn();
    const gtag = vi.fn();
    w.fbq = fbq;
    w.gtag = gtag;
    configureGoogleAds({ id: "AW-123456789", contactLabel: "Contato01" });
    reportContact("whatsapp", "footer-whatsapp");
    reportContact("email", "link");
    expect(fbq.mock.calls).toEqual([
      ["track", "Contact", { content_name: "footer-whatsapp", content_category: "whatsapp" }],
      ["track", "Contact", { content_name: "link", content_category: "email" }],
    ]);
    expect(gtag.mock.calls).toEqual([["event", "conversion", { send_to: "AW-123456789/Contato01" }]]);
  });

  it("ViewContent com o slug do projeto", () => {
    accept();
    const fbq = vi.fn();
    w.fbq = fbq;
    reportViewContent("studio-pinheiros");
    expect(fbq).toHaveBeenCalledWith("track", "ViewContent", {
      content_type: "product",
      content_ids: ["studio-pinheiros"],
      content_category: "projeto",
    });
    expect(projectSlugFromPath("/portfolio/studio-pinheiros")).toBe("studio-pinheiros");
    expect(projectSlugFromPath("/portfolio")).toBeNull();
    expect(projectSlugFromPath("/admin/projetos/x")).toBeNull();
  });
});
