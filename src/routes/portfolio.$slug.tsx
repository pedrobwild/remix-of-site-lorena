import { createFileRoute } from "@tanstack/react-router";
import BewildProjectPage from "@/pages/BewildProjectPage";
import { seoHead } from "@/lib/routeHead";
import { loadProjectContent } from "@/lib/contentLoaders";
import { projectPageJsonLd } from "@/lib/contentJsonLd";
import { projectCoverImage, WIDE_SIZES } from "@/lib/imageUrl";

export const Route = createFileRoute("/portfolio/$slug")({
  loader: ({ params }) => loadProjectContent(params.slug),
  component: RouteComponent,
  head: ({ loaderData: ld, params }) => {
    const loaderData = ld?.seo;
    const head = seoHead({
      title: loaderData?.title ?? "Reforma de apartamento em São Paulo | Bewild",
      description:
        loaderData?.description ??
        "Projeto, obra e marcenaria integrados pela Bewild em São Paulo.",
      path: `/portfolio/${params.slug}`,
      ogImage: loaderData?.ogImage,
      noindex: !ld || loaderData?.notFound,
      jsonLd: ld?.project ? projectPageJsonLd(ld.project) : null,
    });
    // Capa = maior elemento visível (LCP): o navegador começa a baixá-la junto
    // com o HTML, antes do JS. Mesma regra de fallback da página (1ª da galeria).
    const cover = ld?.project?.cover_url || ld?.project?.gallery_urls?.find((u) => !!u?.trim());
    if (cover) {
      const { src, srcSet } = projectCoverImage(cover);
      head.links = [
        ...head.links,
        {
          rel: "preload",
          as: "image",
          href: src,
          ...(srcSet ? { imageSrcSet: srcSet, imageSizes: WIDE_SIZES } : {}),
          fetchPriority: "high",
        },
      ];
    }
    return head;
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
