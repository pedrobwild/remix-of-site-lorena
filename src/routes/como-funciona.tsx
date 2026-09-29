import { createFileRoute } from "@tanstack/react-router";
import ComoFuncionaPage from "@/pages/ComoFuncionaPage";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/como-funciona")({
  component: ComoFuncionaPage,
  head: () => seoHead({ title: "Arquitetura, engenharia e obra em um contrato só em SP | Bewild", description: "Arquitetura e engenharia num contrato só: projeto 3D, documentação técnica (ART/RRT), obra com equipe própria e apartamento entregue pronto em São Paulo.", path: "/como-funciona" }),
});
