import { describe, expect, it } from "vitest";
import { telemetryUrl, telemetryValue } from "@/../supabase/functions/_shared/telemetry-privacy";

describe("Privacidade das métricas", () => {
  it("preserva somente nomes de eventos de anúncios conhecidos, nunca nomes pessoais", () => {
    expect(telemetryValue({ name: "Lead" })).toEqual({ name: "Lead" });
    expect(telemetryValue({ name: "Ana Silva" })).toEqual({});
  });
  it("remove query, fragmento e credenciais da URL", () => {
    expect(telemetryUrl("https://user:pass@example.com/orcamento?email=ana@example.com&token=private#private"))
      .toBe("https://example.com/orcamento");
    expect(telemetryUrl("/orcamento?email=ana@example.com#private")).toBe("/orcamento");
  });
  it("não transmite destinatário nem mensagem dos contatos", () => {
    expect(telemetryUrl("https://wa.me/5511999999999?text=Ana")).toBe("whatsapp:");
    expect(telemetryUrl("mailto:ana@example.com?body=private")).toBe("mailto:");
    expect(telemetryUrl("tel:+5511999999999")).toBe("tel:");
  });
  it("referrer externo conserva só a origem", () => {
    expect(telemetryUrl("https://example.com/pessoa/ana?token=private", true)).toBe("https://example.com");
  });
  it("remove dados privados aninhados sem perder campanha, objetivo e valor", () => {
    expect(telemetryValue({ email: "ana@example.com", token: "private", campaign: "sea_investidor", objetivo: "Short stay", value: 5000,
      nested: { phone: "5511999999999", href: "/orcamento?token=private", label: "ana@example.com" } }))
      .toEqual({ campaign: "sea_investidor", objetivo: "Short stay", value: 5000, nested: { href: "/orcamento", label: "[e-mail]" } });
  });
});