import { createFileRoute } from "@tanstack/react-router";
import MarcasParceriasPage from "@/pages/MarcasParceriasPage";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/marcas-e-parcerias")({
  component: MarcasParceriasPage,
  head: () => seoHead({ title: "Marcas, parcerias e Bewild na mídia | Bewild", description: "Conheça as parcerias institucionais da Bewild e as matérias publicadas sobre arquitetura, reforma e imóveis como ativos de renda.", path: "/marcas-e-parcerias" }),
});
