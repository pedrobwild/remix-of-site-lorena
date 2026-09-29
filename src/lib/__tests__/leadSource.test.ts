import { describe, expect, it } from "vitest";
import { leadCanal } from "@/lib/leadSource";

describe("leadCanal", () => {
  it("clique de anúncio vence tudo", () => {
    expect(leadCanal({ gclid: "x", utm_source: "facebook" })).toBe("google_ads");
    expect(leadCanal({ fbclid: "y" })).toBe("meta");
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
