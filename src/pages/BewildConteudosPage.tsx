/**
 * BewildConteudosPage — /conteudos (Bewild).
 * "Caderno de publicações" (prancha 04): lista de posts na linguagem de
 * prancheta. Destaque automático (featured), filtros por categoria, e cada
 * card abre o post em /conteudos/:slug. CSS isolado em .bw-conteudos.
 *
 * Paginada (auditoria de SEO, rodada 4, 09/11/2026, ação 12): o servidor manda
 * só o destaque e o lote da página (`page`); o resto está em
 * `/conteudos?pagina=N`, com links reais. Busca e filtro valem para todos os
 * artigos: o índice completo (sem corpo) é pedido sob demanda.
 */
import { PROVA_REFORMAS } from "@/content/provas";
import { useMemo, useState } from "react";
import { preload } from "react-dom";
import { Search } from "lucide-react";
import { searchPosts } from "@/lib/postSearch";
import { useSeo } from "@/lib/useSeo";
import BwaNav from "@/components/BwaNav";
import BwaFooter from "@/components/BwaFooter";
import { whatsappHref } from "@/components/landing/content";
import {
  CONTENT_CARD_SIZES,
  CONTENT_FEATURED_SIZES,
  CONTENT_FEATURED_WIDTHS,
  THUMB_WIDTHS,
  responsiveImageProps,
} from "@/lib/imageUrl";
import {
  useBewildPosts,
  usePostIndex,
  bewildCategoryLabel,
  BEWILD_CATEGORIES,
  formatBewildDate,
  type BewildPost,
  type BewildPostCategory,
} from "@/lib/useBewildPosts";
import { conteudosPagePath, type PaginaDeConteudos, type PostCard, type PostIndexItem } from "@/lib/conteudosPagination";
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

function PostMeta({ post, long }: { post: PostCard; long?: boolean }) {
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

/** Links reais para cada página da lista (a 1 é /conteudos). */
function Paginacao({ pagina, totalPaginas }: { pagina: number; totalPaginas: number }) {
  if (totalPaginas <= 1) return null;
  const numeros = Array.from({ length: totalPaginas }, (_, i) => i + 1);
  return (
    <nav className="ct-pager" aria-label="Páginas da lista de artigos">
      {pagina > 1 ? (
        <a className="ct-pager__step" href={conteudosPagePath(pagina - 1)} rel="prev">
          <span aria-hidden="true">←</span> Página anterior
        </a>
      ) : null}
      <ol className="ct-pager__list">
        {numeros.map((n) => (
          <li key={n}>
            {n === pagina ? (
              <span className="ct-pager__num is-current" aria-current="page">
                <span className="sr-only">Página </span>
                {n}
              </span>
            ) : (
              <a className="ct-pager__num" href={conteudosPagePath(n)}>
                <span className="sr-only">Página </span>
                {n}
              </a>
            )}
          </li>
        ))}
      </ol>
      {pagina < totalPaginas ? (
        <a className="ct-pager__step" href={conteudosPagePath(pagina + 1)} rel="next">
          Próxima página <span aria-hidden="true">→</span>
        </a>
      ) : null}
    </nav>
  );
}

/** Sem dado do servidor (`page`), o hook não busca nada. */
const SEM_BUSCA: BewildPost[] = [];

type Props = {
  /** Página da lista vinda do loader (SSR); `null` = falha de rede, busca no cliente. */
  page?: PaginaDeConteudos | null;
  /** Índice completo já enviado pelo servidor (URL com `?q=`). */
  initialIndex?: PostIndexItem[] | null;
  /** Páginas N ≥ 2: título, descrição e query do canonical, iguais aos do head() da rota. */
  pagedSeo?: { title: string; description: string; ogImage?: string; canonicalSearch: string } | null;
  query?: string;
  onQueryChange?: (q: string) => void;
};

export default function BewildConteudosPage({ page = null, initialIndex = null, pagedSeo = null, query = "", onQueryChange }: Props = {}) {
  // Fallback (loader falhou): lista inteira no cliente, como antes da paginação.
  const fallback = useBewildPosts(page ? SEM_BUSCA : null);
  const [filter, setFilter] = useState<FilterValue>("all");
  const [prefetch, setPrefetch] = useState(false);
  const q = query.trim();
  const indexMode = filter !== "all" || !!q;
  const { index, loading: indexLoading } = usePostIndex(!!page && (indexMode || prefetch), initialIndex);

  const loading = page ? false : fallback.loading;
  const error = page ? null : fallback.error;
  // Índice completo (busca/filtro), página do servidor ou fallback do cliente.
  const { all, featured, grid } = useMemo((): { all: PostCard[]; featured: PostCard | null; grid: PostCard[] } => {
    if (!page) return { all: fallback.posts, featured: fallback.featured, grid: fallback.grid };
    if (indexMode && index) {
      const f = index.find((p) => p.featured) ?? null;
      return { all: index, featured: f, grid: index.filter((p) => p !== f) };
    }
    return { all: [...(page.featured ? [page.featured] : []), ...page.posts], featured: page.featured, grid: page.posts };
  }, [page, indexMode, index, fallback.posts, fallback.featured, fallback.grid]);
  const total = page ? page.total : fallback.posts.length;
  const paginated = !!page && !indexMode && page.totalPaginas > 1;

  useSeo({
    title: pagedSeo?.title ?? "Arquitetura, engenharia e custo de reforma em SP: guias | Bewild",
    description:
      pagedSeo?.description ??
      "Guias práticos da Bewild sobre projeto de arquitetura, engenharia, custo, etapas e prazo de obra para reformar apartamento em São Paulo.",
    keywords:
      "projeto de arquitetura, arquitetura e engenharia, engenharia civil, custo de reforma, quanto custa reformar um apartamento, custo de reforma de apartamento em SP, etapas de uma reforma, prazo de reforma de apartamento, reforma de apartamento em SP, Bewild",
    canonicalPath: "/conteudos",
    canonicalSearch: pagedSeo?.canonicalSearch,
    ogType: "website",
    ogImage: pagedSeo?.ogImage ?? featured?.cover_image ?? all.find((p) => p.cover_image)?.cover_image ?? undefined,
  });

  const filteredGrid = useMemo(() => {
    const source = q ? searchPosts(all as PostIndexItem[], q) : grid;
    if (filter === "all") return source;
    return source.filter((p) => p.category === filter);
  }, [grid, all, filter, q]);

  const showFeatured = featured && (filter === "all" || featured.category === filter);
  // Capa do destaque = maior elemento da primeira tela no celular (LCP). Antes
  // saía com loading="lazy" e só era pedida depois do layout; agora o preload
  // sobe para o topo do <head> do HTML do servidor (mesmas URLs do <img>).
  const featuredImg = featured?.cover_image
    ? responsiveImageProps(featured.cover_image, CONTENT_FEATURED_WIDTHS, 960, CONTENT_FEATURED_SIZES)
    : null;
  if (featuredImg && showFeatured && !loading && !error) {
    preload(featuredImg.src, {
      as: "image",
      fetchPriority: "high",
      ...(featuredImg.srcSet ? { imageSrcSet: featuredImg.srcSet, imageSizes: featuredImg.sizes } : {}),
    });
  }

  return (
    <>
      <div className="bw-conteudos">
        <BwaNav />

        <div className="bw-conteudos__frame" aria-hidden="true">
          <i className="tk tl" /><i className="tk tr" /><i className="tk bl" /><i className="tk br" />
        </div>
        <div className="bw-conteudos__titleblock" aria-hidden="true">BEWILD<br /><b>BW—004 / CONTEÚDOS</b><br />SÃO PAULO · BR</div>
        <div className="bw-conteudos__sheetno" aria-hidden="true">SHEET 04 / PUBLICAÇÕES</div>

        <main id="main" tabIndex={-1}>
        {/* HERO */}
        <section className="ct-hero">
          <div className="ct-wrap">
            <p className="ct-eyb">Conteúdos · inteligência de short stay</p>
            <h1>Quem reforma decide <span className="accent">melhor informado.</span></h1>
            <p className="ct-lead">Mercado, regras, reforma e operação de short stay em São Paulo, explicados pra quem investe e não quer errar a compra.</p>
            <p className="ct-videos-link"><a className="ct-chip" href="/videos">Prefere assistir? Ver os vídeos</a></p>
            <form className="ct-search" role="search" onSubmit={(e) => e.preventDefault()}>
              <label htmlFor="ct-search-input" className="ct-search__label">Buscar artigos</label>
              <div className="ct-search__row">
                <Search size={22} aria-hidden="true" />
                <input id="ct-search-input" className="ct-search__input" type="search" name="q" value={query} onFocus={() => setPrefetch(true)} onChange={(e) => onQueryChange?.(e.target.value)} placeholder="Buscar por título ou descrição" autoComplete="off" enterKeyHint="search" maxLength={120} />
              </div>
            </form>
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
                    {featuredImg ? (
                      <img
                        {...featuredImg}
                        alt={featured.title}
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                      />
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
              {!loading && !error && (
                <span className="ct-count" role="status" aria-live="polite">
                  {indexMode
                    ? indexLoading
                      ? "Buscando em todos os artigos…"
                      : `${pad(filteredGrid.length)} ${q ? (filteredGrid.length === 1 ? "resultado" : "resultados") : filteredGrid.length === 1 ? "artigo" : "artigos"}`
                    : `${pad(total)} ${total === 1 ? "artigo" : "artigos"} no índice${paginated && page ? ` · página ${page.pagina} de ${page.totalPaginas}` : ""}`}
                </span>
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
                {total === 0 ? "Em breve, novos conteúdos publicados." : q ? `Nenhum artigo encontrado para “${q}” nessa seleção.` : "Nenhum conteúdo nessa categoria ainda."}
              </div>
            )}

            {!loading && !error && filteredGrid.length > 0 && (
              <div className="ct-grid">
                {filteredGrid.map((p) => (
                  <a key={p.id} href={`/conteudos/${p.slug}`} className="ct-card" aria-label={`Ler: ${p.title}`}>
                    <div className={"ct-card__media" + (!p.cover_image ? " is-empty" : "")}>
                      {p.cover_image ? (
                        <img
                          {...responsiveImageProps(p.cover_image, THUMB_WIDTHS, 640, CONTENT_CARD_SIZES)}
                          alt={p.title}
                          loading="lazy"
                          decoding="async"
                        />
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

            {paginated && page ? <Paginacao pagina={page.pagina} totalPaginas={page.totalPaginas} /> : null}
          </div>
        </section>

        {/* CTA */}
        <section className="ct-cta">
          <div className="gridbg" aria-hidden="true" />
          <div className="ct-cta__inner">
            <span className="ct-eyb center">Orçamento · sem custo, sem compromisso</span>
            <h2>Da leitura à decisão: <span className="accent">avalie o seu studio.</span></h2>
            <p>Manda os dados do seu imóvel e a gente devolve uma leitura de potencial, escopo e próximos passos.</p>
            <div className="ct-cta__act">
              <a href="/orcamento" className="ct-btn cyan">Solicitar orçamento <span className="ar"><IconArrow /></span></a>
              <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="ct-btn ghost">Falar no WhatsApp</a>
            </div>
            <div className="ct-cta__rea">{PROVA_REFORMAS} · São Paulo capital</div>
          </div>
        </section>
        </main>
      </div>

      <BwaFooter />
    </>
  );
}
