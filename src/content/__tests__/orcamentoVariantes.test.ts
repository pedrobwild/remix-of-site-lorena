import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: () => new Promise(() => {}),
    from: () => ({ select: () => new Promise(() => {}) }),
  },
}));

import { topoVarianteDaBusca } from "@/content/pages/orcamento";
import { CLIENTES_FORA_DA_CAPITAL_PCT, CLIENTES_SHORT_STAY_PCT } from "@/content/provas";

describe("Variante do orçamento pela busca crua", () => {
  it("a normalização do roteador preserva o primeiro valor e aceita números e parâmetros inesperados", () => {
    expect(topoVarianteDaBusca({ utm_content: ["custo-orcamento", 123456], gclid: "teste" })).toBe("custo");
    expect(topoVarianteDaBusca({ utm_content: 123456, utm_campaign: 123456 })).toBe("padrao");
    expect(topoVarianteDaBusca({ utm_content: { unexpected: true } })).toBe("padrao");
  });
  it.each([
    ["?utm_content=anuncio-investidor", "investidor"],
    ["?utm_content=airbnb-studio", "investidor"],
    ["?utm_content=aluguel-compacto", "investidor"],
    ["?utm_campaign=sea_investidor", "investidor"],
    ["?utm_content=studio-ape-pequeno&utm_campaign=sea_investidor", "investidor"],
    ["?utm_content=studio-ape-pequeno", "studio"],
    ["?utm_content=arquitetura-reforma", "arquitetura"],
    ["?utm_content=custo-orcamento", "custo"],
    ["?utm_content=custo-orcamento&utm_content=123_456", "custo"],
    ["?utm_content=123_456&utm_content=custo-orcamento", "padrao"],
    ["?utm_content=123456&utm_campaign=123456", "padrao"],
    ["?utm_content=desconhecido", "padrao"],
    ["?utm_content=%5B1%2C2%5D&outro=%7B%7D&gclid=teste", "padrao"],
    ["", "padrao"],
  ])("%s → %s", (search, expected) => {
    expect(topoVarianteDaBusca(search)).toBe(expected);
  });
});

describe("Variante pela palavra-chave (utm_term = {keyword})", () => {
  it.each([
    ["?utm_term=studio+para+airbnb", "investidor"],
    ["?utm_term=reforma%20para%20loca%C3%A7%C3%A3o", "investidor"],
    ["?utm_term=mobiliar+apartamento+para+alugar&utm_content=custo-orcamento", "investidor"],
    ["?utm_term=reforma+apartamento+na+planta", "planta"],
    ["?utm_term=reforma+de+apartamento+novo&utm_campaign=sea_investidor", "planta"],
    ["?utm_term=quanto+custa+reformar+um+apartamento", "custo"],
    ["?utm_term=pre%C3%A7o+reforma+apartamento", "custo"],
    ["?utm_term=reforma+de+kitnet", "studio"],
    ["?utm_term=reforma+est%C3%BAdio", "studio"],
    ["?utm_term=arquitetura+e+reforma+sp", "arquitetura"],
    // Anúncio de investidor mantém o ângulo quando o tema da busca é neutro.
    ["?utm_term=reforma+de+studio&utm_content=investidor_v2", "investidor"],
    ["?utm_term=reforma+de+apartamento+s%C3%A3o+paulo&utm_content=investidor_v2", "investidor"],
    ["?utm_term=quanto+custa+reformar&utm_campaign=sea_investidor", "investidor"],
    // Termo neutro: vale a regra antiga do anúncio.
    ["?utm_term=empresa+de+reforma+sp&utm_content=studio-ape-pequeno", "studio"],
    ["?utm_term=reforma+de+apartamento+s%C3%A3o+paulo", "padrao"],
    ["?utm_term=", "padrao"],
  ])("%s → %s", (search, expected) => {
    expect(topoVarianteDaBusca(search)).toBe(expected);
  });
  it("aceita a busca já parseada pelo roteador", () => {
    expect(topoVarianteDaBusca({ utm_term: ["studio para airbnb", "x"], utm_content: "custo-orcamento" })).toBe("investidor");
    expect(topoVarianteDaBusca({ utm_term: 123 })).toBe("padrao");
  });
});

describe("Provas de clientes aprovadas em 17/10/2026", () => {
  it("short stay corresponde a 79% dos clientes", () => {
    expect(CLIENTES_SHORT_STAY_PCT).toBe(79);
  });
  it("59% dos clientes moram fora da capital (base de 188 contratos, confirmado em 26/10/2026)", () => {
    expect(CLIENTES_FORA_DA_CAPITAL_PCT).toBe(59);
  });
});