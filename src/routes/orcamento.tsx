import { createFileRoute } from "@tanstack/react-router";
import OrcamentoPage from "@/pages/OrcamentoPage";
import { seoHead } from "@/lib/routeHead";
import { loadPageSeo } from "@/lib/pageSeo.functions";
import { resolvePageSeo } from "@/lib/pageSeo";
import { ORCAMENTO_JSONLD, ORCAMENTO_PAGE_JSONLD } from "@/content/pages/orcamento";

export const Route = createFileRoute("/orcamento")({
  loader: () => loadPageSeo({ data: "/orcamento" }),
  component: OrcamentoPage,
  head: ({ loaderData }) => seoHead({ ...(loaderData ?? resolvePageSeo("/orcamento")), path: "/orcamento", keywords: "orçamento de projeto de arquitetura, quanto custa um projeto de arquitetura em São Paulo, orçamento de reforma de studio, quanto custa reformar um studio em São Paulo, custo de reforma de studio, prazo de reforma de studio, orçamento de reforma de apartamento, orçamento de reforma em SP, preço e prazo de reforma São Paulo, reforma de studio para short stay, reforma turnkey orçamento, orçamento turnkey São Paulo, Bewild", jsonLd: ORCAMENTO_JSONLD, pageJsonLd: ORCAMENTO_PAGE_JSONLD }),
});
