import { describe, expect, it } from "vitest";
import { faixaMetragem, summarizeCampaignProfiles } from "../campaignProfiles";

describe("perfis por campanha", () => {
  it("faixas de metragem 35 e 60 m²", () => {
    expect([faixaMetragem(35), faixaMetragem(36), faixaMetragem(60), faixaMetragem(61), faixaMetragem(null)]).toEqual(["Até 35 m²", "36–60 m²", "36–60 m²", "Acima de 60 m²", "Não informado"]);
  });
  it("desqualificado só com status Perdido", () => {
    const out = summarizeCampaignProfiles([
      { bairro: "Brás", areaM2: 85, objetivo: "Moradia", campaign: "c1", status: "Perdido" },
      { bairro: "Brás", areaM2: 20, objetivo: "Moradia", campaign: "c1", status: "Proposta enviada" },
      { bairro: null, areaM2: null, objetivo: null, campaign: "c1", status: "CRM indisponível" },
    ], "finalidade");
    expect(out).toEqual([
      { campaign: "c1", perfil: "Moradia", leads: 2, desqualificados: 1, semLeitura: 0 },
      { campaign: "c1", perfil: "Não informado", leads: 1, desqualificados: 0, semLeitura: 1 },
    ]);
  });
});
