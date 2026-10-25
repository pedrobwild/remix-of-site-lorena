import { createFileRoute } from "@tanstack/react-router";
import BewildProjectPage from "@/pages/BewildProjectPage";
import { seoHead } from "@/lib/routeHead";
// Import tardio: o loader da rota entra no pacote de TODA página; assim os
// carregadores de conteúdo (posts, projetos, vídeos…) só baixam quando usados.
const contentLoaders = () => import("@/lib/contentLoaders");
import { projectPageJsonLd } from "@/lib/contentJsonLd";
import { projectKeywords } from "@/lib/projectSeo";
import { projectCoverImage, WIDE_SIZES } from "@/lib/imageUrl";

export const Route = createFileRoute("/portfolio/$slug")({
  loader: ({ params }) => contentLoaders().then((m) => m.loadProjectContent(params.slug)),
  component: RouteComponent,
  head: ({ loaderData: ld, params }) => {
    const loaderData = ld?.seo;
    const head = seoHead({
      title: loaderData?.title ?? "Reforma de apartamento em São Paulo | Bewild",
      description:
        loaderData?.description ??
        "Projeto, obra e marcenaria integrados pela Bewild em São Paulo.",
      path: `/portfolio/${params.slug}`,
      keywords: ld?.project ? projectKeywords(ld.project) : undefined,
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
      initial={data.project === undefined ? null : { project: data.project, alts: data.alts }}
      initialPeers={data.peers ?? null}
    />
  );
}
