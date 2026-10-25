import { createFileRoute } from "@tanstack/react-router";
import BewildPortfolioPage from "@/pages/BewildPortfolioPage";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";
import { loadPageSeo } from "@/lib/pageSeo.functions";
import { resolvePageSeo } from "@/lib/pageSeo";
// Import tardio: o loader da rota entra no pacote de TODA página; assim os
// carregadores de conteúdo (posts, projetos, vídeos…) só baixam quando usados.
const contentLoaders = () => import("@/lib/contentLoaders");
// Os dados estruturados são montados no loader (import tardio): o head() roda
// no pacote de toda página, e o montador puxa vídeos, posts e projetos.

export const Route = createFileRoute("/portfolio/")({
  loader: async () => {
    const [content, seo] = await Promise.all([contentLoaders().then((m) => m.loadProjectList()), loadPageSeo({ data: "/portfolio" })]);
    const jsonLd = content.projects ? (await import("@/lib/routeHeadData")).projectListJsonLd(content.projects) : null;
    return { ...content, seo, jsonLd };
  },
  component: RouteComponent,
  head: ({ loaderData, matches }) => seoHead({ pagesSeo: rootPagesSeo(matches), jsonLd: loaderData?.jsonLd ?? null, ...(loaderData?.seo ?? resolvePageSeo("/portfolio")), path: "/portfolio", keywords: "projeto de arquitetura em São Paulo, escritório de arquitetura e engenharia, projeto de interiores, reforma de apartamento em SP, apartamentos reformados em SP, antes e depois reforma apartamento, portfólio de arquitetura e reformas em SP, Bewild" }),
});

function RouteComponent() {
  const projects = Route.useLoaderData()?.projects ?? null;
  return <BewildPortfolioPage initialProjects={projects} />;
}
