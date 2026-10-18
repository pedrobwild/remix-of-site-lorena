import { describe, expect, it } from "vitest";
import { googleAdsProfileVariables } from "../googleAdsProfileVariables";

describe("categorias de perfil nas conversões do Google Ads", () => {
  it("envia finalidade e bairro conhecidos sem texto livre", () => {
    expect(googleAdsProfileVariables({ bairro: "  CONSOLAÇÃO  ", objetivo: "Short stay", areaM2: 28.21 })).toEqual({
      imovel_bairro: "consolacao", imovel_finalidade: "short_stay", imovel_faixa_m2: "ate_35",
    });
  });
  it.each([[35, "ate_35"], [35.1, "36_60"], [60, "36_60"], [60.1, "acima_60"]])("metragem %s corresponde a %s", (area, expected) => {
    expect(googleAdsProfileVariables({ areaM2: Number(area) }).imovel_faixa_m2).toBe(expected);
  });
  it("ausência não inventa perfil nem idade do imóvel", () => {
    expect(googleAdsProfileVariables({})).toEqual({});
    expect(googleAdsProfileVariables({ areaM2: NaN })).toEqual({});
  });
  it.each(["Pinheiros, Rua Teste 123", "pessoa@exemplo.com", "11912345678", "Bairro não catalogado"])("não transmite entrada livre: %s", (bairro) => {
    expect(googleAdsProfileVariables({ bairro, objetivo: "texto livre" })).toEqual({});
  });
});