import { PROVA_CURTA } from "@/content/provas";
import { useState } from "react";
import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { whatsappHref } from "@/components/landing/content";
import { useSeo } from "@/lib/useSeo";
import "./faq-page.css";
import { ITENS } from "@/content/pages/autorizacao-condominio";

/* ============================================================
 * AutorizacaoCondominioPage — /autorizacao-condominio
 * Conteúdo mirando a busca "autorização de reforma condomínio".
 * Mesma linguagem visual da home (.bwa), acordeão como na /faq.
 * ============================================================ */

export default function AutorizacaoCondominioPage() {
  const [aberto, setAberto] = useState(0);

  useSeo({
    title: "Autorização de reforma em condomínio: guia completo | Bewild",
    description:
      "Autorização de reforma em condomínio: documentos que o síndico pede (ART, seguro, cronograma), prazo de aprovação, horários de obra e quem cuida da burocracia.",
    keywords:
      "autorização de reforma condomínio, ART de engenharia para reforma, responsável técnico de obra, autorização de reforma em condomínio, autorização de obra em condomínio, documentos para reforma em condomínio, ART de reforma, regras de reforma em apartamento, síndico autorização reforma, Bewild",
    canonicalPath: "/autorizacao-condominio",
    ogType: "website",
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
            {/* Dados estruturados só no JSON-LD (useSeo): um FAQPage por página. */}
            <div className="bwa-faq-list">
              {ITENS.map((item, i) => {
                const open = aberto === i;
                return (
                  <article key={item.q} className={`bwa-faq-item${open ? " bwa-open" : ""}`}>
                    <h2 className="bwa-faqpage-q">
                      <button
                        className="bwa-faq-question"
                        type="button"
                        aria-expanded={open}
                        aria-controls={`autorizacao-resposta-${i}`}
                        onClick={() => setAberto(open ? -1 : i)}
                      >
                        <span className="bwa-faq-num">{String(i + 1).padStart(2, "0")}</span>
                        <strong>{item.q}</strong>
                        <span className="bwa-faq-icon" aria-hidden="true" />
                      </button>
                    </h2>
                    <div id={`autorizacao-resposta-${i}`} className="bwa-faq-answer">
                      <p>{item.a}</p>
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
              <a className="bwa-button bwa-button-light" href="/orcamento" data-cta="autorizacao-cta">
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
              <p className="bwa-faqpage-cta-note">{PROVA_CURTA}</p>
            </div>
          </div>
        </section>
      </main>

      <BwaFooter />
    </div>
  );
}
