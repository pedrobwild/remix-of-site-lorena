import { createFileRoute } from "@tanstack/react-router";
import ReformaStudioSpPage from "@/pages/ReformaStudioSpPage";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/reforma-de-studio-sao-paulo")({
  component: ReformaStudioSpPage,
  head: () => seoHead({ title: "Reforma de studio em São Paulo para morar ou alugar | Bewild", description: "Reforma de studio em São Paulo, pronto para morar ou para short stay: projeto, obra, marcenaria e mobília em um contrato, preço fechado e 5 anos de garantia.", path: "/reforma-de-studio-sao-paulo" }),
});
