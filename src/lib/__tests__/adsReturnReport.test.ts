import { describe, expect, it } from "vitest";
import { summarizeAdsReturn } from "@/lib/adsReturnReport";

const ad = (id: string, objetivo: string | null, utm_campaign = "sea_investidor") =>
  ({ id, objetivo, gclid: "g", utm_source: "google", utm_medium: "cpc", utm_campaign });

describe("retorno real do Google Ads", () => {
  it("peso médio usa só os confirmados: 5.000 e 1.000 dão 3.000", () => {
    const leads = [ad("a", "Short stay"), ad("b", "Moradia"), ad("c", "Short stay")];
    const [row] = summarizeAdsReturn(leads, new Set(["a", "b"]), new Set(["a", "b", "c"]), []);
    expect(row).toMatchObject({ leads: 3, confirmed: 2, avgWeight: 3000 });
  });

  it("valor real soma só o total do CRM e contrato sem valor não é estimado", () => {
    const [row] = summarizeAdsReturn([ad("a", "Short stay"), ad("b", "Moradia")], new Set(["a", "b"]), new Set(["a", "b"]),
      [{ lead_id: "a", total: 71850 }, { lead_id: "b", total: null }]);
    expect(row).toMatchObject({ realValue: 71850, withValue: 1, withoutValue: 1 });
  });

  it("sem leitura dos contratos o valor fica indisponível, nunca zero", () => {
    const [row] = summarizeAdsReturn([ad("a", "Short stay")], new Set(["a"]), new Set(["a"]), null);
    expect(row.realValue).toBeNull();
  });

  it("lead sem leitura do CRM não conta como confirmado e lead sem anúncio fica fora", () => {
    const rows = summarizeAdsReturn([ad("a", "Short stay"), { id: "d", objetivo: null, gclid: null, utm_source: null, utm_medium: null, utm_campaign: null }], new Set(), new Set(), []);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ confirmed: 0, unchecked: 1, avgWeight: null });
  });
});
