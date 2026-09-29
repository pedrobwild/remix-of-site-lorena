import { createFileRoute } from "@tanstack/react-router";
import ReformaStudioSpPage from "@/pages/ReformaStudioSpPage";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/reforma-de-studio-sao-paulo")({
  component: ReformaStudioSpPage,
  head: () => seoHead({ title: "Reforma de studio em São Paulo para morar ou alugar | Bewild", description: "Reforma completa de studio em São Paulo, pronta para morar ou para short stay, com arquitetura e engenharia próprias: projeto arquitetônico, obra, marcenaria e mobília em um contrato, com preço fechado, prazo em contrato e 5 anos de garantia.", path: "/reforma-de-studio-sao-paulo" }),
});
