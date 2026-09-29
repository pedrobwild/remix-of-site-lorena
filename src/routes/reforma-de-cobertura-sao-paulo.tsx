import { createFileRoute } from "@tanstack/react-router";
import ReformaCoberturaSpPage from "@/pages/ReformaCoberturaSpPage";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/reforma-de-cobertura-sao-paulo")({
  component: ReformaCoberturaSpPage,
  head: () => seoHead({ title: "Reforma de cobertura em São Paulo | Projeto, obra e mobília — Bewild", description: "Reforma completa de cobertura em São Paulo com arquitetura e engenharia próprias: projeto arquitetônico 3D, obra, terraço, marcenaria sob medida e mobília em um único contrato, com preço fechado, prazo em contrato e 5 anos de garantia.", path: "/reforma-de-cobertura-sao-paulo" }),
});
