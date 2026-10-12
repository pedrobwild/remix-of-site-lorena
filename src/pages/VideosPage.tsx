/**
 * VideosPage — /videos. Índice dos vídeos da Bewild: cada cartão leva à página
 * própria do vídeo (/videos/<slug>), que é a que o Google indexa como vídeo
 * (ver src/lib/videoPages.ts). A entrevista da Record News aparece na faixa
 * "Na imprensa" só como link: o vídeo é hospedado pela emissora.
 */
import BwaFooter from "@/components/BwaFooter";
import BwaImprensa from "@/components/BwaImprensa";
import BwaNav from "@/components/BwaNav";
import { VideoCards, VideoCta } from "@/components/VideoBlocks";
import { brandTitle } from "@/lib/seoTitle";
import { useSeo } from "@/lib/useSeo";
import { VIDEO_PAGES, VIDEOS_HUB_SEO, VIDEOS_PATH } from "@/lib/videoPages";
import "@/styles/conteudos.css";
import "@/styles/videos.css";

export default function VideosPage() {
  useSeo({
    title: brandTitle(VIDEOS_HUB_SEO.title),
    description: VIDEOS_HUB_SEO.description,
    canonicalPath: VIDEOS_PATH,
    ogType: "website",
  });

  return (
    <>
      <div className="bw-conteudos bw-videos">
        <BwaNav />

        <main id="main" tabIndex={-1}>
          <section className="ct-hero">
            <div className="ct-wrap">
              <p className="ct-eyb">Conteúdos · vídeos</p>
              <h1>Reforma de studios e apartamentos, <span className="accent">em vídeo.</span></h1>
              <p className="ct-lead">
                Entrevistas, estudos de custo e depoimentos de clientes da Bewild. Cada vídeo tem página
                própria e, quando existe, o artigo completo sobre o assunto.
              </p>
            </div>
          </section>

          <section className="ct-body" aria-labelledby="videos-lista">
            <div className="ct-wrap">
              <div className="ct-secmark">
                <span className="n">001</span>
                <span className="t" id="videos-lista">Todos os vídeos</span>
                <span className="ln" />
              </div>
              <VideoCards videos={VIDEO_PAGES} />
            </div>
          </section>

          <BwaImprensa />

          <VideoCta />
        </main>
      </div>

      <BwaFooter />
    </>
  );
}
