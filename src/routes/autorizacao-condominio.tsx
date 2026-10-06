import { createFileRoute } from "@tanstack/react-router";
import AutorizacaoCondominioPage from "@/pages/AutorizacaoCondominioPage";
import { AUTORIZACAO_JSONLD } from "@/content/pages/autorizacao-condominio";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/autorizacao-condominio")({
  component: AutorizacaoCondominioPage,
  head: () => seoHead({ title: "Autorização de reforma em condomínio: guia completo | Bewild", description: "Autorização de reforma em condomínio: documentos que o síndico pede (ART, seguro, cronograma), prazo de aprovação, horários de obra e quem cuida da burocracia.", path: "/autorizacao-condominio", keywords: "autorização de reforma condomínio, ART de engenharia para reforma, responsável técnico de obra, autorização de reforma em condomínio, autorização de obra em condomínio, documentos para reforma em condomínio, ART de reforma, regras de reforma em apartamento, síndico autorização reforma, Bewild", jsonLd: AUTORIZACAO_JSONLD }),
});
