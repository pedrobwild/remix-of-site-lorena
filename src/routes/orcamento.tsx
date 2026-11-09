import { createFileRoute } from "@tanstack/react-router";
import OrcamentoPage from "@/pages/OrcamentoPage";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";
import { loadPageSeo } from "@/lib/pageSeo.functions";
import { resolvePageSeo } from "@/lib/pageSeo";
import { topoVarianteDaBusca } from "@/lib/googleAdsVariant";
// Conteúdo da página (JSON-LD, FAQ, textos) só por import dinâmico no loader:
// o head() e o loader de toda rota entram no pacote inicial de QUALQUER página
// (velocidade, 09/11/2026). Ver "montadores pesados" em routesCodeSplit.test.ts.

/**
 * O loader devolve `{ seo, topoVariante }`. O head() usa só `seo` (com os
 * dados estruturados) (título, descrição e canonical iguais para
 * todo anúncio); a página usa só `topoVariante` (H1 e subtítulo de
 * TOPO_VARIANTES, já no HTML do servidor). Regras do mapa em
 * `topoVarianteDaBusca`; utm_content repetido vale o primeiro valor.
 */
export const Route = createFileRoute("/orcamento")({
  loader: async ({ location }) => {
    const [seo, content] = await Promise.all([loadPageSeo({ data: "/orcamento" }), import("@/content/pages/orcamento")]);
    return {
      // Dados estruturados junto do SEO: o head() só lê `seo`; a página só lê `topoVariante`.
      seo: { ...seo, jsonLd: content.ORCAMENTO_JSONLD, pageJsonLd: content.ORCAMENTO_PAGE_JSONLD },
      topoVariante: topoVarianteDaBusca(location.search),
    };
  },
  component: OrcamentoRoutePage,
  head: ({ loaderData, matches }) => seoHead({ pagesSeo: rootPagesSeo(matches), ...(loaderData?.seo ?? resolvePageSeo("/orcamento")), path: "/orcamento", keywords: "orçamento de projeto de arquitetura, quanto custa um projeto de arquitetura em São Paulo, orçamento de reforma de studio, quanto custa reformar um studio em São Paulo, custo de reforma de studio, prazo de reforma de studio, orçamento de reforma de apartamento, orçamento de reforma em SP, preço e prazo de reforma São Paulo, reforma de studio para short stay, reforma turnkey orçamento, orçamento turnkey São Paulo, Bewild" }),
});

function OrcamentoRoutePage() {
  const { topoVariante } = Route.useLoaderData();
  return <OrcamentoPage topoVariante={topoVariante} />;
}
