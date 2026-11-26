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
});
