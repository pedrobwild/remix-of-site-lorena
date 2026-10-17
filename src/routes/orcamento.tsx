import { createFileRoute } from "@tanstack/react-router";
import OrcamentoPage from "@/pages/OrcamentoPage";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";
import { loadPageSeo } from "@/lib/pageSeo.functions";
import { resolvePageSeo } from "@/lib/pageSeo";
import { ORCAMENTO_JSONLD, ORCAMENTO_PAGE_JSONLD, topoVarianteDaBusca } from "@/content/pages/orcamento";

/**
 * O loader devolve o SEO e a variante do topo em chaves separadas: o head() lê
 * só `seo` (título, descrição e canonical iguais para todo anúncio) e a página
 * lê só `topoVariante` (H1 e subtítulo do anúncio, já no HTML do servidor).
 * A variante sai de `location.search`, que o roteador já entregou parseada
 * (utm_content repetido vira lista; vale o primeiro valor).
 */
export const Route = createFileRoute("/orcamento")({
  loader: async ({ location }) => ({
    seo: await loadPageSeo({ data: "/orcamento" }),
    topoVariante: topoVarianteDaBusca(location.search),
  }),
  component: OrcamentoRoutePage,
  head: ({ loaderData, matches }) => seoHead({ pagesSeo: rootPagesSeo(matches), ...(loaderData?.seo ?? resolvePageSeo("/orcamento")), path: "/orcamento", keywords: "orçamento de projeto de arquitetura, quanto custa um projeto de arquitetura em São Paulo, orçamento de reforma de studio, quanto custa reformar um studio em São Paulo, custo de reforma de studio, prazo de reforma de studio, orçamento de reforma de apartamento, orçamento de reforma em SP, preço e prazo de reforma São Paulo, reforma de studio para short stay, reforma turnkey orçamento, orçamento turnkey São Paulo, Bewild", jsonLd: ORCAMENTO_JSONLD, pageJsonLd: ORCAMENTO_PAGE_JSONLD }),
});

function OrcamentoRoutePage() {
  const { topoVariante } = Route.useLoaderData();
  return <OrcamentoPage topoVariante={topoVariante} />;
}
