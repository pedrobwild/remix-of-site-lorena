import { describe, expect, it } from "vitest";
import { summarizeLeadValues } from "@/lib/leadValueReport";

const google = { gclid: "g", utm_source: "google", utm_medium: "cpc", utm_campaign: "sea_investidor", utm_content: null };
const direct = { utm_campaign: null, utm_content: null };

describe("valor real dos leads", () => {
  it("soma só o valor devolvido pelo CRM, por variante e origem", () => {
    const rows = summarizeLeadValues(
      [{ id: "a", ...google }, { id: "b", ...google }, { id: "c", ...direct }],
      [{ lead_id: "a", total: 71850 }, { lead_id: "b", total: 50000 }],
    );
    const g = rows.find(r => r.origin === "Google Ads")!;
    expect(g).toMatchObject({ variant: "investidor", leads: 2, contracts: 2, total: 121850 });
    expect(rows.find(r => r.origin !== "Google Ads")).toMatchObject({ variant: "sem-atribuicao", contracts: 0, total: 0 });
  });

  it("contrato sem valor não é estimado", () => {
    const [row] = summarizeLeadValues([{ id: "a", ...google }], [{ lead_id: "a", total: null }]);
    expect(row).toMatchObject({ contracts: 1, withValue: 0, withoutValue: 1, total: 0 });
  });
});
