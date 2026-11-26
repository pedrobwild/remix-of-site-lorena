import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { AVISO_AFILIADO, type ProdutoAfiliado } from "@/lib/afiliados";
import { affiliateCardHtml } from "@/lib/articleAffiliates";
import { agruparProdutos, idDaCategoria, type PerfilFiltro } from "@/lib/produtosRecomendados";
import { useSeo } from "@/lib/useSeo";
import { PRODUTOS_DESCRIPTION, PRODUTOS_H1, PRODUTOS_PATH, PRODUTOS_TITLE } from "@/content/pages/produtosRecomendados.seo";
import "@/styles/post.css";

/**
 * /produtos-recomendados — produtos do Mercado Livre com link de afiliado.
 *
 * Tudo vem do catálogo de /admin/afiliados, já lido no servidor pelo loader
 * (`produtos: null` = leitura falhou). Os cartões são os mesmos dos artigos
 * (`affiliateCardHtml`): link com `rel="sponsored nofollow noopener"`, aviso de
 * comissão em cada um e clique contado pelo delegate global (`data-cta`).
 * Sem preço (muda todo dia) e sem foto de anúncio. O fim da página leva ao
 * pedido de orçamento, sem `utm_*`.
 */
const FILTROS: { perfil: PerfilFiltro | null; label: string; href: string }[] = [
  { perfil: null, label: "Todos", href: PRODUTOS_PATH },
  { perfil: "investidor", label: "Para alugar", href: `${PRODUTOS_PATH}?perfil=investidor` },
  { perfil: "moradia", label: "Para morar", href: `${PRODUTOS_PATH}?perfil=moradia` },
];

export default function ProdutosRecomendadosPage({
  produtos,
  perfil,
  vazio,
}: {
  produtos: ProdutoAfiliado[] | null;
  perfil: PerfilFiltro | null;
  /** Mesmo valor que o `head()` da rota usou para o `noindex`. */
  vazio: boolean;
}) {
  useSeo({ title: PRODUTOS_TITLE, description: PRODUTOS_DESCRIPTION, canonicalPath: PRODUTOS_PATH, ogType: "website", noindex: vazio });

  const grupos = produtos ? agruparProdutos(produtos, perfil) : [];
  const total = produtos ? agruparProdutos(produtos, null).length : 0;

  return (
    <div className="bw-home bw-post">
      <BwaNav />

      <main id="main" tabIndex={-1}>
        <section className="pt-hero">
          <div className="container">
            <div className="pt-cat">Produtos · Bewild</div>
            <h1 className="pt-title">{PRODUTOS_H1}</h1>
            <p className="pt-excerpt">
              Eletros, móveis e itens que cabem em studio e apartamento compacto, separados por tipo. A compra é feita
              no Mercado Livre; confira medidas e tensão (127 V ou 220 V) na página do produto antes de fechar.
            </p>
            <p className="pt-excerpt bw-afiliado-pagina__aviso">{AVISO_AFILIADO}</p>
          </div>
        </section>

        <section className="pt-body-section">
          <div className="container">
            <div className="pt-body bw-afiliado-pagina">
              {produtos === null ? (
                <p role="alert">
                  Não foi possível carregar a lista agora. <a href={PRODUTOS_PATH}>Tentar de novo</a> ou{" "}
                  <a href="/conteudos">ver os guias de reforma</a>.
                </p>
              ) : total === 0 ? (
                <p>Estamos montando esta lista. Enquanto isso, veja os <a href="/conteudos">guias de reforma</a>.</p>
              ) : (
                <>
                  <nav className="bw-afiliado-filtros" aria-label="Filtrar por objetivo">
                    {FILTROS.map((f) => (
                      <a key={f.label} href={f.href} aria-current={f.perfil === perfil ? "page" : undefined}>
                        {f.label}
                      </a>
                    ))}
                  </nav>

                  {grupos.length === 0 ? (
                    <p>Nenhum produto para este filtro. <a href={PRODUTOS_PATH}>Ver todos</a>.</p>
                  ) : (
                    grupos.map((g) => (
                      <section key={g.categoria} aria-labelledby={idDaCategoria(g.categoria)}>
                        <h2 id={idDaCategoria(g.categoria)}>{g.categoria}</h2>
                        <div
                          className="bw-afiliado-grade"
                          dangerouslySetInnerHTML={{ __html: g.produtos.map(affiliateCardHtml).join("") }}
                        />
                      </section>
                    ))
                  )}
                </>
              )}

              <div className="pt-lead-cta">
                <p>Quer o studio pronto, com tudo isso instalado? A Bewild projeta, reforma e mobilia.</p>
                <a className="pt-btn" href="/orcamento" data-cta="produtos-recomendados-orcamento">
                  Pedir orçamento
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BwaFooter />
    </div>
  );
}
