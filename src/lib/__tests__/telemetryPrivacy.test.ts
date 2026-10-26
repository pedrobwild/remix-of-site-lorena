import { describe, expect, it } from "vitest";
import { telemetryUrl, telemetryUrlWithCampaign, telemetryValue } from "@/../supabase/functions/_shared/telemetry-privacy";

describe("Privacidade das métricas", () => {
  it("preserva gclid e utm_source, removendo o parâmetro email", () => {
    expect(telemetryUrlWithCampaign("https://bewild.com.br/orcamento?gclid=abc&utm_source=google&email=a@b.com"))
      .toBe("https://bewild.com.br/orcamento?gclid=abc&utm_source=google");
  });
  it("mantém URL sem query inalterada", () => {
    expect(telemetryUrlWithCampaign("https://bewild.com.br/orcamento"))
      .toBe("https://bewild.com.br/orcamento");
  });
  it("substitui e-mail no utm_term por marcador", () => {
    const url = new URL(telemetryUrlWithCampaign("https://bewild.com.br/orcamento?utm_term=a%40b.com"));
    expect(url.searchParams.get("utm_term")).toBe("[e-mail]");
  });
  it("preserva exatamente os doze parâmetros permitidos", () => {
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id",
      "gclid", "gbraid", "wbraid", "gad_source", "gad_campaignid", "fbclid"];
    const query = new URLSearchParams(keys.map((key) => [key, "abc"]));
    query.set("token", "private");
    query.set("phone", "5511999999999");
    const url = new URL(telemetryUrlWithCampaign(`https://bewild.com.br/orcamento?${query}`));
    expect([...url.searchParams.keys()]).toEqual(keys);
    expect([...url.searchParams.values()]).toEqual(keys.map(() => "abc"));
  });
  it("mantém as proteções de caminho, credenciais, fragmento e contatos", () => {
    expect(telemetryUrlWithCampaign("https://user:pass@example.com/a@b.com?utm_term=5511999999999#private"))
      .toBe("https://example.com/[e-mail]?utm_term=%5Btelefone%5D");
    expect(telemetryUrlWithCampaign("/orcamento?utm_source=google#private")).toBe("/orcamento?utm_source=google");
    expect(telemetryUrlWithCampaign("https://wa.me/5511999999999?utm_source=google")).toBe("whatsapp:");
    expect(telemetryUrlWithCampaign("mailto:a@b.com?utm_source=google")).toBe("mailto:");
  });
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