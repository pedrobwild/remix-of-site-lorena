import { createFileRoute } from "@tanstack/react-router";
import VideoWatchPage from "@/pages/VideoWatchPage";
import { seoHead } from "@/lib/routeHead";
import { brandTitle } from "@/lib/seoTitle";
import { NOT_FOUND_SEO } from "@/lib/seoLoaders";
import { notFoundOrRedirect } from "@/lib/contentLoaders";
import { videoObjectJsonLd, videoPageBySlug, videoPageNodeJsonLd, videoPagePath } from "@/lib/videoPages";

// Página de um vídeo: o player sai no HTML do servidor e o VideoObject no head.
// Os vídeos vêm do cadastro (src/content/videoPages.json), sem consulta ao banco;
// endereço fora do cadastro segue o redirecionamento do painel ou responde 404.
export const Route = createFileRoute("/videos/$slug")({
  loader: async ({ params }) => {
    if (!videoPageBySlug(params.slug)) return notFoundOrRedirect(videoPagePath(params.slug));
    return { slug: params.slug };
  },
  component: RouteComponent,
  head: ({ params, loaderData }) => {
    // Sem loaderData = o loader lançou notFound() (404).
    const video = loaderData ? videoPageBySlug(params.slug) : null;
    if (!video) {
      return seoHead({
        title: NOT_FOUND_SEO.title,
        description: NOT_FOUND_SEO.description,
        path: videoPagePath(params.slug),
        noindex: true,
      });
    }
    return seoHead({
      title: brandTitle(video.title),
      description: video.description,
      path: videoPagePath(video.slug),
      // A mesma miniatura do VideoObject e do sitemap de vídeo.
      ogImage: video.thumbnail,
      ogImageAlt: `Miniatura do vídeo: ${video.name}`,
      jsonLd: [videoObjectJsonLd(video)],
      pageJsonLd: videoPageNodeJsonLd(video),
    });
  },
});

function RouteComponent() {
  const { slug } = Route.useParams();
  const video = videoPageBySlug(slug);
  if (!video) return null;
  return <VideoWatchPage key={video.slug} video={video} />;
}
