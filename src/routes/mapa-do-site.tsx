import { createFileRoute } from "@tanstack/react-router";
import MapaDoSitePage from "@/pages/MapaDoSitePage";
import { seoHead } from "@/lib/routeHead";
import { loadSiteMapContent } from "@/lib/contentLoaders";

export const Route = createFileRoute("/mapa-do-site")({
  loader: () => loadSiteMapContent(),
  component: RouteComponent,
  head: () => seoHead({ title: "Mapa do site: páginas, bairros, projetos e conteúdos | Bewild", description: "Índice com todas as páginas da Bewild, as páginas de reforma por bairro, os projetos de apartamentos e studios reformados em São Paulo e os guias de conteúdo.", path: "/mapa-do-site" }),
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <MapaDoSitePage initialProjects={data?.projects ?? null} initialPosts={data?.posts ?? null} />;
}
