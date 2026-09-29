import { createFileRoute } from "@tanstack/react-router";
import FaqPage from "@/pages/FaqPage";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/faq")({
  component: FaqPage,
  head: () => seoHead({ title: "Dúvidas sobre arquitetura, engenharia e reforma em SP | Bewild", description: "Respostas sobre reforma de apartamento em SP: quanto custa, prazo, contrato fechado, garantia, autorização do condomínio, etapas da obra e indicações.", path: "/faq", keywords: "dúvidas sobre arquitetura e engenharia, projeto de arquitetura em São Paulo, dúvidas sobre reforma de apartamento em SP, reforma de apartamento em SP, custo de reforma, prazo de reforma, contrato fechado de reforma, garantia de reforma, comissão de indicação de imóvel, autorização de reforma condomínio, Bewild" }),
});
