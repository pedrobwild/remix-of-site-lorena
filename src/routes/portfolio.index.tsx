import { createFileRoute } from "@tanstack/react-router";
import BewildPortfolioPage from "@/pages/BewildPortfolioPage";
import { seoHead } from "@/lib/routeHead";
import { loadPageSeo } from "@/lib/pageSeo.functions";
import { resolvePageSeo } from "@/lib/pageSeo";
import { loadProjectList } from "@/lib/contentLoaders";
import { projectListJsonLd } from "@/lib/contentJsonLd";

export const Route = createFileRoute("/portfolio/")({
  loader: async () => {
    const [content, seo] = await Promise.all([loadProjectList(), loadPageSeo({ data: "/portfolio" })]);
    return { ...content, seo };
  },
  component: RouteComponent,
  head: ({ loaderData }) => seoHead({ jsonLd: loaderData?.projects ? projectListJsonLd(loaderData.projects) : null, ...(loaderData?.seo ?? resolvePageSeo("/portfolio")), path: "/portfolio", keywords: "projeto de arquitetura em São Paulo, escritório de arquitetura e engenharia, projeto de interiores, reforma de apartamento em SP, apartamentos reformados em SP, antes e depois reforma apartamento, portfólio de arquitetura e reformas em SP, Bewild" }),
});

function RouteComponent() {
  const projects = Route.useLoaderData()?.projects ?? null;
  return <BewildPortfolioPage initialProjects={projects} />;
}
