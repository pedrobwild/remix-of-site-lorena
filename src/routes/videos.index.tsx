import { createFileRoute } from "@tanstack/react-router";
import VideosPage from "@/pages/VideosPage";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";
import { brandTitle } from "@/lib/seoTitle";
// Conteúdo da página (JSON-LD, FAQ, textos) só por import dinâmico no loader:
// o head() e o loader de toda rota entram no pacote inicial de QUALQUER página
// (velocidade, 09/11/2026). Ver "montadores pesados" em routesCodeSplit.test.ts.

// Índice dos vídeos. Não é página de exibição (lista vários vídeos): quem o
// Google indexa como vídeo são as páginas /videos/<slug>.
export const Route = createFileRoute("/videos/")({
  loader: async () => {
    const m = await import("@/lib/videoPages");
    return { title: brandTitle(m.VIDEOS_HUB_SEO.title), description: m.VIDEOS_HUB_SEO.description, path: m.VIDEOS_PATH, jsonLd: [m.videoListJsonLd()] };
  },
  component: VideosPage,
  head: ({ loaderData, matches }) =>
    seoHead({ pagesSeo: rootPagesSeo(matches),
      title: loaderData?.title ?? brandTitle("Vídeos"),
      description: loaderData?.description ?? "Vídeos da Bewild sobre reforma de apartamento em São Paulo.",
      path: loaderData?.path ?? "/videos",
      jsonLd: loaderData?.jsonLd ?? null,
    }),
});
