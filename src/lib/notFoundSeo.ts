/**
 * Título/descrição da página 404 e o tipo dos loaders de SEO.
 *
 * Mora num arquivo próprio porque o `head()` da rota curinga (`$.tsx`) e o de
 * /videos/$slug entram no pacote inicial de TODA página: importar isto de
 * `seoLoaders.ts` arrastava junto o cliente do Supabase (~55 kB gzip) que
 * aquele módulo usa para ler o banco.
 */
export type RouteSeoData = {
  title: string;
  description: string;
  ogImage?: string | null;
  ogType?: "website" | "article";
  notFound?: boolean;
};

export const NOT_FOUND_SEO: RouteSeoData = {
  title: "404 · Página não encontrada · Bewild",
  description:
    "A página solicitada não existe ou foi movida. Conheça o portfólio de reformas de apartamentos e imóveis prontos da Bewild em São Paulo.",
  notFound: true,
};
