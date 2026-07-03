/**
 * BewildPortfolioPage — /portfolio (Bewild).
 * "Caderno de obras" (prancha 03): grade de fichas de projeto na
 * linguagem de prancheta da home. Número de prancha (P01...) gerado
 * automaticamente pela ordem dos projetos publicados.
 * CSS isolado em .bw-portfolio (src/styles/portfolio.css).
 */
import { useMemo, useState } from "react";
import { useSeo, breadcrumbJsonLd, itemListJsonLd } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";
import BewildSiteNav from "@/components/BewildSiteNav";
import SiteFooter from "@/components/SiteFooter";
import { CONTACT } from "../components/landing/content";
import {
  useBewildProjects,
  bewildTypeLabel,
  type BewildProjectType,
} from "@/lib/useBewildProjects";
import "@/styles/portfolio.css";

type FilterValue = "all" | BewildProjectType;

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "short_stay", label: "Short stay" },
  { value: "turn_key", label: "Turn-key" },
  { value: "planta", label: "Planta" },
];

const pad = (n: number) => String(n).padStart(2, "0");

function IconArrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export default function BewildPortfolioPage() {
  const { projects, loading, error } = useBewildProjects();
  const { settings } = useSiteSettings();
  const [filter, setFilter] = useState<FilterValue>("all");

  useSeo({
    title: "Portfólio Bewild · reformas turn-key em São Paulo",
    description:
      "Studios reformados pela Bewild em São Paulo: projetos turn-key, short stay e reformas de planta entregues prontos para anúncio e operação.",
    canonicalPath: "/portfolio",
    ogType: "website",
    ogImage: projects.find((p) => p.cover_url)?.cover_url ?? undefined,
    jsonLd: settings
      ? [
          breadcrumbJsonLd(settings, [
            { name: "Início", path: "/" },
            { name: "Portfólio", path: "/portfolio" },
          ]),
          itemListJsonLd(
            settings,
            projects.map((p) => ({
              name: p.title,
              path: `/portfolio/${p.slug}`,
              image: p.cover_url ?? undefined,
            })),
          ),
        ]
      : undefined,
  });

  // Número de prancha estável por projeto, na ordem do admin (sort_order).
  const plateNum = useMemo(() => {
    const m = new Map<string, number>();
    projects.forEach((p, i) => m.set(p.id, i + 1));
    return m;
  }, [projects]);

  const filtered = useMemo(() => {
    if (filter === "all") return projects;
    return projects.filter((p) => p.project_type === filter);
  }, [projects, filter]);

  const waUrl = `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(
    "Olá! Vim pelo portfólio e quero um diagnóstico do meu studio."
  )}`;

  return (
    <>
      <div className="bw-portfolio">
        <BewildSiteNav />

        <div className="bw-portfolio__frame" aria-hidden="true">
          <i className="tk tl" /><i className="tk tr" /><i className="tk bl" /><i className="tk br" />
        </div>
        <div className="bw-portfolio__titleblock" aria-hidden="true">BEWILD · GRUPO BWILD<br /><b>BW—003 / PORTFÓLIO</b><br />SÃO PAULO · BR</div>
        <div className="bw-portfolio__sheetno" aria-hidden="true">SHEET 03 / OBRAS ENTREGUES</div>

        {/* HERO */}
        <section className="pf-hero">
          <div className="pf-wrap">
            <p className="pf-eyebrow">Portfólio · obras entregues</p>
            <h1 className="pf-h1">Studios entregues, prontos pra <span className="accent">render.</span></h1>
            <p className="pf-lead">
              Cada projeto aqui recebeu estudo próprio de layout, marcenaria, iluminação e acabamento, pensado pra performar no short stay. Do imóvel cru à foto do anúncio.
            </p>
            <div className="pf-filters" role="group" aria-label="Filtrar por tipo de projeto">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  className={`pf-chip${filter === f.value ? " active" : ""}`}
                  aria-pressed={filter === f.value}
                  onClick={() => setFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* LISTA */}
        <section className="pf-list">
          <div className="pf-wrap">
            {!loading && !error && filtered.length > 0 && (
              <div className="pf-index">
                <span className="n">{pad(filtered.length)}</span>
                <span className="t">{filtered.length === 1 ? "Projeto no índice" : "Projetos no índice"}</span>
                <span className="ln" />
              </div>
            )}

            {loading && (
              <div className="pf-grid" aria-busy="true" aria-live="polite">
                <div className="pf-skeleton" /><div className="pf-skeleton" /><div className="pf-skeleton" />
              </div>
            )}

            {!loading && error && (
              <div className="pf-state">
                Não conseguimos carregar os projetos agora. <a href="/">Voltar para a home</a>.
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div className="pf-state">
                {projects.length === 0 ? "Em breve, novos projetos publicados." : "Nenhum projeto nesse filtro ainda."}
              </div>
            )}

            {!loading && !error && filtered.length > 0 && (
              <div className="pf-grid">
                {filtered.map((p) => {
                  const where = p.neighborhood || p.location || "São Paulo";
                  const plate = plateNum.get(p.id) ?? 0;
                  return (
                    <a key={p.id} href={`/portfolio/${p.slug}`} className="pf-card" aria-label={`Ver projeto ${p.title}`}>
                      <div className={"pf-card__media" + (!p.cover_url ? " is-empty" : "")}>
                        {p.cover_url ? (
                          <img
                            src={p.cover_url}
                            alt={`${p.title} — ${bewildTypeLabel(p.project_type)} em ${where}`}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <span className="pf-card__soon">Foto em breve</span>
                        )}
                        <span className="pf-pl"><b>P{pad(plate)}</b></span>
                        <span className="pf-tag">{bewildTypeLabel(p.project_type)}</span>
                        <i className="tk tl" /><i className="tk tr" /><i className="tk bl" /><i className="tk br" />
                      </div>
                      <div className="pf-card__body">
                        <div className="pf-card__where">{where}</div>
                        <div className="pf-card__title">{p.title}</div>
                        <div className="pf-card__meta">
                          {p.area_m2 ? (
                            <div className="mi"><span className="mk">Área</span><span className="mv">{p.area_m2} m²</span></div>
                          ) : null}
                          {p.duration ? (
                            <div className="mi"><span className="mk">Prazo</span><span className="mv">{p.duration}</span></div>
                          ) : null}
                          <span className="pf-card__arrow"><IconArrow /></span>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="pf-cta">
          <div className="gridbg" aria-hidden="true" />
          <div className="pf-cta__inner">
            <p className="pf-eyebrow center">Diagnóstico gratuito · sem compromisso</p>
            <h2>O próximo studio da lista <span className="accent">pode ser o seu.</span></h2>
            <p className="pf-cta__sub">Manda os dados do seu imóvel e a gente devolve uma leitura de potencial, escopo e próximos passos.</p>
            <div className="pf-cta__act">
              <a className="pf-btn cyan" href="/diagnostico">Solicitar diagnóstico <span className="ar"><IconArrow /></span></a>
              <a className="pf-btn ghost" href={waUrl} target="_blank" rel="noopener noreferrer">Falar no WhatsApp</a>
            </div>
            <div className="pf-cta__rea">+150 studios entregues em São Paulo</div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </>
  );
}
