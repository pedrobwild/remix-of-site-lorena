import { createFileRoute } from "@tanstack/react-router";
import EscopoPage from "@/pages/EscopoPage";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/escopo")({
  component: EscopoPage,
  head: () => seoHead({ title: "Escopo de arquitetura e reforma para apartamento em SP | Bewild", description: "Descreva seu apartamento e seu objetivo e receba na hora uma recomendação de escopo de arquitetura, engenharia e reforma, prazo de referência e próximos passos com a Bewild.", path: "/escopo" }),
});
