import { createFileRoute } from "@tanstack/react-router";
import BewildProjectPage from "@/pages/BewildProjectPage";
import { seoHead } from "@/lib/routeHead";
import { loadProjectContent } from "@/lib/contentLoaders";
import { projectPageJsonLd } from "@/lib/contentJsonLd";

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
      noindex: !ld || loaderData?.notFound,
      jsonLd: ld?.project ? projectPageJsonLd(ld.project) : null,
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
