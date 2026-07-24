/**
 * BewildConteudosPage — /conteudos (Bewild).
 * "Caderno de publicações" (prancha 04): lista de posts na linguagem de
 * prancheta. Destaque automático (featured), filtros por categoria, e cada
 * card abre o post em /conteudos/:slug. CSS isolado em .bw-conteudos.
 */
import { useMemo, useState } from "react";
import { useSeo } from "@/lib/useSeo";
import BwaNav from "@/components/BwaNav";
import BwaFooter from "@/components/BwaFooter";
import { whatsappHref } from "@/components/landing/content";
import {
  useBewildPosts,
  bewildCategoryLabel,
  BEWILD_CATEGORIES,
  formatBewildDate,
  type BewildPost,
  type BewildPostCategory,
} from "@/lib/useBewildPosts";
import "@/styles/conteudos.css";

type FilterValue = "all" | BewildPostCategory;

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Todos" },
  ...BEWILD_CATEGORIES.map((c) => ({ value: c, label: bewildCategoryLabel(c) })),
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

function PostMeta({ post, long }: { post: BewildPost; long?: boolean }) {
  const date = formatBewildDate(post.published_at ?? post.created_at);
  const mins = post.reading_time && post.reading_time > 0 ? `${post.reading_time} min${long ? " de leitura" : ""}` : null;
  return (
    <>
      {mins ? <span>{mins}</span> : null}
      {mins && date ? <span className="dot">·</span> : null}
      {date ? <span>{date}</span> : null}
    </>
  );
}

export default function BewildConteudosPage() {
  const { featured, grid, posts, loading, error } = useBewildPosts();
  const [filter, setFilter] = useState<FilterValue>("all");

  useSeo({
    title: "Conteúdos | Bewild",
    description:
      "Guias e análises sobre reforma, locação e decisão imobiliária, direto da operação da Bewild.",
    canonicalPath: "/conteudos",
    ogType: "website",
    ogImage: featured?.cover_image ?? posts.find((p) => p.cover_image)?.cover_image ?? undefined,
  });

  const filteredGrid = useMemo(() => {
    if (filter === "all") return grid;
    return grid.filter((p) => p.category === filter);
  }, [grid, filter]);

  const showFeatured = featured && (filter === "all" || featured.category === filter);

  return (
    <>
      <div className="bw-conteudos">
        <BwaNav />

        <div className="bw-conteudos__frame" aria-hidden="true">
          <i className="tk tl" /><i className="tk tr" /><i className="tk bl" /><i className="tk br" />
        </div>
        <div className="bw-conteudos__titleblock" aria-hidden="true">BEWILD<br /><b>BW—004 / CONTEÚDOS</b><br />SÃO PAULO · BR</div>
        <div className="bw-conteudos__sheetno" aria-hidden="true">SHEET 04 / PUBLICAÇÕES</div>

        {/* HERO */}
        <section className="ct-hero">
          <div className="ct-wrap">
            <p className="ct-eyb">Conteúdos · inteligência de short stay</p>
            <h1>Quem reforma decide <span className="accent">melhor informado.</span></h1>
            <p className="ct-lead">Mercado, regras, reforma e operação de short stay em São Paulo, explicados pra quem investe e não quer errar a compra.</p>
          </div>
        </section>

        {/* BODY */}
        <section className="ct-body">
          <div className="ct-wrap">

            {/* FEATURED */}
            {!loading && !error && showFeatured && featured && (
              <>
                <div className="ct-secmark"><span className="n">001</span><span className="t">Em destaque</span><span className="ln" /></div>
                <a href={`/conteudos/${featured.slug}`} className="ct-featured" aria-label={`Ler: ${featured.title}`}>
                  <div className={"ct-featured__media" + (!featured.cover_image ? " is-empty" : "")}>
                    {featured.cover_image ? (
                      <img src={featured.cover_image} alt={featured.title} loading="lazy" decoding="async" />
                    ) : (
                      <span className="ct-soon">Capa em breve</span>
                    )}
                    <span className="ct-fbadge">{bewildCategoryLabel(featured.category)}</span>
                    <i className="tk tl" /><i className="tk tr" /><i className="tk bl" /><i className="tk br" />
                  </div>
                  <div className="ct-featured__body">
                    <div className="ct-featured__label">Em destaque · {bewildCategoryLabel(featured.category)}</div>
                    <h2 className="ct-featured__title">{featured.title}</h2>
                    {featured.excerpt ? <p className="ct-featured__excerpt">{featured.excerpt}</p> : null}
                    <div className="ct-featured__meta"><PostMeta post={featured} long /></div>
                    <span className="ct-featured__more">Ler artigo <span className="ar"><IconArrow /></span></span>
                  </div>
                </a>
              </>
            )}

            {/* TOOLBAR */}
            <div className="ct-toolbar">
              <div className="ct-filters" role="group" aria-label="Filtrar por categoria">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    className={`ct-chip${filter === f.value ? " active" : ""}`}
                    aria-pressed={filter === f.value}
                    onClick={() => setFilter(f.value)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              {!loading && !error && filteredGrid.length > 0 && (
                <span className="ct-count">{pad(filteredGrid.length)} {filteredGrid.length === 1 ? "artigo" : "artigos"} no índice</span>
              )}
            </div>

            {/* GRID / ESTADOS */}
            {loading && (
              <div className="ct-grid" aria-busy="true" aria-live="polite">
                <div className="ct-skeleton" /><div className="ct-skeleton" /><div className="ct-skeleton" />
              </div>
            )}

            {!loading && error && (
              <div className="ct-state">Não conseguimos carregar os conteúdos agora. <a href="/">Voltar para a home</a>.</div>
            )}

            {!loading && !error && filteredGrid.length === 0 && (
              <div className="ct-state">
                {posts.length === 0 ? "Em breve, novos conteúdos publicados." : "Nenhum conteúdo nessa categoria ainda."}
              </div>
            )}

            {!loading && !error && filteredGrid.length > 0 && (
              <div className="ct-grid">
                {filteredGrid.map((p) => (
                  <a key={p.id} href={`/conteudos/${p.slug}`} className="ct-card" aria-label={`Ler: ${p.title}`}>
                    <div className={"ct-card__media" + (!p.cover_image ? " is-empty" : "")}>
                      {p.cover_image ? (
                        <img src={p.cover_image} alt={p.title} loading="lazy" decoding="async" />
                      ) : (
                        <span className="ct-soon">Capa em breve</span>
                      )}
                      <i className="tk tl" /><i className="tk tr" /><i className="tk bl" /><i className="tk br" />
                    </div>
                    <div className="ct-card__body">
                      <div className="ct-card__cat">{bewildCategoryLabel(p.category)}</div>
                      <h3 className="ct-card__title">{p.title}</h3>
                      {p.excerpt ? <p className="ct-card__excerpt">{p.excerpt}</p> : null}
                      <div className="ct-card__meta"><PostMeta post={p} /></div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="ct-cta">
          <div className="gridbg" aria-hidden="true" />
          <div className="ct-cta__inner">
            <span className="ct-eyb center">Diagnóstico gratuito · sem compromisso</span>
            <h2>Da leitura à decisão: <span className="accent">avalie o seu studio.</span></h2>
            <p>Manda os dados do seu imóvel e a gente devolve uma leitura de potencial, escopo e próximos passos.</p>
            <div className="ct-cta__act">
              <a href="/diagnostico" className="ct-btn cyan">Solicitar Orçamento <span className="ar"><IconArrow /></span></a>
              <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="ct-btn ghost">Falar no WhatsApp</a>
            </div>
            <div className="ct-cta__rea">+80 obras entregues · São Paulo e Rio de Janeiro</div>
          </div>
        </section>
      </div>

      <BwaFooter />
    </>
  );
}
