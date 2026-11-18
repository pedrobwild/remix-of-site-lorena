import { describe, expect, it } from "vitest";
import { isTestLead, leadCanal } from "@/lib/leadSource";

describe("leadCanal", () => {
  it("clique de anúncio vence tudo", () => {
    expect(leadCanal({ gclid: "x", utm_source: "facebook" })).toBe("google_ads");
    expect(leadCanal({ fbclid: "y", utm_source: "fb", utm_medium: "paid_social" })).toBe("meta");
    expect(leadCanal({ fbclid: "y", utm_source: "an", utm_medium: "paid" })).toBe("meta");
  });
  it("fbclid sem UTM é rede social orgânica (post ou bio), não anúncio", () => {
    expect(leadCanal({ fbclid: "y" })).toBe("social");
    expect(leadCanal({ fbclid: "y", utm_source: "instagram", utm_medium: "bio" })).toBe("social");
  });
  it("UTM paga", () => {
    expect(leadCanal({ utm_source: "google", utm_medium: "cpc" })).toBe("google_ads");
    expect(leadCanal({ utm_source: "instagram", utm_medium: "paid" })).toBe("meta");
    expect(leadCanal({ utm_source: "instagram", utm_medium: "bio" })).toBe("social");
  });
  it("referrer de busca é orgânico", () => {
    expect(leadCanal({ referrer: "https://www.google.com/" })).toBe("organico");
  });
  it("sem sinal é direto", () => {
    expect(leadCanal({ referrer: "https://bewild.com.br/faq" })).toBe("direto");
    expect(leadCanal({})).toBe("direto");
  });
});

describe("isTestLead", () => {
  it("campanha, origem ou lead_source com a palavra teste/test", () => {
    expect(isTestLead({ utm_campaign: "teste-qualificacao" })).toBe(true);
    expect(isTestLead({ utm_source: "test" })).toBe(true);
    expect(isTestLead({ lead_source: "form teste" })).toBe(true);
    expect(isTestLead({ name: " Teste " })).toBe(true);
  });
  it("não pega palavra parecida nem lead comum", () => {
    expect(isTestLead({ utm_campaign: "ggl_sea_leads_sp_reforma-studio" })).toBe(false);
    expect(isTestLead({ utm_campaign: "contestado" })).toBe(false);
    expect(isTestLead({ name: "Testemunha Silva" })).toBe(false);
    expect(isTestLead({})).toBe(false);
  });
});
