import VideoWatchPage from "@/pages/VideoWatchPage";
import { videoPageBySlug } from "@/lib/videoPages";

/**
 * Invólucro da rota /videos/$slug: resolve o vídeo pelo slug AQUI, no pedaço
 * da página (separado pelo roteador), e não no arquivo da rota — lá o cadastro
 * dos vídeos entraria no pacote inicial de toda página.
 */
export default function VideoWatchRoutePage({ slug }: { slug: string }) {
  const video = videoPageBySlug(slug);
  if (!video) return null;
  return <VideoWatchPage key={video.slug} video={video} />;
}
