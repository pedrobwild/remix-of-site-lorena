import { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/guia/components/ui/button";
import { YOUTUBE_IFRAME_ALLOW, YOUTUBE_IFRAME_REFERRER, youtubeEmbedUrl } from "@/lib/youtube";

type Props = { id: string; title: string; thumbnail: string };
export default function PostYouTubeVideo({ id, title, thumbnail }: Props) {
  const [playing, setPlaying] = useState(false);
  return (
    <figure className="pt-leading-video" aria-label={title}>
      {playing ? (
        <iframe src={`${youtubeEmbedUrl(id)}?autoplay=1`} title={title} allow={`${YOUTUBE_IFRAME_ALLOW}; autoplay`} referrerPolicy={YOUTUBE_IFRAME_REFERRER} allowFullScreen />
      ) : (
        <Button type="button" variant="ghost" className="pt-leading-video__preview" aria-label={`Reproduzir vídeo: ${title}`} onClick={() => setPlaying(true)}>
          <img src={thumbnail} alt={`Miniatura do vídeo: ${title}`} width={480} height={360} decoding="async" />
          <span className="pt-leading-video__play" aria-hidden="true"><Play /></span>
        </Button>
      )}
    </figure>
  );
}
