import { createFileRoute } from "@tanstack/react-router";
import ReformaCoberturaSpPage from "@/pages/ReformaCoberturaSpPage";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/reforma-de-cobertura-sao-paulo")({
  component: ReformaCoberturaSpPage,
  head: () => seoHead({ title: "Reforma de cobertura em São Paulo | Projeto, obra e mobília — Bewild", description: "Reforma completa de cobertura em São Paulo: projeto 3D, obra, terraço, marcenaria e mobília em um contrato, com preço fechado, prazo e 5 anos de garantia.", path: "/reforma-de-cobertura-sao-paulo" }),
});
