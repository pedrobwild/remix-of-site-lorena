import { createFileRoute } from "@tanstack/react-router";
import OrcamentoPage from "@/pages/OrcamentoPage";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/orcamento")({
  component: OrcamentoPage,
  head: () => seoHead({ title: "Orçamento de projeto de arquitetura e reforma em SP | Bewild", description: "Peça o orçamento de arquitetura, engenharia e reforma do seu studio ou apartamento em São Paulo e receba faixa de custo e prazo em contrato fechado.", path: "/orcamento", keywords: "orçamento de projeto de arquitetura, quanto custa um projeto de arquitetura em São Paulo, orçamento de reforma de studio, quanto custa reformar um studio em São Paulo, custo de reforma de studio, prazo de reforma de studio, orçamento de reforma de apartamento, orçamento de reforma em SP, preço e prazo de reforma São Paulo, reforma de studio para short stay, Bewild" }),
});
