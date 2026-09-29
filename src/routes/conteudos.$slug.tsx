import { createFileRoute } from "@tanstack/react-router";
import BewildPostPage from "@/pages/BewildPostPage";
import { seoHead } from "@/lib/routeHead";
import { loadPostSeo } from "@/lib/seoLoaders";

export const Route = createFileRoute("/conteudos/$slug")({
  loader: ({ params }) => loadPostSeo(params.slug),
  component: RouteComponent,
  head: ({ loaderData, params }) =>
    seoHead({
      title: loaderData?.title ?? "Conteúdos | Bewild",
      description:
        loaderData?.description ??
        "Guias práticos da Bewild sobre arquitetura, engenharia e reforma de apartamento em São Paulo.",
      path: `/conteudos/${params.slug}`,
      ogImage: loaderData?.ogImage,
      ogType: "article",
      noindex: loaderData?.notFound,
    }),
});

function RouteComponent() {
  const { slug } = Route.useParams();
  return <BewildPostPage slug={slug} />;
}
