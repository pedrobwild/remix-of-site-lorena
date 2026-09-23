import type { ReactNode } from "react";
import BwaFooter from "@/components/BwaFooter";
import BwaImprensa from "@/components/BwaImprensa";
import BwaNav from "@/components/BwaNav";
import { whatsappHref } from "@/components/landing/content";
import { BAIRROS, REMOTO_ITEMS } from "@/lib/bairrosSp";
import { breadcrumbJsonLd, faqJsonLd, useSeo } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";
import { useCtaClickTracking } from "@/lib/trackCta";
import "./servico-reforma.css";

/* ============================================================
 * ReformaCoberturaSpPage — /reforma-de-cobertura-sao-paulo
 * Página de serviço para busca e AI Overview ("reforma de
 * cobertura em São Paulo"). Mesma estrutura de
 * ReformaApartamentoSpPage e ReformaStudioSpPage.
 * ============================================================ */

const CANONICAL = "/reforma-de-cobertura-sao-paulo";
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

const FAQ: { q: string; a: string; node?: ReactNode }[] = [
  {
    q: "Vocês reformam coberturas duplex e com terraço?",
    a: "Sim. O projeto considera os dois pavimentos, a área externa, a impermeabilização e as regras do condomínio antes de qualquer demolição.",
  },
  {
    q: "O terraço e a área externa entram no escopo?",
    a: "Entram, quando você quiser: piso, impermeabilização, churrasqueira, iluminação e marcenaria para a área externa fazem parte do projeto e do contrato.",
  },
  {
    q: "Quanto tempo demora a reforma de uma cobertura?",
    a: "Depende da metragem e do escopo — coberturas costumam levar mais do que os 60 dias úteis de referência de um studio. A data exata sai em contrato.",
    node: (
      <>
        Depende da metragem e do escopo — coberturas costumam levar mais do que
        os 60 dias úteis de referência de um studio, e a data exata sai em
        contrato. Os fatores que movem o prazo estão em{" "}
        <a href="/conteudos/quanto-tempo-demora-reforma-apartamento">
          quanto tempo demora uma reforma de apartamento
        </a>
        .
      </>
    ),
  },
  {
    q: "A obra em cobertura precisa de autorização do condomínio?",
    a: "Sim, como em qualquer apartamento — e em coberturas o síndico costuma olhar com mais atenção para fachada, área externa e horários. A Bewild prepara a documentação técnica exigida.",
    node: (
      <>
        Sim, como em qualquer apartamento — e em coberturas o síndico costuma
        olhar com mais atenção para fachada, área externa e horários. A Bewild
        prepara a documentação técnica exigida; o passo a passo está em{" "}
        <a href="/autorizacao-condominio">
          autorização de obra em condomínio
        </a>
        .
      </>
    ),
  },
  {
    q: "O preço pode mudar durante a obra?",
    a: "Só se você mudar o escopo, e você aprova antes. Sem mudança de escopo, a diferença é por nossa conta.",
  },
  {
    q: "Moro em outra cidade, consigo reformar?",
    a: "Sim. Vistoria por procuração, energia, internet e emergências ficam com a Bewild, e você acompanha tudo pelo Bwild Workflow.",
  },
];

export default function ReformaCoberturaSpPage() {
  const { settings } = useSiteSettings();
  useCtaClickTracking("reforma-cobertura-sp");

  useSeo({
    title: "Reforma de cobertura em São Paulo | Projeto, obra e mobília — Bewild",
    description:
      "Reforma completa de cobertura em São Paulo com arquitetura e engenharia próprias: projeto arquitetônico 3D, obra, terraço, marcenaria sob medida e mobília em um único contrato, com preço fechado, prazo em contrato e 5 anos de garantia.",
    canonicalPath: CANONICAL,
    ogType: "website",
    jsonLd: settings
      ? [
          breadcrumbJsonLd(settings, [
            { name: "Início", path: "/" },
            { name: "Reforma de cobertura em São Paulo", path: CANONICAL },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Reforma completa de coberturas em São Paulo",
            alternateName: "Reforma de cobertura em SP",
            serviceType: "Reforma de apartamento",
            description:
              "Projeto 3D, obra, área externa e terraço, marcenaria sob medida, mobília e entrega das chaves em um único contrato, com preço fechado e prazo em contrato.",
            provider: { "@id": "https://bewild.com.br/#org" },
            areaServed: { "@type": "City", name: "São Paulo" },
            url: `https://bewild.com.br${CANONICAL}`,
          },
          faqJsonLd(FAQ.map((f) => ({ q: f.q, a: f.a }))),
        ]
      : undefined,
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
                contrato e 5 anos de garantia. Mais de 160 reformas entregues
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
              Cada etapa está detalhada em{" "}
              <a href="/como-funciona">como funciona a reforma da Bewild</a>.
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
                +160 reformas entregues · +200 projetos
              </p>
            </div>
          </div>
        </section>
      </main>

      <BwaFooter />
    </div>
  );
}
