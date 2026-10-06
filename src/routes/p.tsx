import { createFileRoute } from "@tanstack/react-router";
import LpPanfletoPage from "@/pages/LpPanfletoPage";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/p")({
  component: LpPanfletoPage,
  head: () => seoHead({ bwaCss: false, title: "Bewild · diagnóstico do seu studio", description: "Página do panfleto Bewild. Solicite o diagnóstico do seu studio.", path: "/p", noindex: true }),
});
