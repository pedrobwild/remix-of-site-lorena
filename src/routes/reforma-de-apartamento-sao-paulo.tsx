import { createFileRoute } from "@tanstack/react-router";
import ReformaApartamentoSpPage from "@/pages/ReformaApartamentoSpPage";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/reforma-de-apartamento-sao-paulo")({
  component: ReformaApartamentoSpPage,
  head: () => seoHead({ title: "Reforma de apartamento em São Paulo | Projeto, obra e mobília — Bewild", description: "Reforma de apartamento em São Paulo com arquitetura e engenharia próprias: projeto 3D, obra, marcenaria e mobília num contrato, preço fechado, 5 anos de garantia.", path: "/reforma-de-apartamento-sao-paulo" }),
});
