import { createFileRoute } from "@tanstack/react-router";
import ComoFuncionaPage from "@/pages/ComoFuncionaPage";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/como-funciona")({
  component: ComoFuncionaPage,
  head: () => seoHead({ title: "Como funciona a reforma turnkey: etapas e contrato | Bewild", description: "Como funciona a reforma turnkey da Bewild: consultoria, projeto 3D e executivo, ART e liberação do condomínio, obra com equipe própria e apartamento pronto.", path: "/como-funciona" }),
});
