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
import {
  useBewildProjects,
  bewildTypeLabel,
  type BewildProjectType,
} from "@/lib/useBewildProjects";
import "@/styles/bwh-tokens.css";
import "@/styles/bwh-overlays.css";
import "@/styles/bwh-sol-fusion.css";

type FilterValue = "all" | BewildProjectType;

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "short_stay", label: "Short stay" },
  { value: "turn_key", label: "Turn-key" },
  { value: "planta", label: "Planta" },
];

const pad = (n: number) => String(n).padStart(2, "0");

export default function BewildPortfolioPage() {
  const { projects, loading, error } = useBewildProjects();
  const { settings } = useSiteSettings();
  const [filter, setFilter] = useState<FilterValue>("all");

  useSeo({
    title: "Portfólio | Apartamentos entregues pela Bewild",
    description:
      "Projetos entregues em São Paulo e Rio de Janeiro: reforma completa com projeto aprovado em 3D antes da execução.",
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
  const filtered = useMemo(() => {
    if (filter === "all") return withCover;
    return withCover.filter((p) => p.project_type === filter);
  }, [withCover, filter]);
  const showChips = withCover.length >= 4;

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
              aria-label="Filtrar por tipo de projeto"
            >
              {FILTERS.map((f) => (
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
                            alt={`${p.title} — ${bewildTypeLabel(p.project_type)} em ${where}`}
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
              Diagnóstico gratuito · sem compromisso
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
                Solicitar Orçamento <span className="bwh-ar">→</span>
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
