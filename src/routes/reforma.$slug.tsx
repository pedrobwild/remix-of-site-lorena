import { createFileRoute } from "@tanstack/react-router";
import BairroPage from "@/pages/BairroPage";
import { seoHead } from "@/lib/routeHead";
import { loadBairroContent } from "@/lib/contentLoaders";
import { bairroProjects, projectListJsonLd } from "@/lib/contentJsonLd";
import { faqJsonLd } from "@/lib/useSeo";
import { bairroContent } from "@/content/bairros";

export const Route = createFileRoute("/reforma/$slug")({
  loader: ({ params }) => loadBairroContent(params.slug),
  component: RouteComponent,
  head: ({ loaderData: ld, params }) => {
    const loaderData = ld?.seo;
    return seoHead({
      title:
        loaderData?.title ??
        "Reforma de apartamento em São Paulo: projetos e orçamento | Bewild",
      description:
        loaderData?.description ??
        "Apartamentos reformados pela Bewild em São Paulo: fotos reais de cada obra e orçamento sem custo.",
      path: `/reforma/${params.slug}`,
      noindex: !ld || loaderData?.notFound,
      jsonLd: ld?.projects
        ? [
            ...projectListJsonLd(bairroProjects(ld.projects, params.slug)),
            // FAQ do bairro (src/content/bairros.ts): só nos bairros com texto próprio.
            ...(bairroContent(params.slug) ? [faqJsonLd(bairroContent(params.slug)!.faq)] : []),
          ]
        : null,
    });
  },
});

function RouteComponent() {
  const { slug } = Route.useParams();
  const projects = Route.useLoaderData()?.projects ?? null;
  return <BairroPage slug={slug} initialProjects={projects} />;
}
