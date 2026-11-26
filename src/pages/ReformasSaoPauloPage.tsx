import BwaNav from "@/components/BwaNav";
import BwaFooter from "@/components/BwaFooter";
import { ESCOPO_FRASE } from "@/content/escopoOficial";
import { MARCENARIA_ARTIGO_PATH, REFORMAS_DESCRIPTION, REFORMAS_PATH, REFORMAS_TITLE } from "@/content/pages/reformas-sao-paulo.seo";
import { useSeo } from "@/lib/useSeo";
import { useCtaClickTracking } from "@/lib/trackCta";
import "./servico-reforma.css";
import "./reformas-sp.css";

export default function ReformasSaoPauloPage() {
  useSeo({ title: REFORMAS_TITLE, description: REFORMAS_DESCRIPTION, canonicalPath: REFORMAS_PATH, ogType: "website" });
  useCtaClickTracking(REFORMAS_PATH);
  return (
    <div className="bwa-servico bwa-reformas-page">
      <BwaNav />
      <main id="main" tabIndex={-1}>
        <section className="bwa-reformas-intro" aria-labelledby="reformas-titulo">
          <div className="bwa-shell">
            <p className="bwa-label bwa-label-accent">Bewild · Projeto e execução</p>
            <h1 className="bwa-title" id="reformas-titulo">Reformas em São Paulo</h1>
            <p className="bwa-servico-lead">Do planejamento à entrega, a reforma começa com decisões sobre o uso do imóvel, o layout e o escopo. A Bewild reúne arquitetura, engenharia, obra e marcenaria para apartamentos e studios recém-entregues na capital.</p>
            <a className="bwa-button" href="/orcamento" data-cta="reformas-sp-topo-orcamento">Solicitar orçamento <span aria-hidden="true">→</span></a>
          </div>
        </section>
        <figure className="bwa-shell bwa-reformas-media">
          <img src="/images/hero-slides/varanda-barril-md.jpg" alt="Ambiente com poltronas caramelo, barril de madeira e varanda envidraçada" width="1280" height="720" decoding="async" />
          <figcaption>Ambientes Bewild em São Paulo</figcaption>
        </figure>
        <section className="bwa-servico-block" aria-labelledby="reformas-servicos">
          <div className="bwa-shell">
            <p className="bwa-label bwa-label-accent">Seu imóvel</p>
            <h2 className="bwa-servico-h2" id="reformas-servicos">Um caminho para cada reforma</h2>
            <div className="bwa-reformas-grid">
              <article><h3>Apartamentos</h3><p className="bwa-servico-text">Planeje os ambientes para morar ou alugar, com escolhas de materiais, instalações e móveis alinhadas ao projeto.</p><p className="bwa-servico-text"><a href="/reforma-de-apartamento-sao-paulo">Reforma de apartamento em São Paulo <span aria-hidden="true">→</span></a></p></article>
              <article><h3>Studios</h3><p className="bwa-servico-text">Integre os usos de um espaço compacto e defina a marcenaria de acordo com a rotina de moradia ou locação.</p><p className="bwa-servico-text"><a href="/reforma-de-studio-sao-paulo">Reforma de studio em São Paulo <span aria-hidden="true">→</span></a></p></article>
            </div>
          </div>
        </section>
        <section className="bwa-servico-block" aria-labelledby="reformas-planejamento">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="reformas-planejamento">Defina o escopo antes da obra</h2>
            <p className="bwa-servico-text">{ESCOPO_FRASE}</p>
            <p className="bwa-servico-text">Liste o que o imóvel precisa, aprove o projeto e confira as condições do condomínio. A proposta deve deixar claros os itens incluídos e a data de entrega, sem depender de um prazo genérico.</p>
            <p className="bwa-servico-text"><a href="/como-funciona">Conheça as etapas da reforma <span aria-hidden="true">→</span></a></p>
            <p className="bwa-servico-text"><a href="/indice-de-custo-de-reforma">Consulte o Índice Bewild de custo de reforma <span aria-hidden="true">→</span></a></p>
          </div>
        </section>
        <section className="bwa-servico-block" aria-labelledby="reformas-marcenaria">
          <div className="bwa-shell">
            <p className="bwa-label bwa-label-accent">Leitura para planejar</p>
            <h2 className="bwa-servico-h2" id="reformas-marcenaria">Marcenaria sob medida na reforma</h2>
            <p className="bwa-servico-text">Armários, cozinha e móveis precisam conversar com as medidas do ambiente e as instalações. Definir essas peças junto do projeto ajuda a organizar o escopo e comparar o que cada orçamento inclui.</p>
            <p className="bwa-servico-text">No artigo de marcenaria sob medida, veja referências de peças, metragem e preços para planejar sua reforma em São Paulo.</p>
            <p className="bwa-servico-text"><a href={MARCENARIA_ARTIGO_PATH}>Marcenaria sob medida na reforma de apartamento em São Paulo <span aria-hidden="true">→</span></a></p>
          </div>
        </section>
        <section className="bwa-servico-block" aria-labelledby="reformas-contato">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="reformas-contato">Conte o que você quer reformar</h2>
            <p className="bwa-servico-text">Informe a metragem, o bairro e o uso do imóvel para começar seu pedido de orçamento.</p>
            <a className="bwa-button" href="/orcamento" data-cta="reformas-sp-final-orcamento">Solicitar orçamento <span aria-hidden="true">→</span></a>
          </div>
        </section>
      </main>
      <BwaFooter />
    </div>
  );
}