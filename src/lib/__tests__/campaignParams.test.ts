import { describe, it, expect, beforeEach } from "vitest";
import { carryCampaignParams, resolveLeadAttribution } from "../campaignParams";
import { navigate } from "../useHashRoute";

describe("carryCampaignParams", () => {
  it("anexa utm/gclid/fbclid da URL atual ao destino interno", () => {
    expect(carryCampaignParams("/orcamento", "?utm_source=meta&utm_medium=cpc&gclid=abc")).toBe(
      "/orcamento?utm_source=meta&utm_medium=cpc&gclid=abc",
    );
  });

  it("preserva query e hash já existentes no destino", () => {
    expect(carryCampaignParams("/faq?x=1#top", "?utm_source=ig")).toBe("/faq?x=1&utm_source=ig#top");
  });

  it("preserva objetivo do destino ao acrescentar parâmetros de campanha", () => {
    expect(
      carryCampaignParams(
        "/orcamento?objetivo=short-stay",
        "?utm_source=meta&utm_campaign=studios",
      ),
    ).toBe("/orcamento?objetivo=short-stay&utm_source=meta&utm_campaign=studios");
  });

  it("não sobrescreve quando o destino já tem parâmetro de campanha", () => {
    expect(carryCampaignParams("/orcamento?utm_source=qr", "?utm_source=meta")).toBe(
      "/orcamento?utm_source=qr",
    );
  });

  it("ignora parâmetros que não são de campanha e rotas admin", () => {
    expect(carryCampaignParams("/faq", "?ref=x&foo=bar")).toBe("/faq");
    expect(carryCampaignParams("/admin/login", "?utm_source=meta")).toBe("/admin/login");
    expect(carryCampaignParams("/faq", "")).toBe("/faq");
  });
});

describe("navigate() carrega parâmetros de campanha", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/?utm_source=meta&utm_campaign=set26");
  });

  it("/ → /orcamento mantém os UTMs na URL", () => {
    navigate("/orcamento");
    expect(window.location.pathname).toBe("/orcamento");
    expect(new URLSearchParams(window.location.search).get("utm_source")).toBe("meta");
    expect(new URLSearchParams(window.location.search).get("utm_campaign")).toBe("set26");
  });

  it("rotas admin não recebem UTM", () => {
    navigate("/admin/login");
    expect(window.location.search).toBe("");
  });
});

describe("resolveLeadAttribution", () => {
  const base = { currentPath: "/orcamento" };

  it("URL atual tem precedência", () => {
    const r = resolveLeadAttribution({
      ...base,
      search: "?utm_source=url",
      sessionUtm: { utm_source: "sessao" },
      firstUtm: { utm_source: "primeiro" },
    });
    expect(r.utm_source).toBe("url");
  });

  it("sem UTM na URL, usa last-touch da sessão; depois first-touch", () => {
    expect(
      resolveLeadAttribution({ ...base, search: "", sessionUtm: { utm_source: "sessao", utm_medium: "cpc" }, firstUtm: { utm_source: "primeiro" } }).utm_source,
    ).toBe("sessao");
    expect(resolveLeadAttribution({ ...base, search: "", sessionUtm: null, firstUtm: { utm_source: "primeiro" } }).utm_source).toBe("primeiro");
  });

  it("sem nada, devolve nulos e landing_path = página atual", () => {
    const r = resolveLeadAttribution({ ...base, search: "" });
    expect(r).toEqual({
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null,
      first_utm_source: null,
      first_utm_medium: null,
      first_utm_campaign: null,
      gclid: null,
      fbclid: null,
      referrer: null,
      landing_path: "/orcamento",
    });
  });

  it("termo e conteúdo: os da URL; sem eles, os da mesma origem da UTM escolhida", () => {
    const daUrl = resolveLeadAttribution({
      ...base,
      search: "?utm_source=meta&utm_term=studio&utm_content=video-a",
      sessionUtm: { utm_source: "sessao", utm_term: "outro" },
    });
    expect([daUrl.utm_term, daUrl.utm_content]).toEqual(["studio", "video-a"]);

    const daSessao = resolveLeadAttribution({
      ...base,
      search: "",
      sessionUtm: { utm_source: "sessao", utm_term: "reforma", utm_content: "carrossel" },
      firstUtm: { utm_source: "primeiro", utm_term: "antigo" },
    });
    expect([daSessao.utm_source, daSessao.utm_term, daSessao.utm_content]).toEqual(["sessao", "reforma", "carrossel"]);

    // Fonte na URL sem termo: não mistura com o termo guardado da sessão.
    const semTermo = resolveLeadAttribution({
      ...base,
      search: "?utm_source=meta",
      sessionUtm: { utm_source: "sessao", utm_term: "outro" },
    });
    expect(semTermo.utm_term).toBeNull();
  });

  it("1º toque vem só do que o tracker guardou para o visitante", () => {
    const r = resolveLeadAttribution({
      ...base,
      search: "?utm_source=meta&utm_medium=cpc&utm_campaign=set26",
      firstUtm: { utm_source: "google", utm_medium: "organic" },
    });
    expect([r.utm_source, r.first_utm_source, r.first_utm_medium, r.first_utm_campaign]).toEqual([
      "meta",
      "google",
      "organic",
      null,
    ]);
    expect(resolveLeadAttribution({ ...base, search: "?utm_source=meta" }).first_utm_source).toBeNull();
  });

  it("clique de anúncio: URL atual tem precedência sobre o guardado", () => {
    const guardado = { gclid: "Cj0guardado", fbclid: "IwARguardado" };
    const r = resolveLeadAttribution({ ...base, search: "?fbclid=IwARnovo", clickIds: guardado });
    expect(r.fbclid).toBe("IwARnovo");
    expect(r.gclid).toBe("Cj0guardado");
    expect(resolveLeadAttribution({ ...base, search: "", clickIds: null }).gclid).toBeNull();
  });

  it("landing_path e referrer vêm do que foi persistido na sessão quando existem", () => {
    const r = resolveLeadAttribution({ ...base, search: "", landingPath: "/", referrer: "", referrerHost: "instagram.com" });
    expect(r.landing_path).toBe("/");
    expect(r.referrer).toBe("instagram.com");
  });
});
