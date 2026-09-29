import { createFileRoute } from "@tanstack/react-router";
import BewildProjectPage from "@/pages/BewildProjectPage";
import { seoHead } from "@/lib/routeHead";
import { loadProjectSeo } from "@/lib/seoLoaders";

export const Route = createFileRoute("/portfolio/$slug")({
  loader: ({ params }) => loadProjectSeo(params.slug),
  component: RouteComponent,
  head: ({ loaderData, params }) =>
    seoHead({
      title: loaderData?.title ?? "Reforma de apartamento em São Paulo | Bewild",
      description:
        loaderData?.description ??
        "Projeto, obra e marcenaria integrados pela Bewild em São Paulo.",
      path: `/portfolio/${params.slug}`,
      ogImage: loaderData?.ogImage,
      noindex: loaderData?.notFound,
    }),
});

function RouteComponent() {
  const { slug } = Route.useParams();
  return <BewildProjectPage slug={slug} />;
}
