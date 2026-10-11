import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import BewildLealMoreiraLogos from "@/components/BewildLealMoreiraLogos";
import { whatsappHref } from "@/components/landing/content";
import {
  LEAL_CASE_SLUG,
  LEAL_HERO_ALT,
  LEAL_HERO_IMAGE,
  LEAL_PAGE,
  LEAL_PATH,
  LEAL_SEO,
} from "@/content/lealMoreira";
import type { LealData, LealProject } from "@/lib/lealMoreiraLoader";
import { optimizedImageUrl, optimizedSrcSet } from "@/lib/imageUrl";
import { useCtaClickTracking } from "@/lib/trackCta";
import { unidadeLabel } from "@/lib/unidadeLabel";
import { usePartnerCase } from "@/lib/usePartnerCase";
import { useSeo } from "@/lib/useSeo";
import "./faq-page.css";
import "./parceiros.css";
import "./incorporadoras.css";
import "./leal-moreira.css";

/* ============================================================
 * LealMoreiraPage — /parceiros/leal-moreira
 * Página própria da parceria com a Leal Moreira: texto do case já
 * aprovado + projetos em 3D das unidades (tabela partner_cases e
 * projects). O loader da rota entrega os projetos no HTML do servidor;
 * sem ele, o navegador busca os mesmos dados.
 * ============================================================ */

type Props = { initial: LealData | null };

export default function LealMoreiraPage({ initial }: Props) {
  useCtaClickTracking("leal-moreira");
  useSeo({
    title: LEAL_SEO.title,
    description: LEAL_SEO.description,
    keywords: LEAL_SEO.keywords,
    canonicalPath: LEAL_PATH,
    ogType: "website",
  });

  const { data: caso, projects: clientProjects } = usePartnerCase(LEAL_CASE_SLUG, !initial);
  const published = initial ? initial.published : !!caso?.published;
  const projects: LealProject[] = initial ? initial.projects : clientProjects;
  const mostrar = published && projects.length > 0;

  return (
    <div className="bwa-parceiros bwa-leal">
      <BwaNav />
      <main id="main" tabIndex={-1}>
        <section className="bwa-parc-hero">
          <div className="bwa-shell bwa-leal-hero-grid">
            <div>
              <p className="bwa-label">{LEAL_PAGE.label}</p>
              <h1>
                {LEAL_PAGE.titleStart} <em>{LEAL_PAGE.titleEm}</em>
              </h1>
              <p className="bwa-parc-lead">{LEAL_PAGE.lead}</p>
              <p className="bwa-parc-lead bwa-leal-lead2">{LEAL_PAGE.lead2}</p>
              <div className="bwa-parc-hero-actions">
                <a
                  className="bwa-button"
                  href={whatsappHref(LEAL_PAGE.buyer.whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cta={LEAL_PAGE.ctaPrimary.cta}
                >
                  {LEAL_PAGE.ctaPrimary.label} <span aria-hidden="true">↗</span>
                </a>
                {mostrar && (
                  <a
                    className="bwa-parc-ghost"
                    href={LEAL_PAGE.ctaSecondary.href}
                    data-cta={LEAL_PAGE.ctaSecondary.cta}
                  >
                    {LEAL_PAGE.ctaSecondary.label} <span aria-hidden="true">↓</span>
                  </a>
                )}
              </div>
              <div className="bwa-incorp-strip">
                <BewildLealMoreiraLogos as="span" priority />
              </div>
            </div>
            <figure className="bwa-leal-hero-fig">
              <img
                src={LEAL_HERO_IMAGE}
                alt={LEAL_HERO_ALT}
                width={1200}
                height={675}
                decoding="async"
                fetchPriority="high"
              />
              <figcaption>Projeto em 3D de uma unidade do LM Urban Flex Bela Cintra.</figcaption>
            </figure>
          </div>
        </section>

        <section className="bwa-parc-section">
          <div className="bwa-shell">
            <p className="bwa-label">{LEAL_PAGE.aboutLabel}</p>
            <h2>{LEAL_PAGE.aboutTitle}</h2>
            <ol className="bwa-parc-steps">
              {LEAL_PAGE.aboutItems.map((item, i) => (
                <li className="bwa-parc-step" key={item.t}>
                  <span className="bwa-parc-num">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{item.t}</h3>
                    <p>{item.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {mostrar && (
          <section className="bwa-parc-section bwa-parc-section--alt" id="projetos">
            <div className="bwa-shell">
              <p className="bwa-label">{LEAL_PAGE.projectsLabel}</p>
              <h2>{LEAL_PAGE.projectsTitle}</h2>
              <div className="bwa-incorp-gallery">
                {projects.map((p) => (
                  <article className="bwa-incorp-card" key={p.slug}>
                    {p.cover_url && (
                      <figure>
                        <img
                          src={optimizedImageUrl(p.cover_url, 640)}
                          srcSet={optimizedSrcSet(p.cover_url, [480, 640, 960])}
                          sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 400px"
                          alt={p.cover_alt || `Projeto 3D da ${unidadeLabel(p.title)}, LM Urban Flex Bela Cintra`}
                          loading="lazy"
                          decoding="async"
                        />
                      </figure>
                    )}
                    <span className="bwa-incorp-status">
                      {LEAL_PAGE.statusLabels[p.status ?? "entregue"] ?? LEAL_PAGE.statusLabels.entregue}
                    </span>
                    <h3 className="bwa-leal-card-title">{unidadeLabel(p.title)}</h3>
                    <a href={`/portfolio/${p.slug}`} data-cta="leal-moreira-projeto">
                      {LEAL_PAGE.projectLink} <span aria-hidden="true">→</span>
                    </a>
                  </article>
                ))}
              </div>
              <p className="bwa-incorp-note">{LEAL_PAGE.projectsNote}</p>
            </div>
          </section>
        )}

        <section className="bwa-parc-section">
          <div className="bwa-shell">
            <aside className="bwa-incorp-buyer">
              <h3>{LEAL_PAGE.buyer.title}</h3>
              <p>{LEAL_PAGE.buyer.text}</p>
              <a
                className="bwa-button"
                href={whatsappHref(LEAL_PAGE.buyer.whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                data-cta="leal-moreira-comprador"
              >
                {LEAL_PAGE.buyer.ctaLabel} <span aria-hidden="true">↗</span>
              </a>
            </aside>
          </div>
        </section>

        <section className="bwa-parc-section bwa-parc-section--alt">
          <div className="bwa-shell">
            <p className="bwa-label">{LEAL_PAGE.moreLabel}</p>
            <h2>{LEAL_PAGE.moreTitle}</h2>
            <p className="bwa-parc-lead2">{LEAL_PAGE.moreText}</p>
            <p>
              <a className="bwa-button" href={LEAL_PAGE.moreCta.href} data-cta={LEAL_PAGE.moreCta.cta}>
                {LEAL_PAGE.moreCta.label} <span aria-hidden="true">→</span>
              </a>
            </p>
          </div>
        </section>
      </main>
      <BwaFooter />
    </div>
  );
}
