import type { ReactNode } from "react";
import BwaFooter from "@/components/BwaFooter";
import BwaImprensa from "@/components/BwaImprensa";
import BwaNav from "@/components/BwaNav";
import { whatsappHref } from "@/components/landing/content";
import { BAIRROS, REMOTO_ITEMS } from "@/lib/bairrosSp";
import { breadcrumbJsonLd, faqJsonLd, useSeo } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";
import "./servico-reforma.css";

/* ============================================================
 * ReformaStudioSpPage — /reforma-de-studio-sao-paulo
 * Página de serviço para busca e AI Overview ("reforma de studio
 * em São Paulo"). Mesma estrutura de ReformaApartamentoSpPage.
 * ============================================================ */

const CANONICAL = "/reforma-de-studio-sao-paulo";
const CTA_HREF =
  "/diagnostico?utm_source=site&utm_medium=servico&utm_campaign=reforma-studio-sp";

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
    q: "Vale a pena reformar um studio para Airbnb?",
    a: "Depende de bairro, convenção do condomínio e operação. A Bewild não garante renda nem ocupação.",
    node: (
      <>
        Depende de bairro, convenção do condomínio e operação. A Bewild não
        garante renda nem ocupação — as contas linha a linha estão em{" "}
        <a href="/conteudos/quanto-rende-studio-short-stay-sao-paulo">
          quanto rende um studio no short stay em São Paulo
        </a>
        .
      </>
    ),
  },
  {
    q: "O condomínio pode proibir Airbnb?",
    a: "Pode: a convenção e as decisões em assembleia mandam, e é preciso checar antes de comprar.",
    node: (
      <>
        Pode: a convenção e as decisões em assembleia mandam, e é preciso checar
        antes de comprar. O que a lei permite hoje está em{" "}
        <a href="/conteudos/studios-airbnb-sao-paulo-o-que-a-lei-permite">
          studios e Airbnb em São Paulo: o que a lei permite
        </a>
        .
      </>
    ),
  },
  {
    q: "Quanto tempo demora a reforma de um studio?",
    a: "A referência é cerca de 60 dias úteis de obra. A data exata sai no contrato.",
    node: (
      <>
        A referência é cerca de 60 dias úteis de obra, e a data exata sai no
        contrato. Semana a semana em{" "}
        <a href="/conteudos/cronograma-reforma-studio-60-dias-uteis">
          cronograma de uma reforma de studio
        </a>
        .
      </>
    ),
  },
  {
    q: "Comprei na planta e ainda não tenho as chaves, já posso começar?",
    a: "Sim. Projeto e proposta são feitos antes das chaves, para a obra começar assim que o imóvel for entregue.",
    node: (
      <>
        Sim. Projeto e proposta são feitos antes das chaves, para a obra começar
        assim que o imóvel for entregue — o que adiantar está em{" "}
        <a href="/conteudos/comprou-studio-na-planta-antes-das-chaves">
          comprou studio na planta: o que fazer antes das chaves
        </a>
        .
      </>
    ),
  },
  {
    q: "Vocês fazem a gestão do Airbnb?",
    a: "Não. Entregamos o studio pronto para anunciar; a operação é sua ou de quem você escolher, sem exclusividade.",
  },
  {
    q: "Moro fora de São Paulo?",
    a: "Sim, dá para reformar. Vistoria por procuração, energia, internet e emergências ficam com a Bewild, e você acompanha tudo pelo Bwild Workflow.",
  },
];

export default function ReformaStudioSpPage() {
  const { settings } = useSiteSettings();

  useSeo({
    title: "Reforma de studio em São Paulo para morar ou alugar | Bewild",
    description:
      "Reforma completa de studio em São Paulo, pronta para morar ou para short stay: projeto, obra, marcenaria e mobília em um contrato, com preço fechado, prazo em contrato e 5 anos de garantia.",
    canonicalPath: CANONICAL,
    ogType: "website",
    jsonLd: settings
      ? [
          breadcrumbJsonLd(settings, [
            { name: "Início", path: "/" },
            { name: "Reforma de studio em São Paulo", path: CANONICAL },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Reforma completa de studios em São Paulo",
            serviceType: "Reforma de apartamento",
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
            <p className="bwa-label">Reforma de studio em São Paulo</p>
            <div>
              <h1 className="bwa-title">
                Reforma de studio em São Paulo,{" "}
                <em>entregue pronto para morar ou anunciar.</em>
              </h1>
              <p className="bwa-servico-lead">
                A Bewild é especialista em reforma completa de studios e
                apartamentos em São Paulo, para morar ou para locação
                (short stay e longa duração). Projeto, obra, marcenaria sob
                medida e mobília em um único contrato, com preço fechado, prazo
                em contrato e 5 anos de garantia. Mais de 160 reformas
                entregues, a maioria em studios de 20 a 35 m².
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
                  aprova em 3D e recebe o studio com tudo instalado.
                </p>
              </li>
              <li>
                <h3>Para alugar ou vender</h3>
                <p>
                  Projeto pensado para a foto do anúncio, ocupação e manutenção
                  simples, com entrega pronta para anunciar. O contexto de
                  mercado está no{" "}
                  <a href="/guia-do-investidor">guia do investidor</a>.
                </p>
              </li>
            </ul>
            <p className="bwa-servico-text" style={{ marginTop: 24 }}>
              Atendemos studios e apartamentos de qualquer metragem em São Paulo
              capital — veja obras entregues no{" "}
              <a href="/portfolio">portfólio</a>, o detalhamento de custo em{" "}
              <a href="/conteudos/quanto-custa-reformar-studio-short-stay-sao-paulo">
                quanto custa reformar um studio em São Paulo
              </a>{" "}
              e, para metragens maiores, a{" "}
              <a href="/reforma-de-apartamento-sao-paulo">
                reforma de apartamento em São Paulo
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
