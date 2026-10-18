import { describe, expect, it } from "vitest";
import { summarizeButtonClicks, summarizeServiceButtonClicks, type ButtonEvent } from "@/lib/buttonClickReport";
const event = (session_id: string | null, path = "/", cta = "pedido"): ButtonEvent => ({ path, session_id, event_type: "click_cta", value: { cta, label: "Orçamento" } });
describe("relatório de botões", () => {
  it("conta cada clique e deduplica apenas sessões", () => {
    expect(summarizeButtonClicks([event("s1"), event("s1"), event("s2"), event(null)])[0]).toMatchObject({ clicks: 4, sessions: 2 });
  });
  it("separa página e botão", () => {
    expect(summarizeButtonClicks([event("s1"), event("s1", "/orcamento"), event("s1", "/", "outro")])).toHaveLength(3);
  });
  it("não mistura bairro informado, administrador nem eventos sem rótulo", () => {
    expect(summarizeButtonClicks([event("s1", "/admin/seo"), { ...event("s1"), value: { action: "bairro_interesse", bairro_interesse: "Pinheiros" } }, { ...event("s1"), value: null }])).toEqual([]);
  });
  it("mostra contatos sem ler URL privada", () => {
    expect(summarizeButtonClicks([{ ...event("s1"), event_type: "click_whatsapp", value: { href: "https://wa.me/?text=privado" } }])[0]).toMatchObject({ label: "WhatsApp", clicks: 1 });
  });
});

const serviceEvent = (content: string | null, session = "s1", page = "/reforma-de-studio-sao-paulo"): ButtonEvent => ({
  path: page, session_id: session, event_type: "click_cta",
  value: { cta: page.includes("apartamento") ? "servico-reforma-apartamento-sp-topo" : "servico-reforma-studio-sp-topo" },
  utm_source: "google", utm_medium: "cpc", utm_content: content,
});

describe("Peça seu orçamento por variante do Google Ads", () => {
  it.each([
    ["studio-ape-pequeno", "studio"], ["arquitetura-reforma", "arquitetura"],
    ["custo-orcamento", "custo"], ["airbnb-studio", "investidor"], ["outro", "padrao"],
  ])("agrupa %s na variante %s", (content, variant) => {
    expect(summarizeServiceButtonClicks([serviceEvent(content)])[0]).toMatchObject({ variant, clicks: 1, sessions: 1 });
  });
  it("usa a precedência da campanha de investidor", () => {
    expect(summarizeServiceButtonClicks([{ ...serviceEvent("studio-ape-pequeno"), utm_campaign: "sea_investidor" }])[0].variant).toBe("investidor");
  });
  it("separa cada página e variante, conta cliques e deduplica só sessões", () => {
    const rows = summarizeServiceButtonClicks([
      serviceEvent("studio-ape-pequeno"), serviceEvent("studio-ape-pequeno"), serviceEvent("studio-ape-pequeno", "s2"),
      serviceEvent("custo-orcamento"), serviceEvent("studio-ape-pequeno", "s1", "/reforma-de-apartamento-sao-paulo"),
    ]);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ page: "/reforma-de-studio-sao-paulo", variant: "studio", clicks: 3, sessions: 2 });
  });
  it.each([
    { utm_source: null, utm_medium: null }, { utm_source: "google", utm_medium: "organic" },
    { utm_source: "meta", utm_medium: "cpc" },
  ])("não atribui tráfego sem Google Ads: %j", attribution => {
    expect(summarizeServiceButtonClicks([{ ...serviceEvent("studio-ape-pequeno"), ...attribution }])[0].variant).toBe("sem-atribuicao");
  });
  it("exclui CTAs finais, outras páginas e eventos de contato", () => {
    expect(summarizeServiceButtonClicks([
      { ...serviceEvent("studio-ape-pequeno"), value: { cta: "servico-reforma-studio-sp" } },
      { ...serviceEvent("studio-ape-pequeno"), path: "/orcamento" },
      { ...serviceEvent("studio-ape-pequeno"), event_type: "click_whatsapp" },
    ])).toEqual([]);
  });
});