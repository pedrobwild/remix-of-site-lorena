import { createFileRoute } from "@tanstack/react-router";
import MapaDoSitePage from "@/pages/MapaDoSitePage";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";
// Import tardio: o loader da rota entra no pacote de TODA página; assim os
// carregadores de conteúdo (posts, projetos, vídeos…) só baixam quando usados.
const contentLoaders = () => import("@/lib/contentLoaders");

export const Route = createFileRoute("/mapa-do-site")({
  loader: () => contentLoaders().then((m) => m.loadSiteMapContent()),
  component: RouteComponent,
  head: ({ matches }) => seoHead({ pagesSeo: rootPagesSeo(matches), title: "Mapa do site: páginas, bairros, projetos e conteúdos | Bewild", description: "Índice com todas as páginas da Bewild, as páginas de reforma por bairro, os projetos de apartamentos e studios reformados em São Paulo e os guias de conteúdo.", path: "/mapa-do-site" }),
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <MapaDoSitePage initialProjects={data?.projects ?? null} initialPosts={data?.posts ?? null} />;
}
