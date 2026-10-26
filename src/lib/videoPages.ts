/**
 * Páginas de vídeo: /videos (índice) e /videos/<slug> (uma por vídeo).
 *
 * O Google só indexa vídeo que está numa "página de exibição": a página cujo
 * assunto principal é UM vídeo, com o player presente quando a página abre,
 * sem depender de clique (https://developers.google.com/search/docs/appearance/video
 * e o relatório "Indexação de vídeos" do Search Console). Vídeo dentro de
 * artigo ou em janela modal fica de fora ("O vídeo não está em uma página de
 * exibição"). Por isso cada vídeo do site tem a própria página aqui.
 *
 * Cadastro: src/content/videoPages.json (endereço, tipo, título e descrição da
 * página, artigo relacionado). Os dados do vídeo em si (nome, descrição,
 * miniatura, duração, data) vêm de src/content/videoMeta.json, a mesma fonte
 * do VideoObject dos artigos. O sitemap (scripts/sitemap-build.mjs) lê os
 * mesmos dois arquivos; as funções de borda `sitemap` e `not-found-check`
 * repetem só a lista de endereços (conferida em videoPages.test.tsx).
 *
 * Módulo puro: sem cliente do backend, pode ser importado por qualquer rota.
 */
import registry from "@/content/videoPages.json";
import { bewildCalendarDay } from "@/lib/postSeo";
import { fileMeta, videoUploadDate, ytMeta } from "@/lib/videoMeta";
import { isoDurationSeconds, youtubeEmbedUrl, youtubeThumbnailUrl } from "@/lib/youtube";
import { VIDEO_CREATOR } from "@/lib/orgJsonLd";

const BASE = "https://bewild.com.br";

type RegistryEntry = {
  slug: string;
  /** Tipo do vídeo, mostrado como rótulo: "Entrevista", "Depoimento"… */
  kind: string;
  /** <title> da página (sem a marca; ela entra quando cabe em 60 caracteres). */
  title: string;
  /** Meta description da página (até 160 caracteres). */
  description: string;
  /** Vídeo do YouTube: o ID de 11 caracteres. */
  youtube?: string;
  /** Vídeo hospedado no site: caminho do arquivo .mp4. */
  file?: string;
  /** Legendas (.vtt) do vídeo hospedado no site. */
  captions?: string;
  /**
   * Tamanho do vídeo como ele aparece na tela (já com a rotação aplicada).
   * Sem isso a página assume 16:9 (1280 × 720), o padrão do YouTube.
   */
  width?: number;
  height?: number;
  /** Artigo de /conteudos que trata do mesmo assunto. */
  post?: { slug: string; label: string };
};

export type VideoPage = {
  slug: string;
  kind: string;
  title: string;
  description: string;
  youtubeId: string | null;
  file: string | null;
  captions: string | null;
  post: { slug: string; label: string } | null;
  /** Nome do vídeo (H1 da página e `name` do VideoObject). */
  name: string;
  /** Descrição do vídeo (texto da página e `description` do VideoObject). */
  about: string;
  /** Miniatura em URL absoluta: a MESMA no JSON-LD, no sitemap e no og:image. */
  thumbnail: string;
  /** Miniatura como a página carrega (caminho relativo quando é do próprio site). */
  thumbnailSrc: string;
  /** Largura e altura do vídeo na tela; a caixa do player segue essa proporção. */
  width: number;
  height: number;
  /** ISO 8601 ("PT9M49S") ou null quando a duração não está cadastrada. */
  duration: string | null;
  /** ISO 8601 com fuso ou null quando a data não está cadastrada. */
  uploadDate: string | null;
};

const abs = (u: string) => (/^https?:\/\//i.test(u) ? u : `${BASE}${u.startsWith("/") ? u : `/${u}`}`);

function build(entry: RegistryEntry): VideoPage {
  const meta = entry.youtube ? ytMeta(entry.youtube) : entry.file ? fileMeta(entry.file) : {};
  const thumb = meta.thumbnailUrl || (entry.youtube ? youtubeThumbnailUrl(entry.youtube) : "");
  return {
    slug: entry.slug,
    kind: entry.kind,
    title: entry.title,
    description: entry.description,
    youtubeId: entry.youtube ?? null,
    file: entry.file ?? null,
    captions: entry.captions ?? null,
    post: entry.post ?? null,
    name: meta.name || entry.title,
    about: meta.description || entry.description,
    thumbnail: thumb ? abs(thumb) : "",
    thumbnailSrc: thumb,
    width: entry.width && entry.height ? entry.width : 1280,
    height: entry.width && entry.height ? entry.height : 720,
    duration: meta.duration ?? null,
    uploadDate: videoUploadDate(meta.uploadDate) ?? null,
  };
}

/** Todos os vídeos com página própria, na ordem do cadastro (a ordem do índice). */
export const VIDEO_PAGES: VideoPage[] = (registry as RegistryEntry[]).map(build);

export const VIDEOS_PATH = "/videos";

export function videoPagePath(slug: string): string {
  return `${VIDEOS_PATH}/${slug}`;
}

export function videoPageBySlug(slug: string): VideoPage | null {
  return VIDEO_PAGES.find((v) => v.slug === slug) ?? null;
}

/** Página do vídeo que acompanha um artigo de /conteudos (ou null). */
export function videoPageForPost(postSlug: string | null | undefined): VideoPage | null {
  if (!postSlug) return null;
  return VIDEO_PAGES.find((v) => v.post?.slug === postSlug) ?? null;
}

/** Endereço do player do YouTube da página (sem cookies até o play), ou null. */
export function videoEmbedUrl(video: VideoPage): string | null {
  return video.youtubeId ? youtubeEmbedUrl(video.youtubeId) : null;
}

/** Endereço do vídeo no YouTube, para quem prefere assistir lá. */
export function videoYouTubeUrl(video: VideoPage): string | null {
  return video.youtubeId ? `https://www.youtube.com/watch?v=${video.youtubeId}` : null;
}

/**
 * Tamanho do player no HTML: a proporção do vídeo, com no máximo 960 px no lado
 * maior de um vídeo deitado e 540 px de altura num vídeo em pé (o CSS ajusta à tela).
 */
export function videoPlayerSize(video: Pick<VideoPage, "width" | "height">): { width: number; height: number; ratio: number } {
  const ratio = video.width / video.height;
  const height = Math.min(540, video.height);
  return { width: Math.round(height * ratio), height, ratio: Math.round(ratio * 10000) / 10000 };
}

/** "9 min 49 s", "1 min 55 s", "45 s"; vazio quando a duração não é conhecida. */
export function formatVideoDuration(iso: string | null | undefined): string {
  const total = isoDurationSeconds(iso);
  if (!total) return "";
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h ? `${h} h` : "", m ? `${m} min` : "", s ? `${s} s` : ""].filter(Boolean).join(" ");
}

/** "06/10/2026": o dia civil em São Paulo da data de envio. */
export function formatVideoDay(iso: string | null | undefined): string {
  const day = bewildCalendarDay(iso);
  if (!day) return "";
  const [y, m, d] = day.split("-");
  return `${d}/${m}/${y}`;
}

export type JsonLdNode = Record<string, unknown>;

/**
 * VideoObject da página do vídeo. `embedUrl` é o endereço do player que a
 * página mostra (YouTube); `contentUrl` é o arquivo do vídeo hospedado no
 * site. Um ou outro, conforme o vídeo: nada de endereço que a página não usa.
 */
export function videoObjectJsonLd(video: VideoPage): JsonLdNode {
  const url = `${BASE}${videoPagePath(video.slug)}`;
  const embed = videoEmbedUrl(video);
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "@id": `${url}#video`,
    name: video.name,
    description: video.about,
    thumbnailUrl: [video.thumbnail],
    ...(video.uploadDate ? { uploadDate: video.uploadDate } : {}),
    ...(video.duration ? { duration: video.duration } : {}),
    ...(embed ? { embedUrl: embed } : {}),
    ...(video.file ? { contentUrl: abs(video.file) } : {}),
    url,
    inLanguage: "pt-BR",
    isFamilyFriendly: true,
    publisher: { "@id": `${BASE}/#org` },
    creator: VIDEO_CREATOR,
    mainEntityOfPage: { "@id": `${url}#webpage` },
  };
}

/** O vídeo é a entidade principal da página (entra por cima do WebPage do seoHead). */
export function videoPageNodeJsonLd(video: VideoPage): JsonLdNode {
  return { mainEntity: { "@id": `${BASE}${videoPagePath(video.slug)}#video` } };
}

/** ItemList do índice /videos: um item por página de vídeo. */
export function videoListJsonLd(videos: VideoPage[] = VIDEO_PAGES): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: videos.map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${BASE}${videoPagePath(v.slug)}`,
      name: v.name,
      image: v.thumbnail,
    })),
  };
}

/** Título e descrição do índice /videos (servidor e navegador usam o mesmo). */
export const VIDEOS_HUB_SEO = {
  title: "Vídeos de reforma de studios e apartamentos em SP",
  description:
    "Entrevistas, estudos de custo e depoimentos de clientes da Bewild sobre reforma de studios e apartamentos em São Paulo, cada vídeo em página própria.",
} as const;
