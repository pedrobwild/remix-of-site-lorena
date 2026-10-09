/**
 * Artigos do blog fundidos em outro (consolidação de conteúdo para SEO).
 *
 * O slug antigo responde 301 para o artigo que absorveu o conteúdo, no
 * servidor (`src/routes/conteudos.$slug.tsx`) e na navegação SPA
 * (`normalizeLegacyPath`). O post antigo fica despublicado no banco, então
 * some do sitemap dinâmico; aqui ele também não pode voltar para
 * `public/sitemap.xml` nem receber link interno.
 *
 *  - 09/10/2026: "Cronograma de uma reforma de studio: 60 dias úteis" entrou
 *    em "Quanto tempo demora uma reforma de apartamento" (cronograma data a
 *    data, ordem das etapas e caminho crítico da marcenaria).
 */
export const POSTS_FUNDIDOS: Readonly<Record<string, string>> = {
  "cronograma-reforma-studio-60-dias-uteis": "quanto-tempo-demora-reforma-apartamento",
};

/** Slug de destino quando `slug` foi fundido em outro artigo; senão `null`. */
export function destinoDoPostFundido(slug: string): string | null {
  return Object.prototype.hasOwnProperty.call(POSTS_FUNDIDOS, slug) ? POSTS_FUNDIDOS[slug] : null;
}
