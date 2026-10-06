import { createFileRoute } from "@tanstack/react-router";
import OrcamentoPage from "@/pages/OrcamentoPage";
import { seoHead } from "@/lib/routeHead";
import { ORCAMENTO_JSONLD } from "@/content/pages/orcamento";

export const Route = createFileRoute("/orcamento")({
  component: OrcamentoPage,
  head: () => seoHead({ title: "Orçamento de reforma turnkey em São Paulo | Bewild", description: "Peça o orçamento da reforma turnkey do seu studio ou apartamento em São Paulo: faixa de investimento em 1 dia útil, projeto 3D, preço fechado e prazo em contrato.", path: "/orcamento", keywords: "orçamento de projeto de arquitetura, quanto custa um projeto de arquitetura em São Paulo, orçamento de reforma de studio, quanto custa reformar um studio em São Paulo, custo de reforma de studio, prazo de reforma de studio, orçamento de reforma de apartamento, orçamento de reforma em SP, preço e prazo de reforma São Paulo, reforma de studio para short stay, reforma turnkey orçamento, orçamento turnkey São Paulo, Bewild", jsonLd: ORCAMENTO_JSONLD }),
});
