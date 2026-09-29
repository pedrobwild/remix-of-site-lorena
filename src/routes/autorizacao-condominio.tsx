import { createFileRoute } from "@tanstack/react-router";
import AutorizacaoCondominioPage from "@/pages/AutorizacaoCondominioPage";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/autorizacao-condominio")({
  component: AutorizacaoCondominioPage,
  head: () => seoHead({ title: "Autorização de reforma em condomínio: guia completo | Bewild", description: "Autorização de reforma condomínio sem dor de cabeça: documentos exigidos pelo síndico (ART, seguro, cronograma), prazo de aprovação, horários de obra e quem resolve a burocracia em SP.", path: "/autorizacao-condominio", keywords: "autorização de reforma condomínio, ART de engenharia para reforma, responsável técnico de obra, autorização de reforma em condomínio, autorização de obra em condomínio, documentos para reforma em condomínio, ART de reforma, regras de reforma em apartamento, síndico autorização reforma, Bewild" }),
});
