import { describe, expect, it } from "vitest";
import { summarizeButtonClicks, type ButtonEvent } from "@/lib/buttonClickReport";
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