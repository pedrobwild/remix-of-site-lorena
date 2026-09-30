/**
 * BewildPortfolioPage — /portfolio (Bewild) · reskin sob o DS `bwh-`.
 *
 * Copy, dados, ordenação, filtros e links de detalhe preservados sem
 * qualquer alteração — apenas troca de pele para o design system da home.
 * Grid segue o padrão .bwh-proj (foto 4/5 + contador + "ver projeto →").
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { optimizedImageUrl, optimizedSrcSet } from "@/lib/imageUrl";
import { useSeo } from "@/lib/useSeo";
import { projectListJsonLd } from "@/lib/contentJsonLd";
import { useSiteSettings } from "@/lib/useSiteSettings";
import BwaNav from "@/components/BwaNav";
import BwaFooter from "@/components/BwaFooter";
import { CONTACT } from "../components/landing/content";
import { useBewildProjects, bewildTypeLabel, type BewildProject } from "@/lib/useBewildProjects";
import {
  PORTFOLIO_SORTS,

  ALL_NEIGHBORHOODS,
  applyPortfolioFilter,
  applyNeighborhoodFilter,
  applyPortfolioSort,
  neighborhoodOptions,
  neighborhoodPages,
  type PortfolioFilter,
  type PortfolioSort,
} from "@/lib/portfolioFilter";
import { hasReadyPhotos, photoKindLabel } from "@/lib/projectPhotos";
import { useImageAlts } from "@/lib/useImageAlts";
import { reportProjectClick } from "@/lib/conversions";
import "@/styles/bwh-tokens.css";
import "@/styles/bwh-overlays.css";
import "@/styles/bwh-sol-fusion.css";

const PAGE_SIZE = 24;
const GRID_SIZES = "(max-width: 640px) 100vw, (max-width: 980px) 50vw, 33vw";
const pad = (n: number) => String(n).padStart(2, "0");

export default function BewildPortfolioPage({ initialProjects }: { initialProjects?: BewildProject[] | null } = {}) {
  const { projects, loading, error } = useBewildProjects(initialProjects);
  const { settings } = useSiteSettings();
  const [filter, setFilter] = useState<PortfolioFilter>("all");
  const [place, setPlace] = useState<string>(ALL_NEIGHBORHOODS);
  const [sort, setSort] = useState<PortfolioSort>("curadoria");
  // Alt text descritivo das capas (gerado a partir da análise de cada foto).

  useSeo({
    title: "Portfólio: projetos de arquitetura e reforma em SP | Bewild",
    description:
      "Projetos de arquitetura, engenharia e reforma de apartamento em SP: veja apartamentos entregues pela Bewild em São Paulo, prontos para morar ou alugar.",
    keywords:
      "projeto de arquitetura em São Paulo, escritório de arquitetura e engenharia, projeto de interiores, reforma de apartamento em SP, apartamentos reformados em SP, antes e depois reforma apartamento, portfólio de arquitetura e reformas em SP, Bewild",
    canonicalPath: "/portfolio",
    ogType: "website",
    ogImage: projects.find((p) => p.cover_url)?.cover_url ?? undefined,
    // ItemList sai no head() da rota; aqui só se o loader falhou.
    jsonLd: !initialProjects && projects.length ? projectListJsonLd(projects) : undefined,
  });

  const withCover = useMemo(() => projects.filter((p) => !!p.cover_url), [projects]);
  const bairroPages = useMemo(() => neighborhoodPages(withCover), [withCover]);
  const places = useMemo(() => neighborhoodOptions(withCover), [withCover]);
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

  // Carregamento incremental: lotes de 24; volta a 24 ao mudar filtro/bairro/ordem.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  useEffect(() => setVisibleCount(PAGE_SIZE), [filter, place, sort]);
  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const remaining = Math.max(0, total - visible.length);
  const loadMore = () => setVisibleCount((c) => Math.min(c + PAGE_SIZE, total));

  // Alt texts só dos cards renderizados (chave = cover_url original).
  const coverAlts = useImageAlts(useMemo(() => visible.map((p) => p.cover_url), [visible]));

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || remaining === 0 || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, total));
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [remaining, total, visibleCount]);

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

            {/* Reserva de altura para a navegação por bairro + filtros, que só
                existem depois dos dados — mesmas classes do conteúdo real,
                então a altura reservada é idêntica por construção. */}
            {loading && (
              <div aria-hidden="true">
                <nav className="bwh-mono" style={{ margin: "0 0 24px", display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
                  <span>Por bairro:</span>
                  {/* 16 itens: os bairros reais quebram em ~2 linhas nessa largura. */}
                  {Array.from({ length: 16 }, (_, i) => (
                    <span key={i} className="bwh-pf-skel bwh-pf-skel--inline" />
                  ))}
                </nav>
                <div className="bwh-pf-controls">
                  {["Bairro", "Ordenar por"].map((label) => (
                    <div key={label} className="bwh-pf-field">
                      <span className="bwh-mono bwh-pf-field__label">{label}</span>
                      <div className="bwh-pf-skel bwh-pf-skel--select" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bairroPages.length > 0 && (
              <nav aria-label="Reformas por bairro" className="bwh-mono" style={{ margin: "0 0 24px", display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
                <span>Por bairro:</span>
                {bairroPages.map((b) => (
                  <a key={b.slug} href={`/reforma/${b.slug}`} style={{ textDecoration: "underline" }}>
                    {b.label}
                  </a>
                ))}
              </nav>
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
            {!error && (loading || total > 0) && (
              <div className="bwh-srlabel" aria-busy={loading || undefined}>
                <span className="bwh-mono bwh-label bwh-label--accent">
                  {loading ? "\u00A0" : `${pad(total)} · ${total === 1 ? "Projeto no índice" : "Projetos no índice"}`}
                </span>
              </div>
            )}

            {loading && (
              <div
                className="bwh-projects"
                aria-busy="true"
                aria-live="polite"
              >
                {/* Um esqueleto por card do primeiro lote, na mesma proporção
                    do card real (mídia 4/3 + duas linhas de texto): a grade
                    nasce com a altura final e nada desce quando os projetos
                    chegam do banco. */}
                {Array.from({ length: PAGE_SIZE }, (_, i) => (
                  <div key={i} className="bwh-pf-skel-card" aria-hidden="true">
                    <div className="bwh-pf-skel" />
                    <div className="bwh-pf-skel bwh-pf-skel--line" />
                    <div className="bwh-pf-skel bwh-pf-skel--line bwh-pf-skel--meta" />
                  </div>
                ))}
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
              <>
              <div className="bwh-projects">
                {visible.map((p, i) => {
                  const where = p.neighborhood || p.location || "São Paulo";
                  return (
                    <a
                      key={p.id}
                      href={`/portfolio/${p.slug}`}
                      className="bwh-proj"
                      aria-label={`Ver projeto ${p.title}`}
                      onClick={() => reportProjectClick(p.slug, p.title, i + 1)}
                    >
                      <div className="bwh-proj__media">
                        {p.cover_url ? (
                          <img
                            src={optimizedImageUrl(p.cover_url, 640, 70)}
                            srcSet={optimizedSrcSet(p.cover_url)}
                            sizes={GRID_SIZES}
                            width={640}
                            height={480}
                            alt={
                              coverAlts[p.cover_url] ||
                              `${p.title} — ${bewildTypeLabel(p.project_type)} em ${where}`
                            }
                            loading={i < 3 ? "eager" : "lazy"}
                            fetchPriority={i < 3 ? "high" : undefined}
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
              {/* Sem JS (Bing, robôs de IA): links dos projetos que ainda não
                  entraram na grade. Invisível para quem tem JavaScript. */}
              {remaining > 0 && (
                <noscript>
                  <ul>
                    {filtered.slice(visibleCount).map((p) => (
                      <li key={p.id}>
                        <a href={`/portfolio/${p.slug}`}>{p.title}</a>
                      </li>
                    ))}
                  </ul>
                </noscript>
              )}
              {remaining > 0 && (
                <>
                  <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />
                  <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
                    <button type="button" className="bwh-btn" onClick={loadMore}>
                      Ver mais projetos ({remaining})
                    </button>
                  </div>
                </>
              )}
              </>
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
              <a href="/orcamento" className="bwh-btn bwh-btn--invert">
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
