import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/BwaNav", () => ({ default: () => null }));
vi.mock("@/components/BwaFooter", () => ({ default: () => null }));
vi.mock("@/components/MobileQuoteBar", () => ({ default: () => null }));
vi.mock("@/lib/useSeo", async (original) => ({
  ...(await original<typeof import("@/lib/useSeo")>()), useSeo: () => {},
}));
vi.mock("@/lib/trackCta", () => ({ useCtaClickTracking: () => {} }));

import ServicosPage from "@/pages/ServicosPage";
import { FAQ, MANUTENCAO, SERVICOS, SERVICOS_JSONLD } from "@/content/pages/servicos";

/**
 * Manutenção preventiva em /servicos — Plano Studio Protegido (26/11/2026).
 * Escopo confirmado pelo Pedro: R$ 200 por mês, 4 visitas preventivas por ano,
 * mão de obra incluída, peças à parte, até 6 horas, sem fidelidade, carência
 * de 30 dias para consertos e problema anterior orçado à parte.
 */
describe("/servicos — manutenção preventiva (Plano Studio Protegido)", () => {
  const html = renderToString(createElement(ServicosPage));
  const secao = html.match(/<section[^>]*id="manutencao"[\s\S]*?<\/section>/)?.[0] ?? "";
  const texto = secao.replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

  it("sai no HTML do servidor, depois de Engenharia e antes da galeria, com atalho no menu da página", () => {
    expect(secao).not.toBe("");
    expect(html.indexOf('id="engenharia"')).toBeLessThan(html.indexOf('id="manutencao"'));
    expect(html.indexOf('id="manutencao"')).toBeLessThan(html.indexOf('id="galeria"'));
    expect(html).toContain('href="#manutencao"');
  });

  it("nomeia as três frentes, o preço e as condições aprovadas", () => {
    expect(MANUTENCAO.frentes.map((f) => f.titulo)).toEqual(["Ar-condicionado", "Elétrica", "Hidráulica e vedações"]);
    for (const trecho of [
      "Manutenção preventiva de ar-condicionado, elétrica e hidráulica",
      "R$ 200 por mês", "4 visitas", "uma por trimestre", "Mão de obra", "Até 6 horas", "Sem fidelidade",
    ]) expect(texto).toContain(trecho);
  });

  it("mostra junto do convite o que fica de fora e as duas regras de proteção", () => {
    for (const trecho of [
      "Peças e material são cobrados à parte, sempre com orçamento antes",
      "Carência de 30 dias para chamados de conserto",
      "a visita preventiva vale desde o primeiro dia",
      "Problema que já existia na data da assinatura é orçado à parte",
    ]) expect(texto).toContain(trecho);
  });

  it("mostra a conta da simulação sempre com a nota de que é estimativa", () => {
    expect(MANUTENCAO.simulacao.itens.map((i) => i.valor)).toEqual(["R$ 2.800", "R$ 4.700", "R$ 2.400"]);
    // O valor anual do plano é o preço mensal vezes 12.
    expect(MANUTENCAO.precoMensal * 12).toBe(2400);
    for (const trecho of ["R$ 2.800", "em média", "R$ 4.700", "1 a cada 10 anos", "R$ 2.400"]) expect(texto).toContain(trecho);
    expect(texto).toContain("Estimativa da Bewild");
    expect(texto).toContain("Não é dado de chamados reais");
  });

  it("não publica promessas ainda sem decisão", () => {
    expect(texto).not.toMatch(/24 horas|ilimitad|reembols|economiz/i);
  });

  it("convida pelo WhatsApp, não pelo formulário de reforma", () => {
    const link = secao.match(/<a[^>]*data-cta="servicos-manutencao-whatsapp"[^>]*>/)?.[0] ?? "";
    expect(link).toContain("https://wa.me/");
    expect(link).toContain(encodeURIComponent("Plano Studio Protegido"));
    expect(secao).not.toContain('href="/orcamento"');
  });

  it("FAQ e JSON-LD dizem o mesmo que a página", () => {
    const plano = FAQ.find((f) => f.q === "O que é o Plano Studio Protegido?");
    expect(plano?.a).toContain("R$ 200 por mês");
    expect(FAQ.find((f) => /fidelidade ou carência/.test(f.q))?.a).toContain("carência de 30 dias");
    // A garantia de obra é outro produto e não muda.
    expect(FAQ.find((f) => f.q === "Qual é a garantia?")?.a).toContain("2 chamados de emergência por semestre, atendidos em até 4 horas");

    const catalogo = (SERVICOS_JSONLD[0].hasOfferCatalog as {
      itemListElement: Array<{
        price?: number; priceCurrency?: string; priceSpecification?: { unitCode: string };
        itemOffered: { name: string; url: string };
      }>;
    }).itemListElement;
    expect(catalogo).toHaveLength(SERVICOS.length + 1);
    const oferta = catalogo.at(-1)!;
    expect(oferta.price).toBe(200);
    expect(oferta.priceCurrency).toBe("BRL");
    expect(oferta.priceSpecification?.unitCode).toBe("MON");
    expect(oferta.itemOffered.name).toBe("Plano Studio Protegido");
    expect(oferta.itemOffered.url).toBe("https://bewild.com.br/servicos#manutencao");
  });
});
