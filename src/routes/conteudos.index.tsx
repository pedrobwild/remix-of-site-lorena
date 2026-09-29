import { createFileRoute } from "@tanstack/react-router";
import BewildConteudosPage from "@/pages/BewildConteudosPage";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/conteudos/")({
  component: BewildConteudosPage,
  head: () => seoHead({ title: "Arquitetura, engenharia e custo de reforma em SP: guias | Bewild", description: "Guias práticos da Bewild sobre projeto de arquitetura, engenharia, custo, etapas e prazo de obra para reformar apartamento em São Paulo.", path: "/conteudos", keywords: "projeto de arquitetura, arquitetura e engenharia, engenharia civil, custo de reforma, quanto custa reformar um apartamento, custo de reforma de apartamento em SP, etapas de uma reforma, prazo de reforma de apartamento, reforma de apartamento em SP, Bewild" }),
});
