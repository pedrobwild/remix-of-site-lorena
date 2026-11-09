import { createFileRoute } from "@tanstack/react-router";
import LpReformaStudioPage from "@/pages/LpReformaStudioPage";
import { seoHead } from "@/lib/routeHead";
import { topoVarianteDaBusca } from "@/lib/googleAdsVariant";
// Só título/descrição/caminho aqui (módulo pequeno): o conteúdo da LP arrasta
// a página de studio, as fotos da home e as provas, e o head() entra no pacote
// inicial de toda página. A variante do topo vem por import dinâmico no loader.
import { LP_DESCRIPTION, LP_PATH, LP_TITLE } from "@/content/pages/lp-reforma-de-studio-sao-paulo.seo";

/**
 * LP dos anúncios do Google (02/11/2026): `noindex`, fora do sitemap, não
 * substitui a página orgânica /reforma-de-studio-sao-paulo. O topo (H1 e
 * subtítulo) sai da `utm_term` já no HTML do servidor, como no /orcamento.
 */
export const Route = createFileRoute("/lp/reforma-de-studio-sao-paulo")({
  loader: async ({ location }) => {
    const { lpVarianteDaBusca } = await import("@/content/pages/lp-reforma-de-studio-sao-paulo");
    return { variante: lpVarianteDaBusca(topoVarianteDaBusca(location.search)) };
  },
  component: RouteComponent,
  head: () => seoHead({ title: LP_TITLE, description: LP_DESCRIPTION, path: LP_PATH, noindex: true }),
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <LpReformaStudioPage variante={data?.variante ?? "investidor"} />;
}
