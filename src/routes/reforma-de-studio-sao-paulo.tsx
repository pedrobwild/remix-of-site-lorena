import { createFileRoute } from "@tanstack/react-router";
import ReformaStudioSpPage from "@/pages/ReformaStudioSpPage";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";
import { topoVarianteDaBusca } from "@/lib/googleAdsVariant";
// Import tardio: o loader da rota entra no pacote de TODA página; assim os
// carregadores de conteúdo (posts, projetos, vídeos…) só baixam quando usados.
const contentLoaders = () => import("@/lib/contentLoaders");
// Conteúdo da página (JSON-LD, FAQ, textos) só por import dinâmico no loader:
// o head() e o loader de toda rota entram no pacote inicial de QUALQUER página
// (velocidade, 09/11/2026). Ver "montadores pesados" em routesCodeSplit.test.ts.
const content = () => import("@/content/pages/reforma-de-studio-sao-paulo");

/**
 * A variante do topo sai de `location.search` (palavra-chave e anúncio do
 * Google), já no HTML do servidor, como no /orcamento. O head() não muda:
 * título, descrição e canonical são os mesmos para todo visitante.
 */
export const Route = createFileRoute("/reforma-de-studio-sao-paulo")({
  loader: async ({ location }) => {
    const [links, { SEO_TITLE, SEO_DESCRIPTION, SEO_KEYWORDS, STUDIO_SP_JSONLD }] = await Promise.all([
      contentLoaders().then((m) => m.loadBairroLinks()),
      content(),
    ]);
    return {
      ...links,
      topoVariante: topoVarianteDaBusca(location.search),
      // SEO_TITLE/SEO_DESCRIPTION/SEO_KEYWORDS compartilhados com o useSeo da página (mesma fonte).
      seo: { title: SEO_TITLE, description: SEO_DESCRIPTION, keywords: SEO_KEYWORDS, jsonLd: STUDIO_SP_JSONLD },
    };
  },
  component: RouteComponent,
  head: ({ loaderData, matches }) =>
    seoHead({
      pagesSeo: rootPagesSeo(matches),
      title: loaderData?.seo.title ?? "Reforma de studio em São Paulo: preço e prazo em contrato",
      description: loaderData?.seo.description ?? "Reforma de studio em São Paulo com projeto, obra, marcenaria e mobília num contrato de preço fechado.",
      keywords: loaderData?.seo.keywords,
      path: "/reforma-de-studio-sao-paulo",
      jsonLd: loaderData?.seo.jsonLd ?? null,
    }),
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <ReformaStudioSpPage bairroPages={data?.bairroPages ?? null} topoVariante={data?.topoVariante ?? "padrao"} />;
}
