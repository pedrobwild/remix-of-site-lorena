import { createFileRoute } from "@tanstack/react-router";
import AcessibilidadePage from "@/pages/AcessibilidadePage";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/acessibilidade")({
  component: AcessibilidadePage,
  head: () => seoHead({ title: "Acessibilidade | Bewild", description: "Como o site da Bewild atende pessoas com deficiência, o que ainda falta e como avisar a equipe sobre uma barreira de acesso.", path: "/acessibilidade" }),
});
