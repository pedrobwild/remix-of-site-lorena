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
