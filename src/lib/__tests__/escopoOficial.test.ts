import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { ESCOPO_FRASE } from "@/content/escopoOficial";
import org from "@/content/orgBewild.json";
import { LOCAL_NODE, ORG_NODE } from "@/lib/orgJsonLd";

vi.mock("@/components/BwaNav", () => ({ default: () => null }));
vi.mock("@/components/BwaFooter", () => ({ default: () => null }));
vi.mock("@/components/BwaImprensa", () => ({ default: () => null }));
vi.mock("@/components/MobileQuoteBar", () => ({ default: () => null }));
vi.mock("@/components/assistant/RadarAssistant", () => ({ default: () => null }));
vi.mock("@/lib/useSeo", async (original) => ({
  ...(await original<typeof import("@/lib/useSeo")>()), useSeo: () => {},
}));
vi.mock("@/lib/trackCta", () => ({ useCtaClickTracking: () => {} }));

import ServicosPage from "@/pages/ServicosPage";
import ApartamentoPage from "@/pages/ReformaApartamentoSpPage";
import StudioPage from "@/pages/ReformaStudioSpPage";
import FaqPage from "@/pages/FaqPage";
import EscopoPage from "@/pages/EscopoPage";
import { comEscopoOficial, faqPageJsonLd } from "@/content/faqPage";
import type { KbItem } from "@/lib/assistant/assistantEngine";

const OFICIAL = "A Bewild é uma empresa de reforma completa de studios e apartamentos pequenos na cidade de São Paulo, para morar ou para alugar (inclusive no Airbnb), com projeto, obra e marcenaria próprios e acompanhamento da obra a distância. A especialidade são imóveis novos, recém-entregues pela construtora; também atende apartamentos com até 15 anos de uso e até 140 m². Não atende imóveis com mais de 15 anos nem obras fora da capital.";
const paginas = [
  ["/servicos", ServicosPage], ["/reforma-de-apartamento-sao-paulo", ApartamentoPage],
  ["/reforma-de-studio-sao-paulo", StudioPage], ["/faq", FaqPage], ["/escopo", EscopoPage],
] as const;

describe("Escopo oficial D3", () => {
  it("mantém a frase literal aprovada nos dois nós e no JSON compartilhado", () => {
    expect(ESCOPO_FRASE).toBe(OFICIAL);
    expect(ORG_NODE.description).toBe(OFICIAL);
    expect(LOCAL_NODE.description).toBe(OFICIAL);
    expect(org.description).toBe(OFICIAL);
  });
  it("limita os assuntos da Organization à lista aprovada", () => {
    expect(ORG_NODE.knowsAbout).toEqual([
      "Reforma completa de studio", "Reforma de apartamento pequeno", "Reforma de apartamento novo recém-entregue",
      "Reforma de apartamento para Airbnb e short stay", "Marcenaria planejada para imóveis compactos",
      "Reforma turnkey em São Paulo", "Empresa de reforma de apartamento em São Paulo", "Gestão de obra a distância",
    ]);
  });
  it.each(paginas)("%s publica o escopo no texto SSR, sem atendimento ilimitado", (_, Pagina) => {
    const html = renderToString(createElement(Pagina));
    const texto = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ");
    expect(texto).toContain(OFICIAL);
    expect(texto).not.toMatch(/qualquer metragem|reformamos escritórios/i);
  });
  it("modelo e snapshot de llms.txt mantêm a frase e os limites", () => {
    for (const f of ["src/content/llms.txt", "src/content/snapshots/llms.txt"]) {
      const texto = readFileSync(f, "utf8");
      expect(texto).toContain(OFICIAL);
      expect(texto).not.toMatch(/qualquer metragem|reformamos escritórios/i);
    }
  });
  it("os arquivos de atendimento não mantêm as expressões removidas", () => {
    for (const f of ["src/lib/orgJsonLd.ts", "src/content/orgBewild.json", "src/content/faqPage.ts", "src/content/pages/servicos.ts", "src/content/pages/escopo.ts", "src/content/pages/reforma-de-apartamento-sao-paulo.tsx", "src/pages/ReformaStudioSpPage.tsx"]) {
      expect(readFileSync(f, "utf8")).not.toMatch(/qualquer metragem|reformamos escritórios/i);
    }
  });
  it("a resposta carregada do painel e o FAQPage usam o mesmo escopo", () => {
    const kb = [{ id: "regiao", tema: "regiao", pergunta: "Onde vocês atuam?", resposta: "Atendemos qualquer metragem", acoes: [], ordem: 1 }] as KbItem[];
    const normalizado = comEscopoOficial(kb);
    const resposta = normalizado?.[0]?.resposta;
    expect(resposta).toContain(OFICIAL);
    expect(JSON.stringify(faqPageJsonLd(kb))).toContain(resposta ?? "resposta ausente");
    expect(renderToString(createElement(FaqPage, { initialKb: kb }))).toContain(OFICIAL);
    expect(kb[0]?.resposta).toBe("Atendemos qualquer metragem");
  });
  it("preserva a pergunta sobre o escritório-sede mesmo no grupo de região", () => {
    const sede = [{ id: "sede", tema: "regiao", pergunta: "A Bewild tem escritório no Brooklin?", resposta: "Sim, na Rua Pitú, 72.", acoes: [], ordem: 2 }] as KbItem[];
    expect(comEscopoOficial(sede)).toEqual(sede);
  });
});