/**
 * Home publica o WebSite do Radar Bewild no HTML do servidor (pedido do Pedro,
 * 18/11/2026), com os mesmos campos do nó que o próprio Radar publica
 * (WEBSITE_JSONLD em src/lib/seoJsonLd.ts do shortstay-guide). Mudou lá?
 * Mude RADAR_WEBSITE_NODE e este teste juntos.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: () => new Promise(() => {}),
    from: () => ({ select: () => new Promise(() => {}) }),
    auth: { getSession: () => new Promise(() => {}), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) },
    functions: { invoke: () => new Promise(() => {}) },
  },
}));

import { Route } from "@/routes/index";
import { ORG_JSONLD } from "@/lib/orgJsonLd";

type Head = { scripts?: Array<{ type?: string; children?: string }> };

const homeHead = () =>
  (Route.options.head as (ctx: unknown) => Head)({ loaderData: undefined, params: {}, match: {}, matches: [] });

describe("home: Radar Bewild no JSON-LD", () => {
  it("sai um WebSite do Radar publicado pela #org", () => {
    const ld = (homeHead().scripts ?? []).filter((s) => s.type === "application/ld+json").map((s) => JSON.parse(s.children ?? ""));
    const radar = ld.filter((n) => n["@id"] === "https://radarbewild.com.br/#website");
    expect(radar).toHaveLength(1);
    expect(radar[0]).toEqual({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://radarbewild.com.br/#website",
      name: "Radar Bewild",
      alternateName: ["Radar Bewild — guia do investidor em studios para short stay"],
      description:
        "Dados de diária e ocupação por bairro, comparador, mapa e simulador de receita para studios no Airbnb em São Paulo.",
      url: "https://radarbewild.com.br/",
      inLanguage: "pt-BR",
      publisher: { "@id": "https://bewild.com.br/#org" },
    });
  });

  it("o publisher aponta para a Organization do grafo global", () => {
    const graph = JSON.parse(ORG_JSONLD)["@graph"] as Array<Record<string, unknown>>;
    expect(graph.some((n) => n["@id"] === "https://bewild.com.br/#org" && n["@type"] === "Organization")).toBe(true);
  });

  it("o grafo global continua sem o Radar (pedido é só a home)", () => {
    expect(ORG_JSONLD).not.toContain("radarbewild.com.br");
  });
});
