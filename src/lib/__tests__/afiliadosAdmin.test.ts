import { describe, expect, it } from "vitest";
import { LINK_AFILIADO_INVALIDO, validarProduto, type ProdutoDraft } from "@/lib/afiliadosAdmin";

const ok: ProdutoDraft = {
  nome: "Frigobar 45 L",
  slug: "frigobar-45l",
  motivo: "Cabe sob a bancada.",
  categoria: "Eletros grandes",
  perfil: "ambos",
  link_afiliado: "https://meli.la/2WrtNos",
  imagem_url: "",
  imagem_alt: "",
  projeto_slug: "",
  preco: "",
  ativo: true,
};

describe("validarProduto (/admin/afiliados)", () => {
  it("aceita o produto completo", () => expect(validarProduto(ok)).toBeNull());
  it("recusa link que não é do Mercado Livre, com a mensagem que explica onde gerar", () => {
    expect(validarProduto({ ...ok, link_afiliado: "https://exemplo.com/x" })).toBe(LINK_AFILIADO_INVALIDO);
    expect(validarProduto({ ...ok, link_afiliado: "http://meli.la/2WrtNos" })).toBe(LINK_AFILIADO_INVALIDO);
    expect(validarProduto({ ...ok, link_afiliado: "" })).toBe(LINK_AFILIADO_INVALIDO);
  });
  it("aceita o link com espaço em volta (colado do gerador)", () => {
    expect(validarProduto({ ...ok, link_afiliado: "  https://meli.la/2WrtNos\n" })).toBeNull();
  });
  it("recusa identificador com maiúscula, espaço ou hífen sobrando", () => {
    for (const slug of ["Frigobar", "frigobar 45", "-frigobar", "frigobar-", ""]) {
      expect(validarProduto({ ...ok, slug })).toMatch(/identificador/);
    }
  });
  it("exige nome e categoria", () => {
    expect(validarProduto({ ...ok, nome: "  " })).toMatch(/nome/);
    expect(validarProduto({ ...ok, categoria: "" })).toMatch(/categoria/);
  });
  it("foto só https; projeto só o final do endereço", () => {
    expect(validarProduto({ ...ok, imagem_url: "http://x.com/a.jpg" })).toMatch(/https/);
    expect(validarProduto({ ...ok, projeto_slug: "/portfolio/studio" })).toMatch(/portfolio/);
    expect(validarProduto({ ...ok, imagem_url: "https://bewild.com.br/a.webp", projeto_slug: "studio-pinheiros" })).toBeNull();
  });
  it("aceita a foto do anúncio do Mercado Livre (decisão do Pedro, 27/11/2026)", () => {
    expect(validarProduto({ ...ok, imagem_url: "https://http2.mlstatic.com/D_NQ_NP_1.webp" })).toBeNull();
  });

  it("preço: vazio é aceito; valor em reais é aceito; texto solto é recusado", () => {
    expect(validarProduto({ ...ok, preco: "" })).toBeNull();
    expect(validarProduto({ ...ok, preco: "1.399,00" })).toBeNull();
    expect(validarProduto({ ...ok, preco: "R$ 88,90" })).toBeNull();
    expect(validarProduto({ ...ok, preco: "barato" })).toMatch(/preço/i);
    expect(validarProduto({ ...ok, preco: "0" })).toMatch(/preço/i);
  });
});

describe("parsePrecoBR", () => {
  it.each([
    ["1.399,00", 1399],
    ["R$ 88,90", 88.9],
    ["529,76", 529.76],
    ["3859", 3859],
    ["1399.00", 1399],
    [" 2.659 ", 2659],
    ["1.234.567,5", 1234567.5],
  ])("%s → %s", async (texto, valor) => {
    const { parsePrecoBR } = await import("@/lib/afiliadosAdmin");
    expect(parsePrecoBR(texto)).toBe(valor);
  });
  it.each(["", "abc", "0", "-5", "1,2,3"])("%s não é preço", async (texto) => {
    const { parsePrecoBR } = await import("@/lib/afiliadosAdmin");
    expect(parsePrecoBR(texto)).toBeNull();
  });
});

describe("mensagemDeErroAoSalvar", () => {
  it("explica cada recusa do banco em vez de culpar o login", async () => {
    const { mensagemDeErroAoSalvar } = await import("@/lib/afiliadosAdmin");
    expect(mensagemDeErroAoSalvar("23505")).toMatch(/identificador/);
    expect(mensagemDeErroAoSalvar("23514")).toMatch(/link|identificador/i);
    expect(mensagemDeErroAoSalvar("23514")).not.toMatch(/logado/);
    expect(mensagemDeErroAoSalvar("42501")).toMatch(/administrador/);
    expect(mensagemDeErroAoSalvar(undefined)).toMatch(/administrador/);
  });
});
