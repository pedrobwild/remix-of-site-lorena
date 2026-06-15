/**
 * BewildPortfolioPage — /portfolio (novo, Bewild).
 *
 * Lista pública dos projetos Bewild publicados (`projects.published = true`).
 * Visual reusa o sistema da home (.bw-home) e adiciona seções específicas
 * em src/styles/portfolio.css prefixadas por .bw-portfolio.
 *
 * Portfólio antigo Lorena segue funcionando intacto em /portfolio-lorena.
 */
import { useMemo, useState } from "react";
import { useSeo } from "@/lib/useSeo";
import BewildSiteNav from "@/components/BewildSiteNav";
import { CONTACT, whatsappHref } from "@/components/landing/content";
import {
  useBewildProjects,
  bewildTypeLabel,
  type BewildProjectType,
} from "@/lib/useBewildProjects";
import "@/styles/home.css";
import "@/styles/portfolio.css";

type FilterValue = "all" | BewildProjectType;

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "short_stay", label: "Short stay" },
  { value: "turn_key", label: "Turn-key" },
  { value: "planta", label: "Planta" },
];

function BrandLockup() {
  return (
    <span className="brand" aria-label="Bewild · Grupo Bwild">
      <span className="be">Be</span>
      <span className="wild">wild</span>
      <span className="sub">Grupo Bwild</span>
    </span>
  );
}

export default function BewildPortfolioPage() {
  const { projects, loading, error } = useBewildProjects();
  const [filter, setFilter] = useState<FilterValue>("all");

  useSeo({
    title: "Portfólio Bewild — reformas turn-key em São Paulo",
    description:
      "Studios reformados pela Bewild em São Paulo: projetos turn-key, short stay e reformas de planta entregues prontos para anúncio e operação.",
    canonicalPath: "/portfolio",
    ogType: "website",
    ogImage: projects.find((p) => p.cover_url)?.cover_url ?? undefined,
  });

  const filtered = useMemo(() => {
    if (filter === "all") return projects;
    return projects.filter((p) => p.project_type === filter);
  }, [projects, filter]);

  return (
    <div className="bw-home bw-portfolio">
      {/* NAV */}
      <BewildSiteNav />

      {/* HERO */}
      <section className="pf-hero">
        <div className="container">
          <div className="eyebrow" style={{ color: "var(--cyan)" }}>
            Portfólio
          </div>
          <h1>Reformas turn-key entregues em São Paulo.</h1>
          <p className="lead">
            Studios projetados, reformados e entregues prontos para foto, anúncio e
            operação. Cada projeto recebeu um estudo próprio de layout, marcenaria,
            iluminação e acabamentos.
          </p>
          <div className="pf-filters" role="group" aria-label="Filtrar por tipo de projeto">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                className="pf-chip"
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
        <div className="container">
          {loading && (
            <div className="pf-grid" aria-busy="true" aria-live="polite">
              <div className="pf-skeleton" />
              <div className="pf-skeleton" />
              <div className="pf-skeleton" />
            </div>
          )}

          {!loading && error && (
            <div className="pf-error">
              Não conseguimos carregar os projetos agora.{" "}
              <a href="/">Voltar para a home</a>.
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="pf-empty">
              {projects.length === 0
                ? "Em breve novos projetos publicados."
                : "Nenhum projeto nesse filtro ainda."}
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="pf-grid">
              {filtered.map((p) => {
                const where = p.neighborhood || p.location || "São Paulo";
                return (
                  <a
                    key={p.id}
                    href={`/portfolio/${p.slug}`}
                    className="pf-card"
                    aria-label={`Ver projeto ${p.title}`}
                  >
                    <div
                      className={
                        "pf-card__media" + (!p.cover_url ? " pf-card__media--empty" : "")
                      }
                    >
                      {p.cover_url ? (
                        <img
                          src={p.cover_url}
                          alt={`${p.title} — ${bewildTypeLabel(p.project_type)} em ${where}`}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span>Foto em breve</span>
                      )}
                      <span className="pf-card__tag">
                        {bewildTypeLabel(p.project_type)}
                      </span>
                    </div>
                    <div className="pf-card__body">
                      <h2 className="pf-card__title">{p.title}</h2>
                      <p className="pf-card__where">{where}</p>
                      {(p.area_m2 || p.duration) && (
                        <div className="pf-card__meta">
                          {p.area_m2 ? <span>{p.area_m2} m²</span> : null}
                          {p.duration ? <span>{p.duration}</span> : null}
                        </div>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="pf-cta">
        <div className="container">
          <h2>Pronto para a sua reforma?</h2>
          <p>
            Envie os dados do imóvel e receba uma análise inicial de escopo, projeto e
            próximos passos, sem compromisso.
          </p>
          <a href="/diagnostico" className="btn btn-primary">
            Solicitar diagnóstico <span className="arrow">→</span>
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="foot">
        <div className="foot-grid">
          <div>
            <a href="/">
              <BrandLockup />
            </a>
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
    </div>
  );
}
