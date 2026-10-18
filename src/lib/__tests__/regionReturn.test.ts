import { describe, expect, it } from "vitest";
import { summarizeRegionReturn } from "../regionReturn";

describe("retorno por região", () => {
  it("conta contrato assinado só com status Contrato fechado, por bairro e campanha", () => {
    const out = summarizeRegionReturn([
      { bairro: "Brás", campaign: "c1", status: "Contrato fechado" },
      { bairro: "brás ", campaign: "c1", status: "Perdido" },
      { bairro: null, campaign: null, status: "CRM indisponível" },
    ]);
    expect(out[0]).toEqual({ bairro: "Brás", campaign: "c1", leads: 2, contratos: 1, semLeitura: 0 });
    expect(out[1]).toEqual({ bairro: "Não informado", campaign: "Sem campanha", leads: 1, contratos: 0, semLeitura: 1 });
  });
});
