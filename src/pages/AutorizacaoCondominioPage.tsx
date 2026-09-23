import { useState } from "react";
import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { whatsappHref } from "@/components/landing/content";
import { breadcrumbJsonLd, faqJsonLd, useSeo } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";
import "./faq-page.css";

/* ============================================================
 * AutorizacaoCondominioPage — /autorizacao-condominio
 * Conteúdo mirando a busca "autorização de reforma condomínio".
 * Mesma linguagem visual da home (.bwa), acordeão como na /faq.
 * ============================================================ */

const ITENS: { q: string; a: string }[] = [
  {
    q: "Preciso de autorização do condomínio para reformar meu apartamento?",
    a: "Sim. Em praticamente todos os condomínios de São Paulo, obra interna depende de comunicado prévio ao síndico ou à administradora — mesmo quando não há alteração de estrutura. A regra vem da convenção do prédio e do regimento interno, e reformar sem avisar pode gerar multa, embargo da obra e até ação do condomínio.",
  },
  {
    q: "O que o condomínio costuma exigir para liberar a reforma?",
    a: "Os pedidos mais comuns são: comunicado prévio com datas de início e fim, ART ou RRT do responsável técnico, comprovante de seguro de responsabilidade civil, definição de horários de obra, uso do elevador de serviço com proteção e forma de retirada de entulho. Alguns prédios pedem também descrição do escopo, com o que será demolido e o que permanece.",
  },
  {
    q: "Como pedir a autorização de reforma ao condomínio?",
    a: "O caminho é o protocolo na administradora: ofício ou formulário próprio do condomínio, com anexos técnicos (ART/RRT, seguro, cronograma) e, em alguns prédios, ciência dos vizinhos ao imóvel. Aprovado o pedido, a obra passa a valer dentro das condições combinadas — horários, rota de entulho e cuidados com áreas comuns.",
  },
  {
    q: "Quanto tempo demora a aprovação do condomínio?",
    a: "Depende do regimento. Condomínios administrados costumam responder entre 3 e 15 dias úteis; alguns prédios só deliberam em assembleia ou exigem assinatura de mais de um responsável, o que alonga o prazo. Por isso a autorização entra no cronograma antes de a obra começar, nunca em paralelo a ela.",
  },
  {
    q: "Posso começar a obra antes da autorização do condomínio?",
    a: "Não vale a pena. Sem a autorização, o síndico pode embargar a obra no primeiro dia, aplicar multa prevista em convenção e reter materiais ou caçamba. E o prejuízo não é só financeiro: retrabalho, equipe parada e prazo perdido. O certo é protocolar, aprovar e só depois quebrar a primeira parede.",
  },
  {
    q: "Quais são os horários permitidos para obra em São Paulo?",
    a: "A maioria dos condomínios de São Paulo libera obra ruidosa em dias úteis, em geral das 8h às 18h, com variações definidas em convenção ou assembleia — alguns limitam ferramentas de alto impacto a períodos mais curtos e proíbem trabalho em fins de semana e feriados. O horário exato do seu prédio é confirmado na autorização.",
  },
  {
    q: "Quem cuida da burocracia com o condomínio na reforma?",
    a: "Na Bewild, essa parte é conduzida pela nossa equipe, não por você: preparamos o protocolo com ART do responsável técnico, seguro, cronograma e escopo descrito, acompanhamos a aprovação e cumprimos as condições acordadas durante toda a obra. Você assina o que for preciso e acompanha o resto pelo Bwild Workflow.",
  },
];

export default function AutorizacaoCondominioPage() {
  const { settings } = useSiteSettings();
  const [aberto, setAberto] = useState(0);

  useSeo({
    title: "Autorização de reforma em condomínio: guia completo | Bewild",
    description:
      "Autorização de reforma condomínio sem dor de cabeça: documentos exigidos pelo síndico (ART, seguro, cronograma), prazo de aprovação, horários de obra e quem resolve a burocracia em SP.",
    keywords:
      "autorização de reforma condomínio, ART de engenharia para reforma, responsável técnico de obra, autorização de reforma em condomínio, autorização de obra em condomínio, documentos para reforma em condomínio, ART de reforma, regras de reforma em apartamento, síndico autorização reforma, Bewild",
    canonicalPath: "/autorizacao-condominio",
    ogType: "website",
    jsonLd: settings
      ? [
          breadcrumbJsonLd(settings, [
            { name: "Início", path: "/" },
            { name: "Autorização de reforma no condomínio", path: "/autorizacao-condominio" },
          ]),
          faqJsonLd(ITENS.map((i) => ({ q: i.q, a: i.a }))),
        ]
      : undefined,
  });

  return (
    <div className="bwa-faqpage">
      <BwaNav />

      <main id="main" tabIndex={-1}>
        <section className="bwa-faqpage-intro">
          <div className="bwa-shell bwa-faq-head bwa-faqpage-head">
            <p className="bwa-label">Autorização de reforma no condomínio</p>
            <div>
              <h1 className="bwa-title">
                A papelada do prédio, <em>resolvida antes da obra.</em>
              </h1>
              <p className="bwa-faqpage-lead">
                O que o condomínio de São Paulo pede para liberar uma reforma de
                apartamento: comunicado prévio, ART, seguro, horários e entulho —
                e quem cuida de cada etapa quando a obra é com a Bewild.
              </p>
            </div>
          </div>

          <div className="bwa-shell">
            <div className="bwa-faq-list" itemScope itemType="https://schema.org/FAQPage">
              {ITENS.map((item, i) => {
                const open = aberto === i;
                return (
                  <article
                    key={item.q}
                    className={`bwa-faq-item${open ? " bwa-open" : ""}`}
                    itemScope
                    itemProp="mainEntity"
                    itemType="https://schema.org/Question"
                  >
                    <h2 className="bwa-faqpage-q">
                      <button
                        className="bwa-faq-question"
                        type="button"
                        aria-expanded={open}
                        aria-controls={`autorizacao-resposta-${i}`}
                        onClick={() => setAberto(open ? -1 : i)}
                      >
                        <span className="bwa-faq-num">{String(i + 1).padStart(2, "0")}</span>
                        <strong itemProp="name">{item.q}</strong>
                        <span className="bwa-faq-icon" aria-hidden="true" />
                      </button>
                    </h2>
                    <div
                      id={`autorizacao-resposta-${i}`}
                      className="bwa-faq-answer"
                      itemScope
                      itemProp="acceptedAnswer"
                      itemType="https://schema.org/Answer"
                    >
                      <p itemProp="text">{item.a}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bwa-faqpage-cta" aria-label="Solicitar orçamento">
          <div className="bwa-shell bwa-faqpage-cta-grid">
            <h2>
              Protocolamos, aprovamos e executamos. <em>Você acompanha.</em>
            </h2>
            <div className="bwa-faqpage-cta-actions">
              <a className="bwa-button bwa-button-light" href="/diagnostico" data-cta="autorizacao-cta">
                Solicitar orçamento <span aria-hidden="true">→</span>
              </a>
              <a
                className="bwa-faqpage-whats"
                href={whatsappHref()}
                target="_blank"
                rel="noopener noreferrer"
              >
                Falar no WhatsApp <span aria-hidden="true">→</span>
              </a>
              <p className="bwa-faqpage-cta-note">+160 reformas entregues · +200 projetos</p>
            </div>
          </div>
        </section>
      </main>

      <BwaFooter />
    </div>
  );
}
