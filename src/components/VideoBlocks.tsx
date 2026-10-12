/**
 * Blocos compartilhados pelas páginas de vídeo (/videos e /videos/<slug>):
 * a grade de cartões e a chamada final para o orçamento. Usam as classes
 * .ct-* de src/styles/conteudos.css e as .vd-* de src/styles/videos.css.
 */
import { PROVA_CURTA } from "@/content/provas";
import { whatsappHref } from "@/components/landing/content";
import { formatVideoDuration, videoPagePath, type VideoPage } from "@/lib/videoPages";

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

type CardsProps = {
  videos: VideoPage[];
  /** Nível do título de cada cartão (h2 no índice, h3 em "Mais vídeos"). */
  heading?: "h2" | "h3";
  /** Três colunas no desktop (lista de apoio); o padrão são duas (índice). */
  compact?: boolean;
};

/** Cartões que levam à página de cada vídeo. A miniatura é a mesma do JSON-LD. */
export function VideoCards({ videos, heading: Heading = "h2", compact = false }: CardsProps) {
  return (
    <ul className={`vd-grid${compact ? " vd-grid--3" : ""}`}>
      {videos.map((v) => {
        const duration = formatVideoDuration(v.duration);
        return (
          <li key={v.slug}>
            <a
              href={videoPagePath(v.slug)}
              className="ct-card vd-card"
              aria-label={`Assistir: ${v.name}${duration ? ` (${duration})` : ""}`}
            >
              <div className="ct-card__media vd-card__media">
                {/* Decorativa: o nome do vídeo já está no rótulo do link. */}
                <img src={v.thumbnailSrc} alt="" width={1280} height={720} loading="lazy" decoding="async" />
                <span className="vd-card__play" aria-hidden="true"><IconPlay /></span>
                {duration ? <span className="vd-card__dur">{duration}</span> : null}
              </div>
              <div className="ct-card__body">
                <div className="ct-card__cat">{v.kind}</div>
                <Heading className="ct-card__title">{v.name}</Heading>
                <p className="ct-card__excerpt">{v.about}</p>
              </div>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/** Chamada final: o mesmo texto do CTA dos artigos de reforma (BewildPostPage). */
export function VideoCta() {
  return (
    <section className="ct-cta">
      <div className="ct-cta__inner">
        <span className="ct-eyb center">Orçamento sem compromisso</span>
        <h2>Sabe o que quer. <span className="accent">Falta saber quanto e quando.</span></h2>
        <p>Envie a planta ou os dados do imóvel e receba escopo, prazo e investimento estimados.</p>
        <div className="ct-cta__act">
          <a href="/orcamento" className="ct-btn cyan">Solicitar orçamento <span className="ar"><IconArrow /></span></a>
          <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="ct-btn ghost">Falar no WhatsApp</a>
        </div>
        <div className="ct-cta__rea">{PROVA_CURTA}</div>
      </div>
    </section>
  );
}
