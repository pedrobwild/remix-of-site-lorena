import { createFileRoute } from "@tanstack/react-router";
import MapaDoSitePage from "@/pages/MapaDoSitePage";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/mapa-do-site")({
  component: MapaDoSitePage,
  head: () => seoHead({ title: "Mapa do site: páginas e projetos de reforma | Bewild", description: "Índice com todas as páginas da Bewild e os projetos de reforma de apartamentos e studios em São Paulo, organizados por bairro.", path: "/mapa-do-site" }),
});
