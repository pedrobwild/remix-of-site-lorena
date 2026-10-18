import { describe, expect, it } from "vitest";
import { summarizeServiceAds, GOOGLE_ADS_WEIGHTS } from "@/lib/googleAdsServiceReport";

const ads = { utm_source: "google", utm_medium: "cpc", utm_campaign: "sea_investidor", utm_content: null };
const none = { utm_source: null, utm_medium: null, utm_campaign: null, utm_content: null };

describe("Google Ads por página de serviço", () => {
  it("pesos aprovados: R$ 5.000 para aluguel, R$ 1.000 para moradia, sem peso quando não informado", () => {
    const w = Object.fromEntries(GOOGLE_ADS_WEIGHTS.map(x => [x.objetivo, x.weight]));
    expect(w["Short stay"]).toBe(5000);
    expect(w["Moradia"]).toBe(1000);
    expect(w["Não informado"]).toBeNull();
  });

  it("agrupa cliques e pedidos por página, campanha e variante; pedido fora de serviço não entra", () => {
    const rows = summarizeServiceAds(
      [{ path: "/reforma-de-studio-sao-paulo", event_type: "click_cta", session_id: "s1", ...ads },
       { path: "/reforma-de-studio-sao-paulo", event_type: "click_cta", session_id: "s1", ...ads },
       { path: "/portfolio", event_type: "click_cta", session_id: "s2", ...ads }],
      [{ id: "a", landing_path: "/reforma-de-studio-sao-paulo", objetivo: "Short stay", gclid: "x", ...ads },
       { id: "a", landing_path: "/reforma-de-studio-sao-paulo", objetivo: "Short stay", gclid: "x", ...ads },
       { id: "b", landing_path: "/", objetivo: "Moradia", gclid: null, ...none }],
      new Set(["a"]), new Set(["a"]));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ campaign: "sea_investidor", variant: "investidor", clicks: 2, sessions: 1, leads: 1, confirmed: 1, confirmedWeight: 5000 });
  });

  it("pedido sem leitura do CRM fica indisponível, nunca confirmado", () => {
    const [row] = summarizeServiceAds([], [{ id: "c", landing_path: "/reforma-de-apartamento-sao-paulo", objetivo: "Moradia", gclid: null, ...none }], new Set(), new Set());
    expect(row).toMatchObject({ variant: "sem-atribuicao", confirmed: 0, unavailable: 1, confirmedWeight: 0 });
  });
});
