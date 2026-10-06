/**
 * BewildBuscaPage — /buscar. Busca os artigos publicados pelo título e pela
 * descrição. O termo vive na URL (?q=) para o link poder ser compartilhado.
 * Reaproveita o visual de /conteudos (.bw-conteudos).
 */
import { useMemo } from "react";
import BwaNav from "@/components/BwaNav";
import BwaFooter from "@/components/BwaFooter";
import { useSeo } from "@/lib/useSeo";
import { searchPosts } from "@/lib/postSearch";
import { CONTENT_CARD_SIZES, THUMB_WIDTHS, responsiveImageProps } from "@/lib/imageUrl";
import {
  useBewildPosts,
  bewildCategoryLabel,
  formatBewildDate,
  type BewildPost,
} from "@/lib/useBewildPosts";
import "@/styles/conteudos.css";

type Props = {
  initialPosts?: BewildPost[] | null;
  query: string;
  onQueryChange: (q: string) => void;
};

export default function BewildBuscaPage({ initialPosts, query, onQueryChange }: Props) {
  const { posts, loading, error } = useBewildPosts(initialPosts);

  useSeo({
    title: "Buscar artigos | Bewild",
    description: "Pesquise os guias da Bewild sobre reforma, custo de obra, investimento e short stay em São Paulo pelo título ou pela descrição.",
    canonicalPath: "/buscar",
    ogType: "website",
    noindex: true,
  });

  const results = useMemo(() => searchPosts(posts, query), [posts, query]);
  const hasQuery = query.trim().length > 0;

  return (
    <>
      <div className="bw-conteudos">
        <BwaNav />
        <main id="main" tabIndex={-1}>
          <section className="ct-hero">
            <div className="ct-wrap">
              <p className="ct-eyb">Conteúdos · busca</p>
              <h1>Encontre o <span className="accent">artigo certo.</span></h1>
              <form className="ct-search" role="search" onSubmit={(e) => e.preventDefault()}>
                <label htmlFor="ct-search-input" className="ct-search__label">Buscar por título ou descrição</label>
                <div className="ct-search__row">
                  <input
                    id="ct-search-input"
                    className="ct-search__input"
                    type="search"
                    name="q"
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    placeholder="Ex.: custo de reforma de studio"
                    autoComplete="off"
                    enterKeyHint="search"
                  />
                  {hasQuery && (
                    <button type="button" className="ct-chip" onClick={() => onQueryChange("")}>Limpar</button>
                  )}
                </div>
              </form>
            </div>
          </section>

          <section className="ct-body">
            <div className="ct-wrap">
              <div className="ct-toolbar">
                <span className="ct-count" role="status" aria-live="polite">
                  {loading || error
                    ? ""
                    : hasQuery
                      ? `${results.length} ${results.length === 1 ? "resultado" : "resultados"}`
                      : `${posts.length} ${posts.length === 1 ? "artigo" : "artigos"} no índice`}
                </span>
                <a href="/conteudos" className="ct-chip">Ver todos os conteúdos</a>
              </div>

              {loading && (
                <div className="ct-state" aria-busy="true" aria-live="polite">Carregando artigos…</div>
              )}

              {!loading && error && (
                <div className="ct-state">Não conseguimos carregar os conteúdos agora. <a href="/conteudos">Ir para os conteúdos</a>.</div>
              )}

              {!loading && !error && results.length === 0 && (
                <div className="ct-state">
                  {hasQuery
                    ? <>Nenhum artigo encontrado para “{query.trim()}”. Tente outras palavras ou <a href="/conteudos">veja todos os conteúdos</a>.</>
                    : "Em breve, novos conteúdos publicados."}
                </div>
              )}

              {!loading && !error && results.length > 0 && (
                <div className="ct-grid">
                  {results.map((p) => (
                    <a key={p.id} href={`/conteudos/${p.slug}`} className="ct-card" aria-label={`Ler: ${p.title}`}>
                      <div className={"ct-card__media" + (!p.cover_image ? " is-empty" : "")}>
                        {p.cover_image ? (
                          // Mesma grade de /conteudos: capa na largura do card, não o
                          // original do bucket (MOB-06) — sem busca, a página lista todos.
                          <img
                            {...responsiveImageProps(p.cover_image, THUMB_WIDTHS, 640, CONTENT_CARD_SIZES)}
                            alt=""
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <span>Capa em breve</span>
                        )}
                      </div>
                      <div className="ct-card__body">
                        <div className="ct-card__cat">{bewildCategoryLabel(p.category)}</div>
                        <h2 className="ct-card__title">{p.title}</h2>
                        {(p.excerpt || p.meta_description) ? <p className="ct-card__excerpt">{p.excerpt || p.meta_description}</p> : null}
                        <div className="ct-card__meta"><span>{formatBewildDate(p.published_at ?? p.created_at)}</span></div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
      <BwaFooter />
    </>
  );
}
