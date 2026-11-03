import { createFileRoute } from "@tanstack/react-router";
import LpReformaStudioPage from "@/pages/LpReformaStudioPage";
import { seoHead } from "@/lib/routeHead";
import { topoVarianteDaBusca } from "@/lib/googleAdsVariant";
import { LP_DESCRIPTION, LP_PATH, LP_TITLE, lpVarianteDaBusca } from "@/content/pages/lp-reforma-de-studio-sao-paulo";

/**
 * LP dos anúncios do Google para "reforma de studio em São Paulo" (handoff de
 * 02/11/2026). `noindex`: fica fora do sitemap (NAO_INDEXAVEIS em
 * sitemapParidade.test.ts) e não substitui a página orgânica
 * /reforma-de-studio-sao-paulo, que segue indexável e intacta.
 *
 * A variante do topo sai de `location.search` (utm_term → utm_content →
 * utm_campaign), já no HTML do servidor, como no /orcamento; o head() não
 * muda com o anúncio.
 */
export const Route = createFileRoute("/lp/reforma-de-studio-sao-paulo")({
  loader: ({ location }) => ({ variante: lpVarianteDaBusca(topoVarianteDaBusca(location.search)) }),
  component: RouteComponent,
  head: () => seoHead({ title: LP_TITLE, description: LP_DESCRIPTION, path: LP_PATH, noindex: true }),
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <LpReformaStudioPage variante={data?.variante ?? "investidor"} />;
}
