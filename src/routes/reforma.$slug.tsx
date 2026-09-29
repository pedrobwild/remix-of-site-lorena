import { createFileRoute } from "@tanstack/react-router";
import BairroPage from "@/pages/BairroPage";
import { seoHead } from "@/lib/routeHead";
import { loadBairroSeo } from "@/lib/seoLoaders";

export const Route = createFileRoute("/reforma/$slug")({
  loader: ({ params }) => loadBairroSeo(params.slug),
  component: RouteComponent,
  head: ({ loaderData, params }) =>
    seoHead({
      title:
        loaderData?.title ??
        "Reforma de apartamento em São Paulo: projetos e orçamento | Bewild",
      description:
        loaderData?.description ??
        "Apartamentos reformados pela Bewild em São Paulo: fotos reais de cada obra e orçamento sem custo.",
      path: `/reforma/${params.slug}`,
      noindex: loaderData?.notFound,
    }),
});

function RouteComponent() {
  const { slug } = Route.useParams();
  return <BairroPage slug={slug} />;
}
