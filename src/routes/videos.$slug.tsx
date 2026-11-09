import { createFileRoute } from "@tanstack/react-router";
import VideoWatchRoutePage from "@/pages/VideoWatchRoutePage";
import { seoHead } from "@/lib/routeHead";
import { brandTitle } from "@/lib/seoTitle";
import { NOT_FOUND_SEO } from "@/lib/notFoundSeo";
// Import tardio: o loader da rota entra no pacote de TODA página; assim os
// carregadores de conteúdo (posts, projetos, vídeos…) só baixam quando usados.
const contentLoaders = () => import("@/lib/contentLoaders");
// O cadastro dos vídeos e os montadores de JSON-LD (src/lib/videoPages.ts,
// postSeo, youtube — ~25 kB) também só por import dinâmico no loader.
const videoPages = () => import("@/lib/videoPages");

type VideoSeo = {
  title: string;
  description: string;
  path: string;
  ogImage: string;
  ogImageAlt: string;
  jsonLd: Array<Record<string, unknown>>;
  pageJsonLd: Record<string, unknown>;
};

// Página de um vídeo: o player sai no HTML do servidor e o VideoObject no head.
// Os vídeos vêm do cadastro (src/content/videoPages.json), sem consulta ao banco;
// endereço fora do cadastro segue o redirecionamento do painel ou responde 404.
export const Route = createFileRoute("/videos/$slug")({
  loader: async ({ params }) => {
    const m = await videoPages();
    const video = m.videoPageBySlug(params.slug);
    if (!video) return contentLoaders().then((c) => c.notFoundOrRedirect(m.videoPagePath(params.slug)));
    const seo: VideoSeo = {
      title: brandTitle(video.title),
      description: video.description,
      path: m.videoPagePath(video.slug),
      // A mesma miniatura do VideoObject e do sitemap de vídeo.
      ogImage: video.thumbnail,
      ogImageAlt: `Miniatura do vídeo: ${video.name}`,
      jsonLd: [m.videoObjectJsonLd(video)],
      pageJsonLd: m.videoPageNodeJsonLd(video),
    };
    return { slug: params.slug, seo };
  },
  component: RouteComponent,
  head: ({ params, loaderData }) => {
    // Sem loaderData = o loader lançou notFound() (404).
    const seo = loaderData?.seo;
    if (!seo) {
      return seoHead({
        title: NOT_FOUND_SEO.title,
        description: NOT_FOUND_SEO.description,
        path: `/videos/${params.slug}`,
        noindex: true,
      });
    }
    return seoHead(seo);
  },
});

function RouteComponent() {
  const { slug } = Route.useParams();
  return <VideoWatchRoutePage slug={slug} />;
}
