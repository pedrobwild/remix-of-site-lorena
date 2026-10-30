import { createFileRoute } from "@tanstack/react-router";
import ReformaStudioSpPage from "@/pages/ReformaStudioSpPage";
import { SEO_DESCRIPTION, SEO_TITLE, SEO_KEYWORDS, STUDIO_SP_JSONLD } from "@/content/pages/reforma-de-studio-sao-paulo";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";
import { topoVarianteDaBusca } from "@/lib/googleAdsVariant";
// Import tardio: o loader da rota entra no pacote de TODA página; assim os
// carregadores de conteúdo (posts, projetos, vídeos…) só baixam quando usados.
const contentLoaders = () => import("@/lib/contentLoaders");

/**
 * A variante do topo sai de `location.search` (palavra-chave e anúncio do
 * Google), já no HTML do servidor, como no /orcamento. O head() não muda:
 * título, descrição e canonical são os mesmos para todo visitante.
 */
export const Route = createFileRoute("/reforma-de-studio-sao-paulo")({
  loader: async ({ location }) => ({
    ...(await contentLoaders().then((m) => m.loadBairroLinks())),
    topoVariante: topoVarianteDaBusca(location.search),
  }),
  component: RouteComponent,
  head: ({ matches }) => seoHead({ pagesSeo: rootPagesSeo(matches), title: SEO_TITLE, description: SEO_DESCRIPTION, keywords: SEO_KEYWORDS, path: "/reforma-de-studio-sao-paulo", jsonLd: STUDIO_SP_JSONLD }),
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <ReformaStudioSpPage bairroPages={data?.bairroPages ?? null} topoVariante={data?.topoVariante ?? "padrao"} />;
}
