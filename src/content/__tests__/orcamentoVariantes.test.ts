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

describe("Provas de clientes aprovadas em 17/10/2026", () => {
  it("short stay corresponde a 79% dos clientes", () => {
    expect(CLIENTES_SHORT_STAY_PCT).toBe(79);
  });
  it("59% dos clientes moram fora da capital", () => {
    expect(CLIENTES_FORA_DA_CAPITAL_PCT).toBe(59);
  });
});