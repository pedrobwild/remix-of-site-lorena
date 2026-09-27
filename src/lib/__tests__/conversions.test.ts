/**
 * Conversões de mídia paga (Fase 1):
 *  - metaPixel.ts: eventos só com aceite e fora do /admin; fila curta até o
 *    Pixel ser injetado; eventID para deduplicar com a API de Conversões;
 *    `_fbp`/`_fbc` (com `_fbc` montado a partir do fbclid quando falta).
 *  - googleAds.ts: conversão com rótulo configurado, conversões otimizadas
 *    (user_data antes do evento) e transaction_id = id do lead.
 *  - conversions.ts: só formulários de cliente viram Lead (com parâmetros
 *    sem dado pessoal); parceiro, incorporadora e indicação viram
 *    SubmitApplication; ViewContent por tipo de página.
 *  - Correspondência avançada manual: dados de quem enviou, normalizados como
 *    na API de Conversões, ANTES do evento; nada sem aceite.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetMetaPixelQueue,
  flushMetaPixelQueue,
  metaUserDataFrom,
  newEventId,
  readMetaBrowserIds,
  registerMetaPixelId,
  setMetaUserData,
  trackMetaCustomEvent,
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
import {
  areaBucket,
  etapaImovel,
  formKeyForPath,
  isAdLeadForm,
  leadSignalParams,
  pageCategoryFor,
  pageContentFor,
  projectSlugFromPath,
  reportContact,
  reportEngaged,
  reportFormStart,
  reportLead,
  reportViewContent,
  slugParam,
} from "../conversions";

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

const accept = () => window.localStorage.setItem("bewild_cookie_consent_v2", "accepted");

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
    window.localStorage.setItem("bewild_cookie_consent_v2", "declined");
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

    // Parceiro, incorporadora e indicação: SubmitApplication, nunca Lead;
    // no Google entram como evento de público (não como conversão).
    reportLead({ eventId: "ev-1", formPath: "/parceiros", method: "parceiros_form" });
    reportLead({ eventId: "ev-1b", formPath: "/parceiros/incorporadoras", method: "incorporadoras_form" });
    reportLead({ eventId: "ev-2", formPath: "/indique-um-amigo", method: "indique_um_amigo_form" });
    reportLead({ eventId: "ev-x", formPath: "/faq", method: "outro" });
    expect(fbq.mock.calls).toEqual([
      ["track", "SubmitApplication", { content_name: "parceiros_form", content_category: "parceiro" }, { eventID: "ev-1" }],
      ["track", "SubmitApplication", { content_name: "incorporadoras_form", content_category: "incorporadora" }, { eventID: "ev-1b" }],
      ["track", "SubmitApplication", { content_name: "indique_um_amigo_form", content_category: "indicacao" }, { eventID: "ev-2" }],
    ]);
    expect(gtag.mock.calls).toEqual([
      ["event", "submit_application", { send_to: "AW-123456789", content_name: "parceiros_form", content_category: "parceiro" }],
      [
        "event",
        "submit_application",
        { send_to: "AW-123456789", content_name: "incorporadoras_form", content_category: "incorporadora" },
      ],
      ["event", "submit_application", { send_to: "AW-123456789", content_name: "indique_um_amigo_form", content_category: "indicacao" }],
    ]);
    fbq.mockClear();
    gtag.mockClear();

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
    expect(gtag.mock.calls).toEqual([
      [
        "event",
        "conversion",
        { send_to: "AW-123456789/Contato01", content_name: "footer-whatsapp", content_category: "whatsapp" },
      ],
      ["event", "contact", { send_to: "AW-123456789", content_name: "link", content_category: "email" }],
    ]);
  });

  it("ViewContent com o slug do projeto, espelhado no Google como view_item", () => {
    accept();
    const fbq = vi.fn();
    const gtag = vi.fn();
    w.fbq = fbq;
    w.gtag = gtag;
    configureGoogleAds({ id: "AW-123456789" });
    reportViewContent("studio-pinheiros");
    expect(fbq).toHaveBeenCalledWith("track", "ViewContent", {
      content_type: "product",
      content_ids: ["studio-pinheiros"],
      content_category: "projeto",
    });
    expect(gtag).toHaveBeenCalledWith("event", "view_item", {
      send_to: "AW-123456789",
      items: [{ id: "studio-pinheiros" }],
      content_category: "projeto",
    });
    expect(projectSlugFromPath("/portfolio/studio-pinheiros")).toBe("studio-pinheiros");
    expect(projectSlugFromPath("/portfolio")).toBeNull();
    expect(projectSlugFromPath("/admin/projetos/x")).toBeNull();
  });
});

describe("sinais para públicos", () => {
  it("parâmetros do Lead: objetivo, faixa de m², etapa do imóvel e se mora em SP — sem dado pessoal", () => {
    expect(slugParam("Locação tradicional")).toBe("locacao_tradicional");
    expect(slugParam("Parceria comercial — Corretor autônomo")).toBe("parceria_comercial_corretor_autonomo");
    expect(slugParam("  ")).toBeNull();
    expect([areaBucket(28), areaBucket(32.5), areaBucket(60), areaBucket(100), areaBucket(34800)]).toEqual([
      "ate_30",
      "31_45",
      "46_70",
      "71_100",
      "acima_100",
    ]);
    expect(areaBucket(0)).toBeNull();
    expect(areaBucket(null)).toBeNull();
    expect([etapaImovel("Sim"), etapaImovel("Ainda não"), etapaImovel("Estou comprando"), etapaImovel(null)]).toEqual([
      "com_chaves",
      "sem_chaves",
      "comprando",
      null,
    ]);
    expect(leadSignalParams({ objetivo: "Short stay", areaM2: 32.5, chaves: "Estou comprando", livesInSp: false })).toEqual({
      objetivo: "short_stay",
      faixa_m2: "31_45",
      etapa_imovel: "comprando",
      mora_em_sp: false,
    });
    expect(leadSignalParams({})).toEqual({});

    accept();
    const fbq = vi.fn();
    w.fbq = fbq;
    reportLead({
      eventId: "ev-9",
      formPath: "/o",
      method: "lp_obra_form",
      objetivo: "Moradia",
      areaM2: 80,
      chaves: "Sim",
      livesInSp: true,
    });
    expect(fbq).toHaveBeenCalledWith(
      "track",
      "Lead",
      {
        content_name: "lp_obra_form",
        content_category: "/o",
        objetivo: "moradia",
        faixa_m2: "71_100",
        etapa_imovel: "com_chaves",
        mora_em_sp: true,
      },
      { eventID: "ev-9" },
    );
  });

  it("conversão do Google leva os mesmos sinais do Lead e o nome no user_data", () => {
    accept();
    const gtag = vi.fn();
    w.gtag = gtag;
    configureGoogleAds({ id: "AW-123456789", leadLabel: "LeadLabel1" });
    reportLead({
      eventId: "ev-12",
      formPath: "/orcamento",
      method: "orcamento_form",
      email: "ana@exemplo.com",
      phoneDigits: "11912345678",
      name: "Ana Souza",
      objetivo: "Short stay",
      areaM2: 32.5,
      chaves: "Sim",
      livesInSp: true,
    });
    expect(gtag.mock.calls).toEqual([
      [
        "set",
        "user_data",
        {
          email: "ana@exemplo.com",
          phone_number: "+5511912345678",
          address: [{ first_name: "ana", last_name: "souza", country: "br" }],
        },
      ],
      [
        "event",
        "conversion",
        {
          send_to: "AW-123456789/LeadLabel1",
          transaction_id: "ev-12",
          objetivo: "short_stay",
          faixa_m2: "31_45",
          etapa_imovel: "com_chaves",
          mora_em_sp: true,
        },
      ],
    ]);
  });

  it("form_start e visitante_engajado espelham no Google; sem aceite, nada sai", () => {
    const gtag = vi.fn();
    w.gtag = gtag;
    configureGoogleAds({ id: "AW-123456789" });
    reportFormStart("orcamento");
    reportEngaged("tempo", "/");
    expect(gtag).not.toHaveBeenCalled(); // sem aceite

    accept();
    reportFormStart("orcamento");
    reportEngaged("rolagem", "/portfolio/studio-a");
    expect(gtag.mock.calls).toEqual([
      ["event", "form_start", { send_to: "AW-123456789", content_category: "orcamento" }],
      ["event", "visitante_engajado", { send_to: "AW-123456789", motivo: "rolagem", content_category: "projeto" }],
    ]);
  });

  it("correspondência avançada: normaliza como a API de Conversões e vai ANTES do Lead", () => {
    expect(metaUserDataFrom({ email: " Ana@Exemplo.COM ", phoneDigits: "11912345678", name: "Ána Maria de Souza" })).toEqual({
      em: "ana@exemplo.com",
      ph: "5511912345678",
      fn: "ana",
      ln: "souza",
      country: "br",
    });
    expect(metaUserDataFrom({ email: "sem-arroba", phoneDigits: "123", name: "Ana" })).toBeNull();
    expect(metaUserDataFrom({ phoneDigits: "11912345678" })).toEqual({ ph: "5511912345678", country: "br" });

    accept();
    registerMetaPixelId("644216424824915");
    const fbq = vi.fn();
    w.fbq = fbq;
    reportLead({
      eventId: "ev-10",
      formPath: "/orcamento",
      method: "orcamento_form",
      email: "ana@exemplo.com",
      phoneDigits: "11912345678",
      name: "Ana Souza",
    });
    expect(fbq.mock.calls[0]).toEqual([
      "init",
      "644216424824915",
      { em: "ana@exemplo.com", ph: "5511912345678", fn: "ana", ln: "souza", country: "br" },
    ]);
    expect(fbq.mock.calls[1][0]).toBe("track");
    expect(fbq.mock.calls[1][1]).toBe("Lead");
  });

  it("correspondência avançada: nada sem aceite ou no /admin; antes do Pixel, sai na injeção antes da fila", () => {
    const fbq = vi.fn();
    registerMetaPixelId("644216424824915");
    w.fbq = fbq;
    expect(setMetaUserData(metaUserDataFrom({ email: "a@b.co" }))).toBe("blocked");
    accept();
    window.history.replaceState(null, "", "/admin/leads");
    expect(setMetaUserData(metaUserDataFrom({ email: "a@b.co" }))).toBe("blocked");
    expect(fbq).not.toHaveBeenCalled();

    window.history.replaceState(null, "", "/orcamento");
    delete w.fbq;
    __resetMetaPixelQueue();
    expect(setMetaUserData(metaUserDataFrom({ email: "a@b.co" }))).toBe("queued");
    expect(trackMetaEvent("Lead", { content_name: "x" }, { eventId: "ev-11" })).toBe("queued");
    expect(trackMetaCustomEvent("IniciouFormulario", { content_category: "orcamento" })).toBe("queued");
    const later = vi.fn();
    w.fbq = later;
    registerMetaPixelId("644216424824915"); // o que injectMetaPixel faz antes do flush
    flushMetaPixelQueue();
    expect(later.mock.calls).toEqual([
      ["init", "644216424824915", { em: "a@b.co", country: "br" }],
      ["track", "Lead", { content_name: "x" }, { eventID: "ev-11" }],
      ["trackCustom", "IniciouFormulario", { content_category: "orcamento" }],
    ]);
  });

  it("ViewContent e categorias por página; formulários conhecidos", () => {
    expect(pageContentFor("/portfolio/studio-a")).toEqual({ category: "projeto", id: "studio-a" });
    expect(pageContentFor("/conteudos/quanto-custa/")).toEqual({ category: "conteudo", id: "quanto-custa" });
    expect(pageContentFor("/guia-do-investidor")).toEqual({ category: "guia", id: "guia-do-investidor" });
    expect(pageContentFor("/reforma-de-apartamento-sao-paulo")).toEqual({ category: "servico", id: "reforma-apartamento" });
    expect(pageContentFor("/faq")).toBeNull();
    expect(pageContentFor("/admin/projetos")).toBeNull();
    expect(formKeyForPath("/orcamento")).toBe("orcamento");
    expect(formKeyForPath("/parceiros/incorporadoras/")).toBe("incorporadoras");
    expect(formKeyForPath("/faq")).toBeNull();
    expect([pageCategoryFor("/"), pageCategoryFor("/contato"), pageCategoryFor("/marcenaria"), pageCategoryFor("/faq")]).toEqual([
      "home",
      "formulario",
      "servico",
      "outra",
    ]);
  });
});
