/**
 * BewildConteudosPage — /conteudos (novo, Bewild).
 *
 * Lista pública dos posts publicados em `bewild_posts.published = true`.
 * Independente do BlogPage antigo (legado), que segue
 * existindo no repo mas não está mais montado em /conteudos.
 *
 * Visual: reusa wrapper .bw-home + .bw-conteudos com chips do portfolio.
 */
import { useMemo, useState } from "react";
import { useSeo } from "@/lib/useSeo";
import BewildSiteNav from "@/components/BewildSiteNav";
import SiteFooter from "@/components/SiteFooter";
import { whatsappHref } from "@/components/landing/content";
import {
  useBewildPosts,
  bewildCategoryLabel,
  BEWILD_CATEGORIES,
  formatBewildDate,
  type BewildPost,
  type BewildPostCategory,
} from "@/lib/useBewildPosts";
import "@/styles/home.css";
import "@/styles/portfolio.css";
import "@/styles/conteudos.css";

type FilterValue = "all" | BewildPostCategory;

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Todos" },
  ...BEWILD_CATEGORIES.map((c) => ({ value: c, label: bewildCategoryLabel(c) })),
];


function PostMeta({ post }: { post: BewildPost }) {
  const date = formatBewildDate(post.published_at ?? post.created_at);
  const mins = post.reading_time && post.reading_time > 0 ? `${post.reading_time} min` : null;
  return (
    <span>
      {mins ? <span>{mins} de leitura</span> : null}
      {mins && date ? <span className="ct-dot">·</span> : null}
      {date ? <span>{date}</span> : null}
    </span>
  );
}

export default function BewildConteudosPage() {
  const { featured, grid, posts, loading, error } = useBewildPosts();
  const [filter, setFilter] = useState<FilterValue>("all");

  useSeo({
    title: "Conteúdos Bewild · mercado, reforma e operação de studios em SP",
    description:
      "Quem investe em studio decide melhor informado. Mercado, regras, reforma e operação de short stay em São Paulo, explicados para quem investe.",
    canonicalPath: "/conteudos",
    ogType: "website",
    ogImage: featured?.cover_image ?? posts.find((p) => p.cover_image)?.cover_image ?? undefined,
  });

  const filteredGrid = useMemo(() => {
    if (filter === "all") return grid;
    return grid.filter((p) => p.category === filter);
  }, [grid, filter]);

  // Aplica filtro também ao destaque: se não bater, esconde
  const showFeatured = featured && (filter === "all" || featured.category === filter);

  return (
    <div className="bw-home bw-conteudos">
      {/* NAV */}
      <BewildSiteNav />

      {/* HERO */}
      <section className="ct-hero">
        <div className="container">
          <div className="eyebrow" style={{ color: "var(--cyan)" }}>
            Conteúdos
          </div>
          <h1>Quem investe em studio decide melhor informado.</h1>
          <p className="lead">
            Mercado, regras, reforma e operação de short stay em São Paulo,
            explicados para quem investe e não quer errar a compra.
          </p>
        </div>
      </section>

      {/* DESTAQUE */}
      {!loading && !error && showFeatured && featured && (
        <section className="ct-featured-section">
          <div className="container">
            <a
              href={`/conteudos/${featured.slug}`}
              className="ct-featured"
              aria-label={`Ler: ${featured.title}`}
            >
              <div
                className={
                  "ct-featured__media" +
                  (!featured.cover_image ? " ct-featured__media--empty" : "")
                }
              >
                {featured.cover_image ? (
                  <img
                    src={featured.cover_image}
                    alt={featured.title}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span>Capa em breve</span>
                )}
              </div>
              <div className="ct-featured__body">
                <div className="ct-featured__label">
                  Em destaque · {bewildCategoryLabel(featured.category)}
                </div>
                <h2 className="ct-featured__title">{featured.title}</h2>
                {featured.excerpt ? (
                  <p className="ct-featured__excerpt">{featured.excerpt}</p>
                ) : null}
                <div className="ct-featured__meta">
                  <PostMeta post={featured} />
                </div>
                <span className="ct-featured__more">
                  Ler artigo <span className="arrow">→</span>
                </span>
              </div>
            </a>
          </div>
        </section>
      )}

      {/* LISTA */}
      <section className="ct-list">
        <div className="container">
          <div
            className="ct-filters"
            role="group"
            aria-label="Filtrar por categoria"
          >
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

          {loading && (
            <div className="ct-grid" aria-busy="true" aria-live="polite">
              <div className="ct-skeleton" />
              <div className="ct-skeleton" />
              <div className="ct-skeleton" />
            </div>
          )}

          {!loading && error && (
            <div className="ct-error">
              Não conseguimos carregar os conteúdos agora.{" "}
              <a href="/">Voltar para a home</a>.
            </div>
          )}

          {!loading && !error && filteredGrid.length === 0 && (
            <div className="ct-empty">
              {posts.length === 0
                ? "Em breve novos conteúdos publicados."
                : "Nenhum conteúdo nessa categoria ainda."}
            </div>
          )}

          {!loading && !error && filteredGrid.length > 0 && (
            <div className="ct-grid">
              {filteredGrid.map((p) => (
                <a
                  key={p.id}
                  href={`/conteudos/${p.slug}`}
                  className="ct-card"
                  aria-label={`Ler: ${p.title}`}
                >
                  <div
                    className={
                      "ct-card__media" +
                      (!p.cover_image ? " ct-card__media--empty" : "")
                    }
                  >
                    {p.cover_image ? (
                      <img
                        src={p.cover_image}
                        alt={p.title}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span>Capa em breve</span>
                    )}
                  </div>
                  <div className="ct-card__body">
                    <div className="ct-card__cat">
                      {bewildCategoryLabel(p.category)}
                    </div>
                    <h3 className="ct-card__title">{p.title}</h3>
                    {p.excerpt ? <p className="ct-card__excerpt">{p.excerpt}</p> : null}
                    <div className="ct-card__meta">
                      <PostMeta post={p} />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="ct-cta">
        <div className="container">
          <div className="eyebrow" style={{ color: "var(--sky, #5FB2DD)" }}>
            Diagnóstico
          </div>
          <h2>Da leitura à decisão: avalie o seu studio.</h2>
          <p>
            Envie os dados do imóvel e receba uma análise inicial de escopo,
            projeto e próximos passos. Sem compromisso.
          </p>
          <div className="ct-cta__btns">
            <a href="/diagnostico" className="btn btn-cyan">
              Solicitar diagnóstico <span className="arrow">→</span>
            </a>
            <a
              href={whatsappHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost-light"
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
