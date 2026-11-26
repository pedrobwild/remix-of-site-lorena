import { describe, expect, it } from "vitest";
import { AVISO_AFILIADO, isAffiliateUrl } from "@/lib/afiliados";

describe("isAffiliateUrl", () => {
  it.each([
    "https://meli.la/1VF4Tbq",
    "https://www.mercadolivre.com.br/x/p/MLB1",
    "https://mercadolivre.com.br/x/p/MLB1",
    "https://mercadolivre.com/sec/abc",
  ])("aceita %s", (u) => expect(isAffiliateUrl(u)).toBe(true));

  it.each([
    "http://meli.la/1VF4Tbq",
    "https://meli.la.exemplo.com/x",
    "https://exemplo.com/meli.la",
    "https://xmeli.la/abc",
    "javascript:alert(1)",
    "",
    "meli.la/abc",
  ])("recusa %s", (u) => expect(isAffiliateUrl(u)).toBe(false));
});

it("aviso com o texto aprovado", () => {
  expect(AVISO_AFILIADO).toBe("Link de afiliado: a Bewild pode receber comissão. O preço para você não muda.");
});

describe("revisão final: leitura do catálogo com teto de tempo", () => {
  it("passa um AbortSignal ao fetch e devolve null quando a leitura falha", async () => {
    const { vi } = await import("vitest");
    const { fetchProdutosAtivos } = await import("@/lib/afiliados");
    const spy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("tempo esgotado"));
    try {
      await expect(fetchProdutosAtivos()).resolves.toBeNull();
      const init = spy.mock.calls[0]?.[1] as RequestInit | undefined;
      expect(init?.signal).toBeInstanceOf(AbortSignal);
    } finally {
      spy.mockRestore();
    }
  });
});

describe("pontos menores da revisão: o painel e o banco aceitam os mesmos links", () => {
  // Mesma expressão do CHECK de `link_afiliado` em drizzle/migrations/0021.
  const SQL = /^https:\/\/(meli\.la|(www\.)?mercadolivre\.com(\.br)?)\//;
  it.each([
    "https://meli.la/1VF4Tbq",
    "https://www.mercadolivre.com.br/x/p/MLB1",
    "https://mercadolivre.com.br/x",
    "https://mercadolivre.com/sec/abc",
    "https://www.mercadolivre.com/sec/abc",
    "https://meli.la",
    "https://MELI.LA/x",
    "HTTPS://meli.la/x",
    "https://meli.la:8443/x",
    "https:meli.la/x",
    "https://meli.la\\@evil.com/x",
    "https://produto.mercadolivre.com.br/MLB-1",
    "http://meli.la/x",
  ])("%s: mesma resposta nos dois", (u) => expect(isAffiliateUrl(u)).toBe(SQL.test(u)));
});
