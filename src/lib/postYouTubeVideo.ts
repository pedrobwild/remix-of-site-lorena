import type { BewildPost } from "@/lib/useBewildPosts";
import { parseYouTubeId, youtubeThumbnailUrl } from "@/lib/youtube";
import { ytMeta } from "@/lib/videoMeta";

/** Mesmo título e miniatura no player e no JSON-LD. */
export function postYouTubeVideo(post: Pick<BewildPost, "youtube_video_id" | "title">) {
  const id = parseYouTubeId(post.youtube_video_id);
  if (!id) return null;
  const meta = ytMeta(id);
  return { id, title: meta.name || post.title, thumbnail: meta.thumbnailUrl || youtubeThumbnailUrl(id) };
}
