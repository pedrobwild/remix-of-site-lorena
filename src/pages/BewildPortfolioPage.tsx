/**
 * BewildPortfolioPage — /portfolio (Bewild) · reskin sob o DS `bwh-`.
 *
 * Copy, dados, ordenação, filtros e links de detalhe preservados sem
 * qualquer alteração — apenas troca de pele para o design system da home.
 * Grid segue o padrão .bwh-proj (foto 4/5 + contador + "ver projeto →").
 */
import { useMemo, useState } from "react";
import { useSeo, breadcrumbJsonLd, itemListJsonLd } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";
import BwaNav from "@/components/BwaNav";
import BwaFooter from "@/components/BwaFooter";
import { CONTACT } from "../components/landing/content";
import { useBewildProjects, bewildTypeLabel } from "@/lib/useBewildProjects";
import {
  availablePortfolioFilters,
  PORTFOLIO_SORTS,
  ALL_NEIGHBORHOODS,
  applyPortfolioFilter,
  applyNeighborhoodFilter,
  applyPortfolioSort,
  neighborhoodOptions,
  type PortfolioFilter,
  type PortfolioSort,
} from "@/lib/portfolioFilter";
import { hasReadyPhotos, photoKindLabel } from "@/lib/projectPhotos";
import { useImageAlts } from "@/lib/useImageAlts";
import "@/styles/bwh-tokens.css";
import "@/styles/bwh-overlays.css";
import "@/styles/bwh-sol-fusion.css";

const pad = (n: number) => String(n).padStart(2, "0");

export default function BewildPortfolioPage() {
  const { projects, loading, error } = useBewildProjects();
  const { settings } = useSiteSettings();
  const [filter, setFilter] = useState<PortfolioFilter>("all");
  const [place, setPlace] = useState<string>(ALL_NEIGHBORHOODS);
  const [sort, setSort] = useState<PortfolioSort>("curadoria");
  // Alt text descritivo das capas (gerado a partir da análise de cada foto).
  const coverAlts = useImageAlts(useMemo(() => projects.map((p) => p.cover_url), [projects]));

  useSeo({
    title: "Projetos de arquitetura e reforma de apartamento em SP | Bewild",
    description:
      "Projetos de arquitetura, engenharia e reforma de apartamento em SP: veja apartamentos entregues pela Bewild em São Paulo, prontos para morar ou alugar.",
    keywords:
      "projeto de arquitetura em São Paulo, escritório de arquitetura e engenharia, projeto de interiores, reforma de apartamento em SP, apartamentos reformados em SP, antes e depois reforma apartamento, portfólio de arquitetura e reformas em SP, Bewild",
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

  const withCover = useMemo(() => projects.filter((p) => !!p.cover_url), [projects]);
  const places = useMemo(() => neighborhoodOptions(withCover), [withCover]);
  const chips = useMemo(() => availablePortfolioFilters(withCover), [withCover]);
  const filtered = useMemo(
    () =>
      applyPortfolioSort(
        applyNeighborhoodFilter(applyPortfolioFilter(withCover, filter), place),
        sort,
      ),
    [withCover, filter, place, sort],
  );
  const showChips = withCover.length >= 4;
  const hasFilters = filter !== "all" || place !== ALL_NEIGHBORHOODS || sort !== "curadoria";

  const waUrl = `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(
    "Olá! Vim pelo portfólio e quero um diagnóstico do meu studio.",
  )}`;

  const total = filtered.length;

  return (
    <div className="bwh">
      <BwaNav />

      <main id="main" tabIndex={-1}>
        {/* HERO */}
        <section className="bwh-sec" style={{ paddingBottom: 0 }}>
          <div className="bwh-wrap">
            <div className="bwh-srlabel" style={{ borderTop: 0, paddingTop: 0 }}>
              <span className="bwh-mono bwh-label bwh-label--accent">Portfólio · obras entregues</span>
              <span className="bwh-mono">São Paulo · 2025–2026</span>
            </div>
            <h1 className="bwh-h2" style={{ marginBottom: 24 }}>
              Apartamentos entregues, prontos pra <em>morar, alugar ou vender.</em>
            </h1>
            <p className="bwh-lead" style={{ margin: "0 0 32px" }}>
              Cada projeto aqui recebeu estudo próprio de layout, marcenaria, iluminação e acabamento, pensado pro uso que o apartamento precisa sustentar. Do imóvel cru à entrega das chaves.
            </p>

            {showChips && (
            <div
              className="bwh-pf-chips"
              role="group"
              aria-label="Filtrar projetos"
            >
              {chips.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  className={`bwh-pf-chip${filter === f.value ? " is-on" : ""}`}
                  aria-pressed={filter === f.value}
                  onClick={() => setFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            )}

            {showChips && (
              <div className="bwh-pf-controls">
                <label className="bwh-pf-field">
                  <span className="bwh-mono bwh-pf-field__label">Bairro</span>
                  <select
                    className="bwh-pf-select"
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                  >
                    <option value={ALL_NEIGHBORHOODS}>Todos os bairros</option>
                    {places.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="bwh-pf-field">
                  <span className="bwh-mono bwh-pf-field__label">Ordenar por</span>
                  <select
                    className="bwh-pf-select"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as PortfolioSort)}
                  >
                    {PORTFOLIO_SORTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>

                {hasFilters && (
                  <button
                    type="button"
                    className="bwh-pf-clear bwh-mono"
                    onClick={() => {
                      setFilter("all");
                      setPlace(ALL_NEIGHBORHOODS);
                      setSort("curadoria");
                    }}
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            )}
          </div>
        </section>


        {/* LISTA */}
        <section className="bwh-sec">
          <div className="bwh-wrap">
            {!loading && !error && total > 0 && (
              <div className="bwh-srlabel">
                <span className="bwh-mono bwh-label bwh-label--accent">
                  {pad(total)} · {total === 1 ? "Projeto no índice" : "Projetos no índice"}
                </span>
              </div>
            )}

            {loading && (
              <div
                className="bwh-projects"
                aria-busy="true"
                aria-live="polite"
              >
                <div className="bwh-pf-skel" />
                <div className="bwh-pf-skel" />
                <div className="bwh-pf-skel" />
              </div>
            )}

            {!loading && error && (
              <p style={{ color: "var(--ink2)", fontSize: 15 }}>
                Não conseguimos carregar os projetos agora.{" "}
                <a href="/" style={{ textDecoration: "underline" }}>
                  Voltar para a home
                </a>
                .
              </p>
            )}

            {!loading && !error && total === 0 && (
              <p style={{ color: "var(--ink2)", fontSize: 15 }}>
                {projects.length === 0
                  ? "Em breve, novos projetos publicados."
                  : "Nenhum projeto nesse filtro ainda."}
              </p>
            )}

            {!loading && !error && total > 0 && (
              <div className="bwh-projects">
                {filtered.map((p, i) => {
                  const where = p.neighborhood || p.location || "São Paulo";
                  return (
                    <a
                      key={p.id}
                      href={`/portfolio/${p.slug}`}
                      className="bwh-proj"
                      aria-label={`Ver projeto ${p.title}`}
                    >
                      <div className="bwh-proj__media">
                        {p.cover_url ? (
                          <img
                            src={p.cover_url}
                            alt={
                              coverAlts[p.cover_url] ||
                              `${p.title} — ${bewildTypeLabel(p.project_type)} em ${where}`
                            }
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              height: "100%",
                              color: "var(--ink2)",
                              fontSize: 12,
                              letterSpacing: ".14em",
                              textTransform: "uppercase",
                              fontFamily: "var(--fm)",
                            }}
                          >
                            Foto em breve
                          </div>
                        )}
                        <span className="bwh-proj__count">
                          {pad(i + 1)} / {pad(total)}
                        </span>
                        <span className={`bwh-proj__kind${hasReadyPhotos(p) ? " bwh-proj__kind--ready" : ""}`}>
                          {photoKindLabel(p)}
                        </span>
                        <span className="bwh-proj__go">Ver projeto →</span>
                      </div>
                      <div className="bwh-proj__t">
                        {p.title}
                        {p.area_m2 ? <em> · {p.area_m2} m²</em> : null}
                      </div>
                      <div className="bwh-proj__meta">
                        {[where, bewildTypeLabel(p.project_type), p.duration]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="bwh-sec bwh-sec--dark">
          <div
            className="bwh-wrap"
            style={{ maxWidth: 900, textAlign: "center" }}
          >
            <div
              className="bwh-mono bwh-label"
              style={{ color: "var(--dink2)", marginBottom: 24, justifyContent: "center" }}
            >
              Orçamento · sem custo, sem compromisso
            </div>
            <h2 className="bwh-h2" style={{ margin: "0 auto 24px", color: "#fff" }}>
              O próximo studio da lista <em>pode ser o seu.</em>
            </h2>
            <p className="bwh-lead" style={{ margin: "0 auto 32px" }}>
              Manda os dados do seu imóvel e a gente devolve uma leitura de potencial, escopo e próximos passos.
            </p>
            <div
              style={{
                display: "flex",
                gap: 14,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <a href="/diagnostico" className="bwh-btn bwh-btn--invert">
                Solicitar orçamento <span className="bwh-ar">→</span>
              </a>
              <a
                className="bwh-btn bwh-btn--ghostdark"
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Falar no WhatsApp <span className="bwh-ar">→</span>
              </a>
            </div>
            <div
              className="bwh-mono"
              style={{ color: "var(--dink2)", marginTop: 24 }}
            >
              +160 reformas entregues · +200 projetos
            </div>
          </div>
        </section>
      </main>

      <BwaFooter />
    </div>
  );
}
