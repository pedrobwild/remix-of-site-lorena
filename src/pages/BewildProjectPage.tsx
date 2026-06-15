/**
 * BewildProjectPage — /portfolio/:slug (novo, Bewild).
 *
 * Página de detalhe do portfólio. Cada seção (depoimento, antes/depois,
 * galeria, resultado, escopo) só renderiza quando há conteúdo, para que
 * projetos em obra ainda fiquem coerentes.
 *
 * Não toca em outras rotas. Visual reusa .bw-home + .bw-detail.
 */
import { useEffect, useMemo, useState, useCallback } from "react";
import { useSeo } from "@/lib/useSeo";
import BewildSiteNav from "@/components/BewildSiteNav";
import { CONTACT, whatsappHref } from "@/components/landing/content";
import { useBewildProject } from "@/lib/useBewildProject";
import { bewildTypeLabel } from "@/lib/useBewildProjects";
import NotFoundPage from "@/pages/NotFoundPage";
import "@/styles/home.css";
import "@/styles/portfolio-detail.css";

interface Props {
  slug: string;
}

function BrandLockup() {
  return (
    <span className="brand" aria-label="Bewild · Grupo Bwild">
      <span className="be">Be</span>
      <span className="wild">wild</span>
      <span className="sub">Grupo Bwild</span>
    </span>
  );
}

function Lightbox({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="bw-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Visualizar imagem"
      onClick={onClose}
    >
      <img
        className="bw-lightbox__img"
        src={images[index]}
        alt=""
        onClick={(e) => e.stopPropagation()}
      />
      <button
        type="button"
        className="bw-lightbox__btn bw-lightbox__close"
        aria-label="Fechar"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        ×
      </button>
      {images.length > 1 && (
        <>
          <button
            type="button"
            className="bw-lightbox__btn bw-lightbox__prev"
            aria-label="Anterior"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
          >
            ‹
          </button>
          <button
            type="button"
            className="bw-lightbox__btn bw-lightbox__next"
            aria-label="Próxima"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
          >
            ›
          </button>
          <span className="bw-lightbox__counter">
            {index + 1} / {images.length}
          </span>
        </>
      )}
    </div>
  );
}

export default function BewildProjectPage({ slug }: Props) {
  const { project, loading, error, notFound } = useBewildProject(slug);
  const [lbIndex, setLbIndex] = useState<number | null>(null);

  const gallery = useMemo(
    () => (project?.gallery_urls ?? []).filter(Boolean),
    [project],
  );

  const hasCase = !!(project?.challenge || project?.solution || project?.result_text);
  const hasBA = !!(project?.before_image_url && project?.after_image_url);
  const hasScope = (project?.scope ?? []).filter(Boolean).length > 0;

  useSeo({
    title: project
      ? project.seo_title ||
        `${project.title} · Portfólio Bewild`
      : "Projeto · Bewild",
    description:
      project?.seo_description ||
      project?.summary ||
      "Studio reformado pela Bewild em São Paulo.",
    canonicalPath: `/portfolio/${slug}`,
    ogType: "article",
    ogImage: project?.og_image_url || project?.cover_url || undefined,
  });

  const closeLb = useCallback(() => setLbIndex(null), []);
  const prevLb = useCallback(
    () => setLbIndex((i) => (i === null ? null : (i - 1 + gallery.length) % gallery.length)),
    [gallery.length],
  );
  const nextLb = useCallback(
    () => setLbIndex((i) => (i === null ? null : (i + 1) % gallery.length)),
    [gallery.length],
  );

  if (loading) {
    return (
      <div className="bw-home bw-detail">
        <BewildSiteNav />
        <div className="container">
          <div className="pd-skeleton" aria-busy="true" aria-live="polite" />
        </div>
      </div>
    );
  }

  if (notFound || (!project && !error)) return <NotFoundPage />;

  if (error || !project) {
    return (
      <div className="bw-home bw-detail">
        <BewildSiteNav />
        <div className="container" style={{ padding: "160px 28px", textAlign: "center" }}>
          <p>Não conseguimos carregar este projeto agora. <a href="/portfolio">Voltar ao portfólio</a>.</p>
        </div>
      </div>
    );
  }

  const where = project.neighborhood || project.location || "São Paulo";
  const metaParts = [where, project.area_m2 ? `${project.area_m2} m²` : null, project.duration].filter(Boolean);

  return (
    <div className="bw-home bw-detail">
      {/* NAV */}
      <BewildSiteNav />

      {/* HEADER */}
      <section className="pd-head">
        <div className="container">
          <a className="pd-back" href="/portfolio">← Portfólio</a>
          {project.project_type && (
            <span className="pd-pill">{bewildTypeLabel(project.project_type)}</span>
          )}
          <h1>{project.title}</h1>
          {metaParts.length > 0 && (
            <p className="pd-meta">{metaParts.join(" · ")}</p>
          )}
        </div>
      </section>

      {/* COVER */}
      <section style={{ paddingBottom: 32 }}>
        <div className="container">
          <div className={"pd-cover" + (!project.cover_url ? " pd-cover--empty" : "")}>
            {project.cover_url ? (
              <img
                src={project.cover_url}
                alt={project.cover_alt || `${project.title} — foto principal`}
                loading="eager"
                decoding="async"
              />
            ) : (
              <span>Foto principal do studio entregue</span>
            )}
          </div>
        </div>
      </section>

      {/* SUMÁRIO + CASE */}
      {(project.summary || hasCase) && (
        <section className="pd-section">
          <div className="container">
            {project.summary && <p className="pd-intro">{project.summary}</p>}
            {hasCase && (
              <div className="pd-case" style={{ marginTop: project.summary ? 32 : 0 }}>
                {project.challenge && (
                  <div className="pd-case__cell">
                    <div className="pd-case__lbl">Desafio</div>
                    <p>{project.challenge}</p>
                  </div>
                )}
                {project.solution && (
                  <div className="pd-case__cell">
                    <div className="pd-case__lbl">Solução</div>
                    <p>{project.solution}</p>
                  </div>
                )}
                {project.result_text && (
                  <div className="pd-case__cell">
                    <div className="pd-case__lbl">Resultado</div>
                    <p>{project.result_text}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ANTES E DEPOIS */}
      {hasBA && (
        <section className="pd-section">
          <div className="container">
            <h2>Antes e depois</h2>
            <div className="pd-ba">
              <div className="pd-ba__frame">
                <span className="pd-ba__badge">Antes</span>
                <img src={project.before_image_url!} alt="Antes da reforma" loading="lazy" />
              </div>
              <div className="pd-ba__frame">
                <span className="pd-ba__badge">Depois</span>
                <img src={project.after_image_url!} alt="Depois da reforma" loading="lazy" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* GALERIA */}
      {gallery.length > 0 && (
        <section className="pd-section">
          <div className="container">
            <h2>Fotos do projeto</h2>
            <div className="pd-gallery">
              {gallery.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  className={
                    "pd-gallery__item" + (i % 5 === 0 && i > 0 ? " pd-gallery__item--wide" : "")
                  }
                  onClick={() => setLbIndex(i)}
                  aria-label={`Abrir foto ${i + 1}`}
                >
                  <img src={src} alt={`${project.title} — foto ${i + 1}`} loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ESCOPO */}
      {hasScope && (
        <section className="pd-section pd-scope-wrap">
          <div className="container">
            <h2>O que foi feito</h2>
            <div className="pd-scope">
              {project.scope!.filter(Boolean).map((item, i) => (
                <div className="pd-scope__item" key={item + i}>
                  <span className="pd-scope__tick" aria-hidden="true">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* DEPOIMENTO */}
      {project.testimonial && (
        <section className="pd-section pd-depo">
          <div className="narrow">
            <h2>Depoimento</h2>
            <blockquote>{project.testimonial}</blockquote>
            {project.testimonial_author && (
              <p className="pd-depo__src">{project.testimonial_author}</p>
            )}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="pd-cta">
        <div className="container">
          <h2>Quer um resultado assim no seu studio?</h2>
          <p>
            Envie os dados do imóvel e receba uma análise inicial de escopo, projeto e
            próximos passos, sem compromisso.
          </p>
          <div className="pd-cta__btns">
            <a href="/diagnostico" className="btn btn-primary">
              Solicitar diagnóstico <span className="arrow">→</span>
            </a>
            <a
              href={whatsappHref()}
              className="btn btn-ghost-light"
              target="_blank"
              rel="noopener noreferrer"
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="foot">
        <div className="foot-grid">
          <div>
            <a href="/"><BrandLockup /></a>
            <p style={{ marginTop: 14 }}>
              Reforma turn-key de studios em São Paulo. Projeto, obra, marcenaria,
              mobiliário e entrega em um processo único.
            </p>
            <p style={{ marginTop: 10 }}>{CONTACT.city}</p>
          </div>
          <nav aria-label="Rodapé — navegação">
            <h4 className="foot-col">Navegação</h4>
            <ul>
              <li><a href="/#fazemos">O que fazemos</a></li>
              <li><a href="/#processo">Como funciona</a></li>
              <li><a href="/portfolio">Portfólio</a></li>
              <li><a href="/conteudos">Conteúdos</a></li>
              <li><a href="/diagnostico">Diagnóstico</a></li>
            </ul>
          </nav>
          <div>
            <h4 className="foot-col">Contato</h4>
            <ul>
              <li><a href={whatsappHref()} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
              <li><a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></li>
              <li><a href={CONTACT.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
              <li><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>
              <li><a href="/privacidade">Política de privacidade</a></li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <p>Bewild · Reforma turn-key de studios em São Paulo</p>
          <p>© {new Date().getFullYear()} Bewild · Grupo Bwild</p>
        </div>
      </footer>

      {lbIndex !== null && gallery.length > 0 && (
        <Lightbox
          images={gallery}
          index={lbIndex}
          onClose={closeLb}
          onPrev={prevLb}
          onNext={nextLb}
        />
      )}
    </div>
  );
}
