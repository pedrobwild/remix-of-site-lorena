/**
 * BewildProjectPage — /portfolio/:slug (Bewild).
 * "Ficha de obra" (prancha do caderno 003): a página completa de um studio
 * entregue, na linguagem de prancheta. Cada bloco só renderiza quando há
 * conteúdo no admin — campo vazio simplesmente não aparece no site.
 * CSS isolado em .bw-detail (src/styles/portfolio-detail.css).
 */
import { useEffect, useMemo, useState, useCallback } from "react";
import { useSeo, breadcrumbJsonLd, projectJsonLd } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";
import BwaNav from "@/components/BwaNav";
import BwaFooter from "@/components/BwaFooter";
import { whatsappHref } from "@/components/landing/content";
import { useBewildProject } from "@/lib/useBewildProject";
import { bewildTypeLabel } from "@/lib/useBewildProjects";
import { readyPhotos, renderPhotos } from "@/lib/projectPhotos";
import { projectMetaDescription, projectSeoTitle } from "@/lib/projectSeo";
import NotFoundPage from "@/pages/NotFoundPage";
import "@/styles/bwh-tokens.css";
import "@/styles/bwh-overlays.css";
import "@/styles/portfolio-detail.css";

interface Props {
  slug: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

function IconArrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
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
    <div className="bw-lightbox" role="dialog" aria-modal="true" aria-label="Visualizar imagem" onClick={onClose}>
      <img className="bw-lightbox__img" src={images[index]} alt="" onClick={(e) => e.stopPropagation()} />
      <button type="button" className="bw-lightbox__btn bw-lightbox__close" aria-label="Fechar" onClick={(e) => { e.stopPropagation(); onClose(); }}>×</button>
      {images.length > 1 && (
        <>
          <button type="button" className="bw-lightbox__btn bw-lightbox__prev" aria-label="Anterior" onClick={(e) => { e.stopPropagation(); onPrev(); }}>‹</button>
          <button type="button" className="bw-lightbox__btn bw-lightbox__next" aria-label="Próxima" onClick={(e) => { e.stopPropagation(); onNext(); }}>›</button>
          <span className="bw-lightbox__counter">{pad(index + 1)} / {pad(images.length)}</span>
        </>
      )}
    </div>
  );
}

/**
 * Uma galeria identificada: "Projeto 3D" (renders) ou "Obra pronta" (fotos do
 * apartamento entregue). Mesmo grid e lightbox para as duas.
 */
function GallerySection({
  title,
  note,
  images,
  altPrefix,
  openLabel,
  onOpen,
}: {
  title: string;
  note: string;
  images: string[];
  altPrefix: string;
  openLabel: string;
  onOpen: (index: number) => void;
}) {
  return (
    <section className="pd-sec pd-sec--tight"><div className="pd-wrap">
      <div className="pd-sechead"><span className="n">{pad(images.length)}</span><h2>{title}</h2><span className="ln" /></div>
      <p className="pd-secnote">{note}</p>
      <div className="pd-gallery">
        {images.map((src, i) => (
          <button
            key={src + i}
            type="button"
            className={"pd-gitem" + (i % 5 === 0 && i > 0 ? " pd-gitem--wide" : "")}
            onClick={() => onOpen(i)}
            aria-label={`${openLabel} ${i + 1}`}
          >
            <img src={src} alt={`${altPrefix} ${i + 1}`} loading="lazy" decoding="async" />
            <span className="gno">{pad(i + 1)}</span>
            <i className="tk tl" /><i className="tk tr" /><i className="tk bl" /><i className="tk br" />
          </button>
        ))}
      </div>
    </div></section>
  );
}

export default function BewildProjectPage({ slug }: Props) {
  const { project, loading, error, notFound } = useBewildProject(slug);
  const { settings } = useSiteSettings();
  // Lightbox: qual galeria (renders ou obra pronta) e o índice dentro dela.
  const [lb, setLb] = useState<{ set: "render" | "ready"; index: number } | null>(null);

  // Capa e galeria com fallback: a capa usa cover_url; se faltar, usa a 1ª
  // foto da galeria, e a galeria mostra o restante (sem duplicar).
  const galleryAll = useMemo(() => renderPhotos(project), [project]);
  const coverSrc = project?.cover_url || galleryAll[0] || null;
  const galleryImgs = useMemo(
    () => (project?.cover_url ? galleryAll : galleryAll.slice(1)),
    [project, galleryAll],
  );
  // Fotos da obra pronta: segunda galeria, identificada na página; a tag
  // "Obra pronta" do portfólio é derivada dela (projectPhotos.ts).
  const readyImgs = useMemo(() => readyPhotos(project), [project]);
  const lbImages = lb?.set === "ready" ? readyImgs : galleryImgs;

  const hasCase = !!(project?.challenge || project?.solution || project?.result_text);
  const hasBA = !!(project?.before_image_url && project?.after_image_url);
  const scopeItems = useMemo(() => (project?.scope ?? []).filter(Boolean), [project]);
  const seoTitle = projectSeoTitle(project);
  const seoDescription = projectMetaDescription(
    project,
    "Apartamento reformado pela Bewild em São Paulo-SP.",
  );

  useSeo({
    title: seoTitle,
    // Sem seo_description/summary no admin, monta a frase com bairro/metragem/tipo
    // reais do projeto (evita ~100 URLs com a mesma description genérica).
    description: seoDescription,
    keywords: [
      "reforma de apartamento em SP",
      "reforma de apartamento São Paulo",
      project?.neighborhood ? `reforma de apartamento ${project.neighborhood}` : null,
      project?.project_type ? `${project.project_type} reformado em SP` : null,
      "antes e depois reforma apartamento",
      "custo de reforma",
      "Bewild",
    ]
      .filter(Boolean)
      .join(", "),
    canonicalPath: `/portfolio/${slug}`,
    ogType: "article",
    ogImage: project?.og_image_url || project?.cover_url || undefined,
    jsonLd:
      settings && project
        ? [
            breadcrumbJsonLd(settings, [
              { name: "Início", path: "/" },
              { name: "Portfólio", path: "/portfolio" },
              { name: project.title, path: `/portfolio/${project.slug}` },
            ]),
            projectJsonLd(settings, {
              slug: project.slug,
              title: project.title,
              summary: seoDescription,
              cover: project.og_image_url ?? project.cover_url ?? undefined,
              location: project.neighborhood ?? project.location ?? undefined,
              tag: project.project_type ?? undefined,
            }),
          ]
        : undefined,
  });

  const closeLb = useCallback(() => setLb(null), []);
  const stepLb = useCallback(
    (dir: -1 | 1) =>
      setLb((cur) => {
        if (!cur) return cur;
        const len = (cur.set === "ready" ? readyImgs : galleryImgs).length;
        if (len === 0) return null;
        return { ...cur, index: (cur.index + dir + len) % len };
      }),
    [galleryImgs, readyImgs],
  );
  const prevLb = useCallback(() => stepLb(-1), [stepLb]);
  const nextLb = useCallback(() => stepLb(1), [stepLb]);

  if (loading) {
    return (
      <div className="bwh bw-detail">
        <BwaNav />
        <main id="main" tabIndex={-1}>
          <div className="pd-wrap"><div className="pd-skeleton" aria-busy="true" aria-live="polite" /></div>
        </main>
        <BwaFooter />
      </div>
    );
  }

  if (notFound || (!project && !error)) return <NotFoundPage />;

  if (error || !project) {
    return (
      <div className="bwh bw-detail">
        <BwaNav />
        <main id="main" tabIndex={-1}>
          <div className="pd-wrap pd-errorbox">
            <p>Não conseguimos carregar este projeto agora. <a href="/portfolio">Voltar ao portfólio</a>.</p>
          </div>
        </main>
        <BwaFooter />
      </div>
    );
  }

  const where = project.neighborhood || project.location || "São Paulo";
  const metaParts = [where, project.area_m2 ? `${project.area_m2} m²` : null, project.duration].filter(Boolean) as string[];
  const hasReady = readyImgs.length > 0;

  return (
    <div className="bwh bw-detail">
      <BwaNav />

      <div className="bw-detail__frame" aria-hidden="true">
        <i className="tk tl" /><i className="tk tr" /><i className="tk bl" /><i className="tk br" />
      </div>
      <div className="bw-detail__titleblock" aria-hidden="true">BEWILD<br /><b>BW—003 / PORTFÓLIO</b><br />SÃO PAULO · BR</div>
      <div className="bw-detail__sheetno" aria-hidden="true">FICHA DE OBRA</div>

      <main id="main" tabIndex={-1}>

      {/* HEADER */}
      <section className="pd-head">
        <div className="pd-wrap">
          <a className="pd-back" href="/portfolio">← Portfólio</a>
          {(project.project_type || hasReady) && (
            <div>
              {project.project_type && <span className="pd-pill">{bewildTypeLabel(project.project_type)}</span>}
              {hasReady && <span className="pd-pill pd-pill--ready">Obra pronta</span>}
            </div>
          )}
          <h1>{project.title}</h1>
          {metaParts.length > 0 && (
            <div className="pd-metaline">{metaParts.map((m, i) => <span key={i}>{m}</span>)}</div>
          )}
        </div>
      </section>

      {/* COVER */}
      {coverSrc && (
        <div className="pd-coverwrap"><div className="pd-wrap">
          <div className="pd-cover">
            <img src={coverSrc} alt={project.cover_alt || `${project.title} — foto principal`} loading="eager" decoding="async" />
            <i className="tk tl" /><i className="tk tr" /><i className="tk bl" /><i className="tk br" />
          </div>
        </div></div>
      )}

      {/* SUMÁRIO + CASE */}
      {(project.summary || hasCase) && (
        <section className="pd-sec"><div className="pd-wrap">
          {project.summary && <p className="pd-intro">{project.summary}</p>}
          {hasCase && (
            <div className="pd-case">
              {project.challenge && (
                <div className="pd-case__cell"><div className="pd-case__lbl">Desafio</div><p>{project.challenge}</p></div>
              )}
              {project.solution && (
                <div className="pd-case__cell"><div className="pd-case__lbl">Solução</div><p>{project.solution}</p></div>
              )}
              {project.result_text && (
                <div className="pd-case__cell"><div className="pd-case__lbl">Resultado</div><p>{project.result_text}</p></div>
              )}
            </div>
          )}
        </div></section>
      )}

      {/* ANTES E DEPOIS */}
      {hasBA && (
        <section className="pd-sec pd-sec--tight"><div className="pd-wrap">
          <div className="pd-sechead"><span className="n">A/D</span><h2>Antes e depois</h2><span className="ln" /></div>
          <div className="pd-ba">
            <div className="pd-ba__frame"><span className="pd-ba__badge">Antes</span><img src={project.before_image_url!} alt="Antes da reforma" loading="lazy" /></div>
            <div className="pd-ba__frame"><span className="pd-ba__badge">Depois</span><img src={project.after_image_url!} alt="Depois da reforma" loading="lazy" /></div>
          </div>
        </div></section>
      )}

      {/* GALERIAS: projeto 3D (renders) e obra pronta, cada uma identificada */}
      {galleryImgs.length > 0 && (
        <GallerySection
          title="Projeto 3D"
          note="Imagens do projeto de arquitetura e interiores (renders)"
          images={galleryImgs}
          altPrefix={`${project.title} — projeto 3D, imagem`}
          openLabel="Abrir imagem do projeto 3D"
          onOpen={(i) => setLb({ set: "render", index: i })}
        />
      )}
      {hasReady && (
        <GallerySection
          title="Obra pronta"
          note="Fotos do apartamento entregue"
          images={readyImgs}
          altPrefix={`${project.title} — obra pronta, foto`}
          openLabel="Abrir foto da obra pronta"
          onOpen={(i) => setLb({ set: "ready", index: i })}
        />
      )}

      {/* ESCOPO */}
      {scopeItems.length > 0 && (
        <section className="pd-sec pd-scope-wrap"><div className="pd-wrap">
          <div className="pd-sechead"><span className="n">{pad(scopeItems.length)}</span><h2>O que foi feito</h2><span className="ln" /></div>
          <div className="pd-scope">
            {scopeItems.map((item, i) => (
              <div className="pd-scope__item" key={item + i}>
                <span className="pd-scope__n">{pad(i + 1)}</span>
                <IconCheck />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div></section>
      )}

      {/* DEPOIMENTO */}
      {project.testimonial && (
        <section className="pd-sec pd-depo"><div className="pd-narrow">
          <div className="pd-sechead"><span className="n">“</span><h2>Depoimento</h2><span className="ln" /></div>
          <blockquote>{project.testimonial}</blockquote>
          {project.testimonial_author && <p className="pd-depo__src">{project.testimonial_author}</p>}
        </div></section>
      )}

      {/* CTA */}
      <section className="pd-cta">
        <div className="gridbg" aria-hidden="true" />
        <div className="pd-cta__inner">
          <span className="pd-eyb">Orçamento · sem custo, sem compromisso</span>
          <h2>Quer um studio assim <span className="accent">rendendo pra você?</span></h2>
          <p>Manda os dados do seu imóvel e a gente devolve uma leitura de potencial, escopo e próximos passos.</p>
          <div className="pd-cta__act">
            <a href="/diagnostico" className="pd-btn cyan">Solicitar orçamento <span className="ar"><IconArrow /></span></a>
            <a href={whatsappHref()} className="pd-btn ghost" target="_blank" rel="noopener noreferrer">Falar no WhatsApp</a>
          </div>
          <div className="pd-cta__rea">+160 reformas entregues · +200 projetos</div>
        </div>
      </section>
      </main>

      <BwaFooter />

      {lb && lbImages.length > 0 && (
        <Lightbox
          images={lbImages}
          index={Math.min(lb.index, lbImages.length - 1)}
          onClose={closeLb}
          onPrev={prevLb}
          onNext={nextLb}
        />
      )}
    </div>
  );
}
