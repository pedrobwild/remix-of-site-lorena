/**
 * VideoWatchPage — /videos/<slug>. A página de UM vídeo.
 *
 * É a "página de exibição" que o Google exige para indexar um vídeo: o vídeo é
 * o assunto principal e o player já vem no HTML do servidor, no tamanho e na
 * posição finais, sem depender de clique. NÃO trocar o <iframe>/<video> por
 * miniatura com "clique para carregar": com isso o Search Console responde
 * "não foi possível determinar a posição e o tamanho do vídeo" e o vídeo não
 * é indexado. (Nos artigos a miniatura com clique continua valendo.)
 *
 * Os dados vêm de src/lib/videoPages.ts (cadastro em src/content).
 */
import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { VideoCards, VideoCta } from "@/components/VideoBlocks";
import { brandTitle } from "@/lib/seoTitle";
import { useSeo } from "@/lib/useSeo";
import {
  VIDEO_PAGES,
  VIDEOS_PATH,
  formatVideoDay,
  formatVideoDuration,
  videoEmbedUrl,
  videoPagePath,
  videoPlayerSize,
  videoYouTubeUrl,
  type VideoPage,
} from "@/lib/videoPages";
import { YOUTUBE_IFRAME_ALLOW, YOUTUBE_IFRAME_REFERRER } from "@/lib/youtube";
import type { CSSProperties } from "react";
import "@/styles/conteudos.css";
import "@/styles/videos.css";

export default function VideoWatchPage({ video }: { video: VideoPage }) {
  useSeo({
    title: brandTitle(video.title),
    description: video.description,
    canonicalPath: videoPagePath(video.slug),
    ogType: "website",
    ogImage: video.thumbnail || undefined,
    ogImageAlt: `Miniatura do vídeo: ${video.name}`,
  });

  const embedUrl = videoEmbedUrl(video);
  // A caixa do player nasce na proporção do vídeo (16:9 ou em pé), já no HTML.
  const size = videoPlayerSize(video);
  const playerStyle = { "--vd-ratio": size.ratio } as CSSProperties;
  const youtubeUrl = videoYouTubeUrl(video);
  const duration = formatVideoDuration(video.duration);
  const day = formatVideoDay(video.uploadDate);
  const others = VIDEO_PAGES.filter((v) => v.slug !== video.slug);

  return (
    <>
      <div className="bw-conteudos bw-videos">
        <BwaNav />

        <main id="main" tabIndex={-1}>
          <article>
            <section className="ct-hero vd-hero">
              <div className="ct-wrap">
                <nav className="vd-crumb" aria-label="Você está em">
                  <a href={VIDEOS_PATH}>Vídeos</a>
                  <span aria-hidden="true">›</span>
                  <span>{video.kind}</span>
                </nav>
                <h1>{video.name}</h1>
              </div>
            </section>

            <section className="vd-stage">
              <div className="ct-wrap vd-stage__grid" style={playerStyle}>
                <div className="vd-player">
                  {embedUrl ? (
                    <iframe
                      src={embedUrl}
                      title={video.name}
                      width={size.width}
                      height={size.height}
                      allow={YOUTUBE_IFRAME_ALLOW}
                      referrerPolicy={YOUTUBE_IFRAME_REFERRER}
                      allowFullScreen
                    />
                  ) : video.file ? (
                    <video
                      controls
                      playsInline
                      preload="none"
                      poster={video.thumbnailSrc || undefined}
                      width={size.width}
                      height={size.height}
                      aria-label={video.name}
                    >
                      <source src={video.file} type="video/mp4" />
                      {video.captions ? (
                        <track kind="captions" label="Português" srcLang="pt" src={video.captions} default />
                      ) : null}
                    </video>
                  ) : null}
                </div>

                <div className="vd-info">
                  <p className="vd-meta">
                    <span className="k">{video.kind}</span>
                    {duration ? <span>Duração: {duration}</span> : null}
                    {day && video.uploadDate ? (
                      <span>
                        Publicado em <time dateTime={video.uploadDate}>{day}</time>
                      </span>
                    ) : null}
                  </p>
                  <p className="vd-desc">{video.about}</p>

                  {video.post ? (
                    <p className="vd-post">
                      <span className="vd-post__eyb">Artigo completo</span>
                      <a href={`/conteudos/${video.post.slug}`}>{video.post.label}</a>
                    </p>
                  ) : null}

                  <div className="vd-actions">
                    {youtubeUrl ? (
                      <a className="ct-chip" href={youtubeUrl} target="_blank" rel="noopener noreferrer">
                        Assistir no YouTube
                      </a>
                    ) : null}
                    <a className="ct-chip" href={VIDEOS_PATH}>Todos os vídeos</a>
                  </div>
                </div>
              </div>
            </section>
          </article>

          {others.length > 0 ? (
            <section className="ct-body vd-more" aria-labelledby="videos-mais">
              <div className="ct-wrap">
                <div className="ct-secmark">
                  <span className="n">→</span>
                  <h2 className="t" id="videos-mais">Mais vídeos</h2>
                  <span className="ln" />
                </div>
                <VideoCards videos={others} heading="h3" compact />
              </div>
            </section>
          ) : null}

          <VideoCta />
        </main>
      </div>

      <BwaFooter />
    </>
  );
}
