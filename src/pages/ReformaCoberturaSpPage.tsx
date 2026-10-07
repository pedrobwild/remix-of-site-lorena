import { PROVA_CURTA, REFORMAS_ENTREGUES } from "@/content/provas";
import BwaFooter from "@/components/BwaFooter";
import BwaImprensa from "@/components/BwaImprensa";
import BwaNav from "@/components/BwaNav";
import { whatsappHref } from "@/components/landing/content";
import { BAIRROS, REMOTO_ITEMS } from "@/lib/bairrosSp";
import { useSeo } from "@/lib/useSeo";
import { useCtaClickTracking } from "@/lib/trackCta";
import "./servico-reforma.css";
import { CANONICAL, FAQ } from "@/content/pages/reforma-de-cobertura-sao-paulo";

/* ============================================================
 * ReformaCoberturaSpPage — /reforma-de-cobertura-sao-paulo
 * Página de serviço para busca e AI Overview ("reforma de
 * cobertura em São Paulo"). Mesma estrutura de
 * ReformaApartamentoSpPage e ReformaStudioSpPage.
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
  { n: "05", t: "Obra acompanhada pelo Bwild Workflow, com prazo em contrato" },
  { n: "06", t: "Vistoria e entrega das chaves" },
];

export default function ReformaCoberturaSpPage() {
  useCtaClickTracking("reforma-cobertura-sp");

  useSeo({
    title: "Reforma de cobertura em São Paulo | Projeto, obra e mobília — Bewild",
    description:
      "Reforma completa de cobertura em São Paulo: projeto 3D, obra, terraço, marcenaria e mobília em um contrato, com preço fechado, prazo e 5 anos de garantia.",
    canonicalPath: CANONICAL,
    ogType: "website",
  });

  return (
    <div className="bwa-servico">
      <BwaNav />

      <main id="main" tabIndex={-1}>
        <section className="bwa-servico-intro">
          <div className="bwa-shell bwa-servico-head">
            <p className="bwa-label">Reforma de cobertura em São Paulo</p>
            <div>
              <h1 className="bwa-title">
                Reforma de cobertura em São Paulo,{" "}
                <em>entregue pronta para morar.</em>
              </h1>
              <p className="bwa-servico-lead">
                A Bewild faz a reforma completa da sua cobertura em São Paulo:
                projeto 3D, obra, terraço e área externa, marcenaria sob medida
                e mobília em um único contrato, com preço fechado, prazo em
                contrato e 5 anos de garantia. Mais de {REFORMAS_ENTREGUES} reformas entregues
                em apartamentos e studios de todos os tamanhos.
              </p>
            </div>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="para-quem">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="para-quem">
              Para quem
            </h2>
            <ul className="bwa-servico-cards">
              <li>
                <h3>Para morar</h3>
                <p>
                  Você define layout, materiais e marcenaria com o arquiteto,
                  aprova em 3D e recebe a cobertura com tudo instalado — da
                  cozinha ao terraço.
                </p>
              </li>
              <li>
                <h3>Para valorizar o imóvel</h3>
                <p>
                  Projeto pensado para valor de venda e manutenção simples, com
                  entrega pronta para anunciar. Veja obras entregues no{" "}
                  <a href="/portfolio">portfólio</a>.
                </p>
              </li>
            </ul>
            <p className="bwa-servico-text" style={{ marginTop: 24 }}>
              Atendemos coberturas e apartamentos de qualquer metragem em São
              Paulo capital — para metragens menores, veja a{" "}
              <a href="/reforma-de-apartamento-sao-paulo">
                reforma de apartamento em São Paulo
              </a>{" "}
              e a{" "}
              <a href="/reforma-de-studio-sao-paulo">
                reforma de studio em São Paulo
              </a>
              .
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
              <a href="/como-funciona">como funciona a reforma turnkey da Bewild</a>. Numa cobertura, a
              varanda e o terraço entram no projeto desde o briefing: o que o condomínio permite no
              fechamento está em{" "}
              <a href="/conteudos/fechar-varanda-em-vidro-studio-condominio">fechar varanda com vidro</a>.
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
                  <a href="/portfolio">{b}</a>
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
              Sua cobertura é em São Paulo? <em>O resto é com a gente.</em>
            </h2>
            <div className="bwa-servico-cta-actions">
              <a
                className="bwa-button bwa-button-light"
                href={CTA_HREF}
                data-cta="servico-reforma-cobertura-sp"
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
