import { createFileRoute } from "@tanstack/react-router";
import BewildProjectPage from "@/pages/BewildProjectPage";
import { seoHead } from "@/lib/routeHead";
import { loadProjectContent } from "@/lib/contentLoaders";

export const Route = createFileRoute("/portfolio/$slug")({
  loader: ({ params }) => loadProjectContent(params.slug),
  component: RouteComponent,
  head: ({ loaderData: ld, params }) => {
    const loaderData = ld?.seo;
    return seoHead({
      title: loaderData?.title ?? "Reforma de apartamento em São Paulo | Bewild",
      description:
        loaderData?.description ??
        "Projeto, obra e marcenaria integrados pela Bewild em São Paulo.",
      path: `/portfolio/${params.slug}`,
      ogImage: loaderData?.ogImage,
      noindex: loaderData?.notFound,
    });
  },
});

function RouteComponent() {
  const { slug } = Route.useParams();
  const data = Route.useLoaderData() ?? {};
  return (
    <BewildProjectPage
      slug={slug}
      initial={data.project === undefined ? null : { project: data.project }}
      initialPeers={data.peers ?? null}
    />
  );
}
