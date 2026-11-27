/**
 * Título, descrição e caminho de /produtos-recomendados, iguais no `head()` da
 * rota e no `useSeo` da página. A página lista produtos do Mercado Livre com
 * link de afiliado (catálogo em /admin/afiliados; ver src/lib/afiliados.ts).
 * "Recomendados", não "usados nas obras": a lista inicial foi escolhida na
 * busca, não tirada dos projetos (26/11/2026).
 */
export const PRODUTOS_PATH = "/produtos-recomendados";
export const PRODUTOS_TITLE = "Produtos recomendados para studio | Bewild";
export const PRODUTOS_DESCRIPTION =
  "Eletros, móveis e itens que a Bewild recomenda para studios e apartamentos compactos em São Paulo, com links para comprar.";
export const PRODUTOS_H1 = "Produtos que recomendamos para studios";

export type PerfilFiltro = "investidor" | "moradia";

/** `?perfil=` da URL: só os dois valores conhecidos; qualquer outra coisa mostra tudo. Fica aqui (módulo sem imports) porque a rota usa no `validateSearch`, que entra no pacote inicial. */
export function lerPerfil(value: unknown): PerfilFiltro | null {
  return value === "investidor" || value === "moradia" ? value : null;
}
