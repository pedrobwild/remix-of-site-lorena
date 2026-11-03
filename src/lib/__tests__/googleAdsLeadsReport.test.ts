import { describe, expect, it } from "vitest";
import { leadCost } from "@/lib/googleAdsLeadsReport";

describe("Custo por lead Google Ads", () => {
  it("divide investimento só pelos pedidos, sem somar qualificação, contrato ou cópia GA4", () => {
    expect(leadCost(1000, [
      { id: "7805140492", name: "Pedido", conversions: 4, allConversions: 5 },
      { id: "7851121159", name: "Qualificado", conversions: 3, allConversions: 3 },
      { id: "7851121162", name: "Contrato", conversions: 1, allConversions: 1 },
      { id: "7808077437", name: "GA4", conversions: 0, allConversions: 5 },
    ])).toEqual({ requests: 5, costPerLead: 200, requestAction: "Pedido" });
  });
  it("não inventa custo por lead sem pedidos atribuídos", () => {
    expect(leadCost(1000, [])).toEqual({ requests: 0, costPerLead: null, requestAction: null });
  });
});