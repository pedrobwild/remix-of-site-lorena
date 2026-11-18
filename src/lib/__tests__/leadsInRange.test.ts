import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { countLeads } from "@/lib/leadsInRange";

describe("countLeads — pedidos por canal, testes à parte", () => {
  it("separa testes do total e classifica pelo leadCanal", () => {
    const c = countLeads([
      { gclid: "g1" },
      { fbclid: "f", utm_source: "fb", utm_medium: "paid_social" },
      { fbclid: "f" },
      { utm_campaign: "teste-qualificacao", fbclid: "f", utm_source: "fb", utm_medium: "paid" },
      { referrer: "https://www.google.com/" },
    ]);
    expect(c.total).toBe(4);
    expect(c.tests).toBe(1);
    expect(c.byCanal).toEqual({ google_ads: 1, meta: 1, organico: 1, social: 1, direto: 0 });
  });
});
