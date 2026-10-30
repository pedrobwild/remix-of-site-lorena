import { RadarLink } from "@/components/RadarLink";
import { PROVA_CURTA, REFORMAS_ENTREGUES } from "@/content/provas";
import { BASE_CUSTO, CUSTO_M2_MEDIANO, ORCAMENTO_MEDIANO, STUDIO_TABELA_VIGENTE, brl } from "@/content/baseCusto";
import BwaFooter from "@/components/BwaFooter";
import BwaImprensa from "@/components/BwaImprensa";
import BwaNav from "@/components/BwaNav";
import { whatsappHref } from "@/components/landing/content";
import { BAIRROS, REMOTO_ITEMS, bairroHref, type BairroPageLink } from "@/lib/bairrosSp";
import { useSeo } from "@/lib/useSeo";
import { useCtaClickTracking } from "@/lib/trackCta";
import "./servico-reforma.css";
import type { TopoVariante } from "@/lib/googleAdsVariant";
import {
  AIRBNB_CHECK,
  CANONICAL,
  FAQ,
  heroStudioDaVariante,
  SEO_DESCRIPTION,
  SEO_KEYWORDS,
  SEO_TITLE,
} from "@/content/pages/reforma-de-studio-sao-paulo";

/* ============================================================
 * ReformaStudioSpPage — /reforma-de-studio-sao-paulo
 * Página de serviço para busca e AI Overview ("reforma de studio
 * em São Paulo"). Mesma estrutura de ReformaApartamentoSpPage.
 * ============================================================ */

// Link interno SEM utm_*: UTM em link interno sobrescreve a campanha paga real
// (e o gclid/fbclid) com que o visitante chegou. A navegação da SPA já carrega
// os parâmetros de campanha da URL atual (carryCampaignParams), e o clique no
// CTA é medido por useCtaClickTracking (data-cta).
const CTA_HREF = "/orcamento";

const CONTRATO: { n: string; t: string }[] = [
  { n: "01", t: "Projeto aprovado em 3D antes da obra" },
  {
    n: "02",
    t: "Preço fechado — se a obra custar mais do que o combinado, a diferença é por nossa conta",
  },
  { n: "03", t: "Prazo em contrato — você sabe a data de entrega na assinatura" },
  { n: "04", t: "Time e marcenaria próprios" },
  { n: "05", t: "Mobília, eletros e entrega das chaves com vistoria de engenheiro" },
  { n: "06", t: "Bwild Workflow e 5 anos de garantia" },
];

const PASSOS: { n: string; t: string }[] = [
  { n: "01", t: "Contato e leitura do imóvel" },
  { n: "02", t: "Visita e medição" },
  { n: "03", t: "Projeto 3D com revisões" },
  { n: "04", t: "Proposta e contrato" },
  { n: "05", t: "Obra de cerca de 60 dias úteis acompanhada pelo Bwild Workflow" },
  { n: "06", t: "Vistoria e entrega das chaves" },
];

type Props = {
  /** Páginas de bairro existentes (loader da rota); null = sem dados → links para /portfolio. */
  bairroPages?: BairroPageLink[] | null;
  /** Topo pela intenção da busca paga (loader da rota); orgânico = "padrao". */
  topoVariante?: TopoVariante;
};

export default function ReformaStudioSpPage({ bairroPages = null, topoVariante = "padrao" }: Props = {}) {
  useCtaClickTracking("reforma-studio-sp");
  const hero = heroStudioDaVariante(topoVariante);

  useSeo({
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    keywords: SEO_KEYWORDS,
    canonicalPath: CANONICAL,
    ogType: "website",
  });

  return (
    <div className="bwa-servico">
      <BwaNav />

      <main id="main" tabIndex={-1}>
        <section className="bwa-servico-intro">
          <div className="bwa-shell bwa-servico-head">
            <p className="bwa-label">Reforma de studio em São Paulo</p>
            <div>
              {/* Singular de propósito: "reforma de studio" é a busca desta página. */}
              <h1 className="bwa-title">
                {hero.h1}{" "}
                <em>{hero.destaque}</em>
              </h1>
              <p className="bwa-servico-lead">
                {hero.lead} Mais de {REFORMAS_ENTREGUES} reformas
                entregues, a maioria em studios de 20 a 35 m².
              </p>
              <div className="bwa-servico-cta-actions bwa-servico-top-actions">
                <a className="bwa-button" href={CTA_HREF} data-cta="servico-reforma-studio-sp-topo">
                  Peça seu orçamento <span aria-hidden="true">→</span>
                </a>
                <a className="bwa-servico-whats" href={whatsappHref()} target="_blank" rel="noopener noreferrer">
                  Falar no WhatsApp <span aria-hidden="true">→</span>
                </a>
                <p className="bwa-servico-cta-note">Sem custo e sem compromisso</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="preco-studio">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="preco-studio">
              Quanto custa reformar um studio em São Paulo?
            </h2>
            <p className="bwa-servico-text">
              Na base de {BASE_CUSTO.contratos} contratos de reforma completa da Bewild em unidades de até 50 m²,
              a mediana foi {ORCAMENTO_MEDIANO}, ou {CUSTO_M2_MEDIANO} por m². Metade dos contratos ficou
              entre {brl(BASE_CUSTO.m2P25)} e {brl(BASE_CUSTO.m2P75)} por m².
            </p>
            <table className="bwa-servico-price-table">
              <caption>Preço de referência da reforma completa</caption>
              <thead>
                <tr><th scope="col">Referência</th><th scope="col">Valor</th></tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Mediana de {BASE_CUSTO.contratos} contratos, até 50 m²</th>
                  <td>{ORCAMENTO_MEDIANO} ({CUSTO_M2_MEDIANO} por m²)</td>
                </tr>
                {STUDIO_TABELA_VIGENTE.referencias.map((referencia) => (
                  <tr key={referencia.areaM2}>
                    <th scope="row">Tabela vigente, studio de {referencia.areaM2} m²</th>
                    <td>cerca de R$ {referencia.valorMil} mil</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="bwa-servico-text">
              O valor inclui projeto, obra, marcenaria sob medida, mobiliário e eletrodomésticos
              (e enxoval, no short stay), num contrato de preço fechado. A obra de um studio de
              até {STUDIO_TABELA_VIGENTE.prazo.areaMaxM2} m² sem integração da varanda leva
              até {STUDIO_TABELA_VIGENTE.prazo.diasUteisMax} dias úteis, com a data escrita no contrato.
            </p>
            <p className="bwa-servico-text">
              Os valores da base são de contratos já assinados; a tabela vigente é de {STUDIO_TABELA_VIGENTE.edicao}.
              O seu orçamento sai da metragem e do escopo do seu imóvel. A análise completa,
              com o que muda o preço, está em{" "}
              <a href="/conteudos/quanto-custa-reformar-apartamento-studio-ate-50-m2">
                quanto custa reformar um apartamento ou studio de até 50 m²
              </a>.
            </p>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="para-quem">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="para-quem">
              Para quem
            </h2>
            <ul className="bwa-servico-cards">
              <li>
                <h3>Para alugar ou vender</h3>
                <p>
                  Projeto pensado para a foto do anúncio, ocupação e manutenção
                  simples, com entrega pronta para anunciar. O contexto de
                  mercado está no{" "}
                  <RadarLink label="Radar Bewild" />.
                </p>
              </li>
              <li>
                <h3>Para morar</h3>
                <p>
                  Você define layout, materiais e marcenaria com o arquiteto,
                  aprova em 3D e recebe o studio com tudo instalado.
                </p>
              </li>
            </ul>
            <p className="bwa-servico-text" style={{ marginTop: 24 }}>
              Atendemos studios e apartamentos de qualquer metragem em São Paulo
              capital — veja obras entregues no{" "}
              <a href="/portfolio">portfólio</a>, o detalhamento de custo em{" "}
              <a href="/conteudos/quanto-custa-reformar-apartamento-studio-ate-50-m2">
                quanto custa reformar um apartamento ou studio de até 50 m²
              </a>{" "}
              e, para metragens maiores, a{" "}
              <a href="/reforma-de-apartamento-sao-paulo">
                reforma de apartamento em São Paulo
              </a>
              .
            </p>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="apartamento-pequeno">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="apartamento-pequeno">Reforma de apartamento pequeno, kitnet e studio</h2>
            <p className="bwa-servico-text">
              Num studio de 25 m², cama, bancada e circulação disputam os mesmos metros.
              Por isso o layout vem antes do acabamento: o estudo de layout define onde
              ficam marcenaria, tomadas e pontos de água, e só então sai o orçamento item
              a item. No studio para alugar, é esse estudo que decide quantos hóspedes
              cabem e o que aparece na foto do anúncio. A maioria das obras da Bewild é
              em studios e apartamentos compactos de 20 a 35 m², o que muita gente chama
              de kitnet; veja um <a href="/conteudos/estudo-de-layout-studio-25-m2">estudo de layout de 25 m²</a>{" "}
              e o <a href="/conteudos/antes-e-depois-studio-26-m2-vila-madalena">antes e depois de um studio de 26 m² na Vila Madalena</a>.
            </p>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="airbnb">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="airbnb">
              Reforma de studio para Airbnb e short stay
            </h2>
            <p className="bwa-servico-text">
              A maior parte dos studios que a Bewild reforma vai para locação por temporada. A
              reforma para Airbnb muda prioridades: o hóspede avalia foto, cama, chuveiro, wi-fi,
              ar-condicionado e limpeza fácil — não o acabamento mais caro. O projeto é feito para a
              foto do anúncio, para a rotina da faxina entre reservas e para durar com uso intenso.
            </p>
            <ul className="bwa-servico-list">
              {AIRBNB_CHECK.map((item) => (
                <li key={item.n}>
                  <span className="bwa-servico-num">{item.n}</span>
                  <span>{item.t}</span>
                </li>
              ))}
            </ul>
            <p className="bwa-servico-text" style={{ marginTop: 24 }}>
              Antes de reformar, confira se a unidade pode operar: apartamentos HIS e HMP não podem
              fazer short stay em São Paulo, e a convenção do prédio precisa permitir locação por
              temporada. O checklist completo está em{" "}
              <a href="/conteudos/preparar-studio-airbnb-checklist">preparar o studio para o Airbnb</a>;
              o que não vale a pena trocar num studio novo, em{" "}
              <a href="/conteudos/o-que-nao-reformar-no-studio-short-stay">o que não reformar no studio para short stay</a>;
              e a conta de quanto rende, em{" "}
              <a href="/conteudos/quanto-rende-studio-short-stay-sao-paulo">quanto rende um studio no short stay</a>.
            </p>
            {/* Mesma resposta do FAQ desta página e do /faq: a Bewild faz a gestão. */}
            <p className="bwa-servico-text" style={{ marginTop: 16 }}>
              A Bewild entrega o studio pronto para anunciar e também faz a gestão do Airbnb. Se
              preferir, a operação pode ficar com você ou com quem você escolher, sem exclusividade:
              a comparação está em{" "}
              <a href="/conteudos/gestao-propria-vs-gestora">gestão própria ou gestora profissional</a>.
            </p>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="arquitetura">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="arquitetura">Arquitetura e reforma no mesmo contrato</h2>
            <p className="bwa-servico-text">
              O projeto é da equipe de arquitetura da Bewild, com o arquiteto Thiago
              Dantas (CAU A162437-7) como responsável técnico, e a obra é executada por
              time próprio. O projeto aprovado em 3D vira o escopo do contrato, e o que
              está nele tem preço fechado. O plano de reforma da NBR 16280, com ART ou
              RRT, vai ao síndico antes da obra.
            </p>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="contrato">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="contrato">
              O que entra no contrato
            </h2>
            <ul className="bwa-servico-list">
              {CONTRATO.map((item) => (
                <li key={item.n}>
                  <span className="bwa-servico-num">{item.n}</span>
                  <span>{item.t}</span>
                </li>
              ))}
            </ul>
            <p className="bwa-servico-text" style={{ marginTop: 24 }}>
              A marcenaria é desenhada no projeto executivo e produzida em fábrica própria: materiais,
              ferragens e modelos estão em <a href="/marcenaria">marcenaria sob medida</a>.
            </p>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="como-funciona">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="como-funciona">
              Como funciona
            </h2>
            <ul className="bwa-servico-list">
              {PASSOS.map((item) => (
                <li key={item.n}>
                  <span className="bwa-servico-num">{item.n}</span>
                  <span>{item.t}</span>
                </li>
              ))}
            </ul>
            <p className="bwa-servico-text" style={{ marginTop: 24 }}>
              As 12 etapas, do briefing à entrega, estão detalhadas em{" "}
              <a href="/como-funciona">como funciona a reforma turnkey da Bewild</a>.
            </p>
            <p className="bwa-servico-text" style={{ marginTop: 16 }}>
              Três decisões que mudam o orçamento de um studio e valem ser tomadas antes do escopo:{" "}
              <a href="/conteudos/o-que-e-short-stay">o que é short stay e o que o anúncio exige</a>,{" "}
              <a href="/conteudos/ar-condicionado-studio-quantos-btus">quantos BTUs o ar-condicionado precisa (tabela de BTU)</a>{" "}
              e <a href="/conteudos/fechar-varanda-em-vidro-studio-condominio">fechar a varanda com vidro</a>, que depende do condomínio.
            </p>
          </div>
        </section>

        <section className="bwa-servico-remoto" aria-labelledby="remoto">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="remoto">
              Reforma à distância
            </h2>
            <p className="bwa-servico-text">
              Você não precisa estar em São Paulo. Quem mora em outra cidade
              acompanha projeto, obra e entrega pelo Bwild Workflow — veja{" "}
              <a href="/onde-atuamos">onde atuamos</a>.
            </p>
            <ul className="bwa-servico-list">
              {REMOTO_ITEMS.map((item) => (
                <li key={item.n}>
                  <span className="bwa-servico-num">{item.n}</span>
                  <span>{item.t}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="bairros">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="bairros">
              Bairros com obras entregues
            </h2>
            <ul className="bwa-servico-bairros">
              {BAIRROS.map((b) => (
                <li key={b}>
                  <a href={bairroHref(b, bairroPages)}>{b}</a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <BwaImprensa />

        <section className="bwa-servico-block" aria-labelledby="faq">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="faq">
              Perguntas frequentes
            </h2>
            <div className="bwa-servico-faq">
              {FAQ.map((item) => (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  <p>{item.node ?? item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bwa-servico-cta" aria-label="Solicitar orçamento">
          <div className="bwa-shell bwa-servico-cta-grid">
            <h2>
              Seu studio é em São Paulo? <em>O resto é com a gente.</em>
            </h2>
            <div className="bwa-servico-cta-actions">
              <a
                className="bwa-button bwa-button-light"
                href={CTA_HREF}
                data-cta="servico-reforma-studio-sp"
              >
                Solicitar orçamento <span aria-hidden="true">→</span>
              </a>
              <a
                className="bwa-servico-whats"
                href={whatsappHref()}
                target="_blank"
                rel="noopener noreferrer"
              >
                Falar no WhatsApp <span aria-hidden="true">→</span>
              </a>
              <p className="bwa-servico-cta-note">
                {PROVA_CURTA}
              </p>
            </div>
          </div>
        </section>
      </main>

      <BwaFooter />
    </div>
  );
}
