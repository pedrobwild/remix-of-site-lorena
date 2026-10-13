import { createFileRoute } from "@tanstack/react-router";
import VideosPage from "@/pages/VideosPage";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";
import { brandTitle } from "@/lib/seoTitle";
import { VIDEOS_HUB_SEO, VIDEOS_PATH, videoListJsonLd } from "@/lib/videoPages";

// Índice dos vídeos. Não é página de exibição (lista vários vídeos): quem o
// Google indexa como vídeo são as páginas /videos/<slug>.
export const Route = createFileRoute("/videos/")({
  component: VideosPage,
  head: ({ matches }) =>
    seoHead({ pagesSeo: rootPagesSeo(matches),
      title: brandTitle(VIDEOS_HUB_SEO.title),
      description: VIDEOS_HUB_SEO.description,
      path: VIDEOS_PATH,
      jsonLd: [videoListJsonLd()],
    }),
});
