import { describe, expect, it } from "vitest";
import type { ProdutoAfiliado } from "@/lib/afiliados";
import { agruparProdutos, lerPerfil, produtosItemListJsonLd } from "@/lib/produtosRecomendados";

const p = (over: Partial<ProdutoAfiliado>): ProdutoAfiliado => ({
  id: over.slug ?? "x",
  slug: "x",
  nome: "X",
  motivo: "",
  categoria: "Eletros grandes",
  perfil: "ambos",
  link_afiliado: "https://meli.la/x",
  imagem_url: null,
  imagem_alt: null,
  projeto_slug: null,
  ativo: true,
  sort_order: 0,
  ...over,
});

const lista = [
  p({ slug: "tv", nome: "TV", categoria: "Eletros grandes", sort_order: 10 }),
  p({ slug: "fechadura", nome: "Fechadura", categoria: "Acesso e segurança", perfil: "investidor", sort_order: 20 }),
  p({ slug: "frigobar", nome: "Frigobar", categoria: "Eletros grandes", sort_order: 30 }),
  p({ slug: "poltrona", nome: "Poltrona", categoria: "Móveis e decoração", perfil: "moradia", sort_order: 40 }),
];

describe("lerPerfil", () => {
  it("aceita só investidor e moradia; o resto é 'todos'", () => {
    expect(lerPerfil("investidor")).toBe("investidor");
    expect(lerPerfil("moradia")).toBe("moradia");
    for (const v of [undefined, null, "", "ambos", "Investidor", 3, ["investidor"]]) expect(lerPerfil(v)).toBeNull();
  });
});

describe("agruparProdutos", () => {
  it("sem filtro: categorias na ordem do primeiro produto de cada uma, produtos na ordem do painel", () => {
    const g = agruparProdutos(lista, null);
    expect(g.map((x) => x.categoria)).toEqual(["Eletros grandes", "Acesso e segurança", "Móveis e decoração"]);
    expect(g[0].produtos.map((x) => x.slug)).toEqual(["tv", "frigobar"]);
  });

  it("investidor: entra 'investidor' e 'ambos', sai 'moradia'", () => {
    const slugs = agruparProdutos(lista, "investidor").flatMap((g) => g.produtos.map((x) => x.slug));
    expect(slugs).toEqual(["tv", "frigobar", "fechadura"]);
  });

  it("moradia: entra 'moradia' e 'ambos', sai 'investidor'", () => {
    const slugs = agruparProdutos(lista, "moradia").flatMap((g) => g.produtos.map((x) => x.slug));
    expect(slugs).toEqual(["tv", "frigobar", "poltrona"]);
  });

  it("produto desligado ou com link inválido não entra; lista vazia dá lista vazia", () => {
    expect(agruparProdutos([p({ ativo: false }), p({ slug: "y", link_afiliado: "https://exemplo.com" })], null)).toEqual([]);
    expect(agruparProdutos([], null)).toEqual([]);
  });
});

describe("produtosItemListJsonLd", () => {
  it("ItemList só com nomes: sem Product, Offer, preço nem o link de afiliado", () => {
    const ld = produtosItemListJsonLd(lista);
    const txt = JSON.stringify(ld);
    expect(ld?.["@type"]).toBe("ItemList");
    expect(ld?.numberOfItems).toBe(4);
    expect(txt).toContain('"name":"TV"');
    expect(txt).not.toMatch(/Product|Offer|price|meli\.la/);
  });

  it("sem produto não emite nada", () => {
    expect(produtosItemListJsonLd([])).toBeNull();
  });
});

describe("revisão final: página sem lista não é indexável", () => {
  it("semProdutos: null, vazio e só desligados contam como sem lista", async () => {
    const { semProdutos } = await import("@/lib/produtosRecomendados");
    expect(semProdutos(null)).toBe(true);
    expect(semProdutos([])).toBe(true);
    expect(semProdutos([p({ ativo: false })])).toBe(true);
    expect(semProdutos(lista)).toBe(false);
  });
});
