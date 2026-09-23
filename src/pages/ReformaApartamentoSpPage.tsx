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
 * ReformaApartamentoSpPage — /reforma-de-apartamento-sao-paulo
 * Página de serviço para busca e AI Overview ("empresa de reforma
 * de apartamento em São Paulo"). Mesmo padrão de OndeAtuamosPage:
 * BwaNav, BwaFooter, useSeo, breadcrumb + Service + FAQPage.
 * ============================================================ */

const CANONICAL = "/reforma-de-apartamento-sao-paulo";
// Link interno SEM utm_*: UTM em link interno sobrescreve a campanha paga real
// (e o gclid/fbclid) com que o visitante chegou. A navegação da SPA já carrega
// os parâmetros de campanha da URL atual (carryCampaignParams), e o clique no
// CTA é medido por useCtaClickTracking (data-cta).
const CTA_HREF = "/diagnostico";

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

const FAQ: { q: string; a: string; node?: ReactNode }[] = [
  {
    q: "Vocês reformam apartamentos de qualquer tamanho?",
    a: "Sim: studios e apartamentos de qualquer metragem em São Paulo capital, e também escritórios. O escopo e a proposta são definidos após a leitura do imóvel.",
  },
  {
    q: "Quanto tempo demora?",
    a: "A referência é cerca de 60 dias úteis de obra. A data exata sai no contrato.",
    node: (
      <>
        A referência é cerca de 60 dias úteis de obra. A data exata sai no
        contrato — veja o detalhamento em{" "}
        <a href="/conteudos/quanto-tempo-demora-reforma-apartamento">
          quanto tempo demora uma reforma de apartamento
        </a>
        .
      </>
    ),
  },
  {
    q: "O preço pode mudar durante a obra?",
    a: "Só se você mudar o escopo, e você aprova antes. Sem mudança de escopo, a diferença é por nossa conta.",
    node: (
      <>
        Só se você mudar o escopo, e você aprova antes. Sem mudança de escopo, a
        diferença é por nossa conta. Para comparar propostas, veja{" "}
        <a href="/conteudos/como-comparar-orcamentos-de-reforma">
          como comparar orçamentos de reforma
        </a>
        .
      </>
    ),
  },
  {
    q: "Moro em outra cidade, consigo reformar?",
    a: "Sim. Vistoria por procuração, energia, internet e emergências ficam com a Bewild, e você acompanha tudo pelo Bwild Workflow.",
  },
  {
    q: "Vocês fazem só reforma completa?",
    a: "O modelo é reforma completa: projeto, obra, marcenaria e mobília em um contrato.",
  },
  {
    q: "Que garantia eu tenho?",
    a: "5 anos de garantia sobre a mão de obra, em termo contratual, mais manutenção preventiva e chamados de emergência conforme o contrato.",
  },
];

export default function ReformaApartamentoSpPage() {
  const { settings } = useSiteSettings();
  useCtaClickTracking("reforma-apartamento-sp");

  useSeo({
    title:
      "Reforma de apartamento em São Paulo | Projeto, obra e mobília — Bewild",
    description:
      "Reforma de apartamento em São Paulo com arquitetura e engenharia próprias, preço fechado e prazo em contrato: projeto arquitetônico 3D, obra, marcenaria e mobília em um único contrato. Studios e apartamentos de qualquer metragem, com 5 anos de garantia.",
    canonicalPath: CANONICAL,
    ogType: "website",
    jsonLd: settings
      ? [
          breadcrumbJsonLd(settings, [
            { name: "Início", path: "/" },
            { name: "Reforma de apartamento em São Paulo", path: CANONICAL },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Reforma de apartamento em São Paulo",
            alternateName: "Empresa de reforma de apartamento em São Paulo",
            serviceType: "Reforma de apartamento",
            description:
              "Reforma completa de apartamentos e studios em São Paulo: projeto aprovado em 3D, obra, marcenaria e mobília em um único contrato, com preço fechado, prazo em contrato e 5 anos de garantia sobre a mão de obra.",
            provider: { "@id": "https://bewild.com.br/#org" },
            areaServed: {
              "@type": "City",
              name: "São Paulo",
              containedInPlace: { "@type": "State", name: "São Paulo" },
            },
            url: `https://bewild.com.br${CANONICAL}`,
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: "Escopo da reforma",
              itemListElement: [
                "Projeto aprovado em 3D antes da obra",
                "Obra com preço fechado e prazo em contrato",
                "Marcenaria, mobília e eletrodomésticos",
                "Vistoria e entrega das chaves",
              ].map((item) => ({
                "@type": "Offer",
                itemOffered: { "@type": "Service", name: item },
              })),
            },
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
            <p className="bwa-label">Reforma de apartamento em São Paulo</p>
            <div>
              <h1 className="bwa-title">
                Empresa de reforma de apartamento em São Paulo.{" "}
                <em>Você não vira gerente de obra.</em>
              </h1>
              <p className="bwa-servico-lead">
                A Bewild é uma empresa de reforma completa de apartamentos e
                studios em São Paulo. Entregamos projeto, obra, marcenaria e
                mobília em um único contrato, com preço fechado antes de a obra
                começar, prazo em contrato e 5 anos de garantia sobre a mão de
                obra. Mais de 160 reformas entregues em mais de 27 bairros da
                capital, para donos que moram em São Paulo ou em qualquer outra
                cidade.
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
                  aprova em 3D e recebe o apartamento com tudo instalado.
                </p>
              </li>
              <li>
                <h3>Para alugar ou vender</h3>
                <p>
                  Projeto pensado para a foto do anúncio, ocupação e manutenção
                  simples, com entrega pronta para anunciar. Se o destino é
                  locação por temporada, veja também a{" "}
                  <a href="/reforma-de-studio-sao-paulo">
                    reforma de studio em São Paulo
                  </a>
                  .
                </p>
              </li>
            </ul>
            <p className="bwa-servico-text" style={{ marginTop: 24 }}>
              Atendemos studios e apartamentos de qualquer metragem em São Paulo
              capital. Também reformamos escritórios e salas comerciais. Veja
              obras entregues no{" "}
              <a href="/portfolio">portfólio</a> e o passo a passo do processo em{" "}
              <a href="/conteudos/reforma-de-apartamento-em-sao-paulo-guia">
                reforma de apartamento em São Paulo: o guia completo
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
              Seu apartamento é em São Paulo? <em>O resto é com a gente.</em>
            </h2>
            <div className="bwa-servico-cta-actions">
              <a
                className="bwa-button bwa-button-light"
                href={CTA_HREF}
                data-cta="servico-reforma-apartamento-sp"
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
