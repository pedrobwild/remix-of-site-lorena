import { describe, expect, it } from "vitest";
import { MANUTENCAO_JSONLD } from "@/content/pages/manutencao";
import { MANUTENCAO } from "@/content/pages/servicos";

describe("oferta da página própria de manutenção", () => {
  it("mantém o preço mensal aprovado de R$ 200 na oferta pública", () => {
    const service = MANUTENCAO_JSONLD[0];
    expect(service).toBeDefined();
    const offer = service?.['offers'] as { price: number; priceCurrency: string; priceSpecification: { price: number; unitCode: string } };
    expect(offer.price).toBe(200);
    expect(offer.priceCurrency).toBe("BRL");
    expect(offer.priceSpecification).toEqual({ "@type": "UnitPriceSpecification", price: 200, priceCurrency: "BRL", unitCode: "MON" });
    expect(MANUTENCAO.precoMensal).toBe(200);
  });

  it("identifica a página própria, sem substituir a oferta pela garantia da reforma", () => {
    const service = MANUTENCAO_JSONLD[0];
    expect(service?.['url']).toBe("https://bewild.com.br/manutencao-preventiva-sao-paulo");
    expect(service?.['@id']).toBe("https://bewild.com.br/manutencao-preventiva-sao-paulo#service");
  });
});