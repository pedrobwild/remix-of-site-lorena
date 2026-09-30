import { createFileRoute } from "@tanstack/react-router";
import MapaDoSitePage from "@/pages/MapaDoSitePage";
import { seoHead } from "@/lib/routeHead";
import { loadProjectList } from "@/lib/contentLoaders";

export const Route = createFileRoute("/mapa-do-site")({
  loader: () => loadProjectList(),
  component: RouteComponent,
  head: () => seoHead({ title: "Mapa do site: páginas e projetos de reforma | Bewild", description: "Índice com todas as páginas da Bewild e os projetos de reforma de apartamentos e studios em São Paulo, organizados por bairro.", path: "/mapa-do-site" }),
});

function RouteComponent() {
  const projects = Route.useLoaderData()?.projects ?? null;
  return <MapaDoSitePage initialProjects={projects} />;
}
