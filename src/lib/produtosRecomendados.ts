/**
 * Página /produtos-recomendados: agrupamento por categoria, filtro por perfil
 * e dados estruturados. Funções puras, usadas pelo loader e pela página.
 */
import { isAffiliateUrl, type ProdutoAfiliado } from "@/lib/afiliados";
import { lerPerfil, type PerfilFiltro } from "@/content/pages/produtosRecomendados.seo";

export { lerPerfil, type PerfilFiltro };

export type GrupoDeProdutos = { categoria: string; produtos: ProdutoAfiliado[] };

/**
 * Produtos ligados, na ordem do painel, agrupados por categoria (categoria na
 * ordem em que aparece pela primeira vez). Com filtro, produto marcado "ambos"
 * aparece nos dois perfis.
 */
export function agruparProdutos(produtos: readonly ProdutoAfiliado[], perfil: PerfilFiltro | null): GrupoDeProdutos[] {
  const grupos: GrupoDeProdutos[] = [];
  for (const p of produtos) {
    if (!p.ativo || !isAffiliateUrl(p.link_afiliado)) continue;
    if (perfil && p.perfil !== "ambos" && p.perfil !== perfil) continue;
    const categoria = p.categoria.trim() || "Outros";
    let grupo = grupos.find((g) => g.categoria === categoria);
    if (!grupo) grupos.push((grupo = { categoria, produtos: [] }));
    grupo.produtos.push(p);
  }
  return grupos;
}

/**
 * ItemList só com os nomes. Sem `Product`/`Offer`: a página não mostra preço e
 * o Google recusa oferta sem preço; o link de afiliado também não entra.
 */
export function produtosItemListJsonLd(produtos: readonly ProdutoAfiliado[]): Record<string, unknown> | null {
  const itens = agruparProdutos(produtos, null).flatMap((g) => g.produtos);
  if (itens.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Produtos recomendados pela Bewild para studios",
    numberOfItems: itens.length,
    itemListElement: itens.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.nome })),
  };
}

/** Sem nenhum produto para mostrar (leitura falhou, catálogo vazio ou tudo desligado): a página sai `noindex`. */
export function semProdutos(produtos: readonly ProdutoAfiliado[] | null | undefined): boolean {
  return !produtos || agruparProdutos(produtos, null).length === 0;
}
