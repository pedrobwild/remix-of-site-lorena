import { createFileRoute } from "@tanstack/react-router";
import BewildPortfolioPage from "@/pages/BewildPortfolioPage";
import { seoHead } from "@/lib/routeHead";
import { loadProjectList } from "@/lib/contentLoaders";
import { projectListJsonLd } from "@/lib/contentJsonLd";

export const Route = createFileRoute("/portfolio/")({
  loader: () => loadProjectList(),
  component: RouteComponent,
  head: ({ loaderData }) => seoHead({ jsonLd: loaderData?.projects ? projectListJsonLd(loaderData.projects) : null, title: "Portfólio: projetos de arquitetura e reforma em SP | Bewild", description: "Projetos de arquitetura, engenharia e reforma de apartamento em SP: veja apartamentos entregues pela Bewild em São Paulo, prontos para morar ou alugar.", path: "/portfolio", keywords: "projeto de arquitetura em São Paulo, escritório de arquitetura e engenharia, projeto de interiores, reforma de apartamento em SP, apartamentos reformados em SP, antes e depois reforma apartamento, portfólio de arquitetura e reformas em SP, Bewild" }),
});

function RouteComponent() {
  const projects = Route.useLoaderData()?.projects ?? null;
  return <BewildPortfolioPage initialProjects={projects} />;
}
