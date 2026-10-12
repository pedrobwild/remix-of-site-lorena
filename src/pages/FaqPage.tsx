import { BAIRROS_ATENDIDOS, PROVA_CURTA, PROVA_FRASE } from "@/content/provas";
import { useEffect, useMemo, useState } from "react";
import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { whatsappHref } from "@/components/landing/content";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";
import { useSeo } from "@/lib/useSeo";
import { safeKbActions, type KbItem } from "@/lib/assistant/assistantEngine";
import { isExternalHref } from "@/lib/safeUrl";
import "./faq-page.css";
import { FAQ_ITEMS, FAQ_ITEMS_SEM_BANCO, FALLBACK_ITEMS, GUIA_ITEMS, INDICACAO_ITEMS, PORTFOLIO_ITEMS, type FaqItem } from "@/content/faqPage";

/* ============================================================
 * FaqPage — /faq
 *
 * Cada assunto aparece uma vez só na página (consolidação de 29/09/2026):
 * - Lista principal: tabela `assistant_kb` (/admin/faq → aba "Página /faq"),
 *   agrupada por tema. Ali ficam os temas centrais: serviço, região, preço,
 *   pagamento, prazo, atraso, contrato fechado, garantia, projeto, escopo,
 *   chaves, condomínio, acompanhamento e locação.
 * - Seções fixas (Portfólio, Como fazer uma reforma, Indicações): só o que é
 *   exclusivo delas. Não repita nelas assunto que já está no banco.
 * - FAQ_ITEMS + FAQ_ITEMS_SEM_BANCO: lista principal enquanto o banco não
 *   carregou (HTML do servidor, leitores sem JavaScript) ou se ele falhar.
 *   Espelham as respostas do banco: mudou lá, mude aqui.
 * - FAQ_ITEMS também é o bloco "FAQ · 09" da home (home-bwa-body.ts). Copy
 *   travada pelo CEO: qualquer mudança de texto acontece aqui E na home.
 * ============================================================ */


export default function FaqPage({ initialKb = null }: { initialKb?: KbItem[] | null } = {}) {
  const [aberto, setAberto] = useState("f-0");
  const [guiaAberto, setGuiaAberto] = useState(-1);
  const [indicacaoAberto, setIndicacaoAberto] = useState(-1);
  const [portfolioAberto, setPortfolioAberto] = useState(-1);

  // Dúvidas do assistente (tabela assistant_kb): quando existem, substituem a
  // lista fixa abaixo, agrupadas por tema. Se o banco estiver vazio ou a
  // leitura falhar, a lista fixa continua no ar.
  // `initialKb` vem do loader da rota (SSR): o HTML que o Google lê já traz as
  // perguntas do banco. Sem ele, a leitura acontece no cliente como antes.
  const [kb, setKb] = useState<KbItem[] | null>(initialKb && initialKb.length > 0 ? initialKb : null);
  useEffect(() => {
    if (initialKb && initialKb.length > 0) return;
    let alive = true;
    supabase
      .from("assistant_kb")
      .select("id, tema, pergunta, resposta, acoes, ordem")
      .eq("ativo", true)
      .order("ordem", { ascending: true })
      .then(
        ({ data, error }) => {
          if (!alive) return;
          if (!error && data && data.length > 0) setKb(data as unknown as KbItem[]);
        },
        () => undefined,
      );
    return () => {
      alive = false;
    };
  }, [initialKb]);

  /** Registra o clique na pergunta (só na abertura) para o painel de rastreamento. */
  function abrirPergunta(key: string, aberta: boolean, pergunta: string) {
    if (!aberta) track("faq_question_click", { value: { pergunta } });
    setAberto(aberta ? "" : key);
  }

  const kbGrupos = useMemo(() => {
    if (!kb) return null;
    const mapa = new Map<string, KbItem[]>();
    for (const item of kb) {
      const grupo = mapa.get(item.tema) ?? [];
      grupo.push(item);
      mapa.set(item.tema, grupo);
    }
    return [...mapa.entries()];
  }, [kb]);

  useSeo({
    title: "Perguntas frequentes sobre reforma em SP | Bewild",
    description:
      "Perguntas e respostas sobre reforma de apartamento em SP: quanto custa, prazo, contrato fechado, garantia, autorização do condomínio e etapas da obra.",
    keywords:
      "dúvidas sobre arquitetura e engenharia, projeto de arquitetura em São Paulo, dúvidas sobre reforma de apartamento em SP, reforma de apartamento em SP, custo de reforma, prazo de reforma, contrato fechado de reforma, garantia de reforma, comissão de indicação de imóvel, autorização de reforma condomínio, Bewild",
    canonicalPath: "/faq",
    ogType: "website",
    // FAQPage sai só no HTML do servidor (faqPageJsonLd no head() de /faq).
  });

  return (
    <div className="bwa-faqpage">
      <BwaNav />

      <main id="main" tabIndex={-1}>
        <section className="bwa-faqpage-intro">
          <div className="bwa-shell bwa-faq-head bwa-faqpage-head">
            <p className="bwa-label">FAQ</p>
            <div>
              <h1 className="bwa-title">Perguntas antes de entregar a chave.</h1>
              <p className="bwa-faqpage-lead">
                As dúvidas mais comuns de quem vai reformar um apartamento com a
                Bewild: prazo, garantia, contrato e o que está incluso, da obra
                à entrega das chaves.
              </p>
            </div>
          </div>

          <div className="bwa-shell">
            {kbGrupos ? (
              kbGrupos.map(([tema, itens]) => (
                <div key={tema}>
                  <p className="bwa-label bwa-faqpage-tema">{tema}</p>
                  <div className="bwa-faq-list">
                    {itens.map((item, i) => {
                      const key = `k-${item.id}`;
                      const open = aberto === key;
                      return (
                        <article key={item.id} className={`bwa-faq-item${open ? " bwa-open" : ""}`}>
                          <h2 className="bwa-faqpage-q">
                            <button
                              className="bwa-faq-question"
                              type="button"
                              aria-expanded={open}
                              aria-controls={`faq-resposta-${item.id}`}
                              onClick={() => abrirPergunta(key, open, item.pergunta)}
                            >
                              <span className="bwa-faq-num">{String(i + 1).padStart(2, "0")}</span>
                              <strong>{item.pergunta}</strong>
                              <span className="bwa-faq-icon" aria-hidden="true" />
                            </button>
                          </h2>
                          <div id={`faq-resposta-${item.id}`} className="bwa-faq-answer">
                            <p>{item.resposta}</p>
                            {/* URL do banco só vira href depois de safeHref. */}
                            {safeKbActions(item.acoes).map((acao, j) => {
                              const href = acao.tipo === "whatsapp" ? whatsappHref() : acao.url;
                              if (!href) return null;
                              const external = isExternalHref(href);
                              return (
                                <a
                                  key={`${acao.tipo}-${j}`}
                                  className="bwa-faqpage-guia-link"
                                  href={href}
                                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                                >
                                  {acao.rotulo || "Falar no WhatsApp"} →
                                </a>
                              );
                            })}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="bwa-faq-list">
                {FALLBACK_ITEMS.map((item, i) => {
                  const key = `f-${i}`;
                  const open = aberto === key;
                  return (
                    <article key={item.q} className={`bwa-faq-item${open ? " bwa-open" : ""}`}>
                      <h2 className="bwa-faqpage-q">
                        <button
                          className="bwa-faq-question"
                          type="button"
                          aria-expanded={open}
                          aria-controls={`faq-resposta-${i}`}
                          onClick={() => abrirPergunta(key, open, item.q)}
                        >
                          <span className="bwa-faq-num">{String(i + 1).padStart(2, "0")}</span>
                          <strong>{item.q}</strong>
                          <span className="bwa-faq-icon" aria-hidden="true" />
                        </button>
                      </h2>
                      <div id={`faq-resposta-${i}`} className="bwa-faq-answer">
                        <p>{item.a}</p>
                        {item.href && (
                          <a className="bwa-faqpage-guia-link" href={item.href}>
                            {item.linkLabel}
                          </a>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="bwa-faqpage-intro bwa-faqpage-portfolio" aria-labelledby="faq-portfolio-title">
          <div className="bwa-shell bwa-faq-head bwa-faqpage-head">
            <p className="bwa-label">Portfólio</p>
            <div>
              <h2 className="bwa-title" id="faq-portfolio-title">
                Obras reais, <em>para ver antes de decidir.</em>
              </h2>
              <p className="bwa-faqpage-lead">
                Exemplos de obras entregues, com fotos, metragem e o passo a
                passo de cada decisão, da medição à entrega.
              </p>
            </div>
          </div>

          <div className="bwa-shell">
            <div className="bwa-faq-list">
              {PORTFOLIO_ITEMS.map((item, i) => {
                const open = portfolioAberto === i;
                return (
                  <article key={item.q} className={`bwa-faq-item${open ? " bwa-open" : ""}`}>
                    <h3 className="bwa-faqpage-q">
                      <button
                        className="bwa-faq-question"
                        type="button"
                        aria-expanded={open}
                        aria-controls={`faq-portfolio-resposta-${i}`}
                        onClick={() => {
                          if (!open) track("faq_question_click", { value: { pergunta: item.q } });
                          setPortfolioAberto(open ? -1 : i);
                        }}
                      >
                        <span className="bwa-faq-num">{String(i + 1).padStart(2, "0")}</span>
                        <strong>{item.q}</strong>
                        <span className="bwa-faq-icon" aria-hidden="true" />
                      </button>
                    </h3>
                    <div id={`faq-portfolio-resposta-${i}`} className="bwa-faq-answer">
                      <p>{item.a}</p>
                      {item.href && (
                        <a className="bwa-faqpage-guia-link" href={item.href}>
                          {item.linkLabel}
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bwa-faqpage-intro bwa-faqpage-guia" aria-labelledby="faq-guia-title">
          <div className="bwa-shell bwa-faq-head bwa-faqpage-head">
            <p className="bwa-label">Como fazer uma reforma</p>
            <div>
              <h2 className="bwa-title" id="faq-guia-title">
                Reforma de apartamento, <em>do começo ao fim.</em>
              </h2>
              <p className="bwa-faqpage-lead">
                O passo a passo de quem vai reformar um apartamento em São
                Paulo: por onde começar, em que ordem as coisas acontecem e os
                erros que mais atrasam a obra.
              </p>
            </div>
          </div>

          <div className="bwa-shell">
            <div className="bwa-faq-list">
              {GUIA_ITEMS.map((item, i) => {
                const open = guiaAberto === i;
                return (
                  <article key={item.q} className={`bwa-faq-item${open ? " bwa-open" : ""}`}>
                    <h3 className="bwa-faqpage-q">
                      <button
                        className="bwa-faq-question"
                        type="button"
                        aria-expanded={open}
                        aria-controls={`faq-guia-resposta-${i}`}
                        onClick={() => {
                          if (!open) track("faq_question_click", { value: { pergunta: item.q } });
                          setGuiaAberto(open ? -1 : i);
                        }}
                      >
                        <span className="bwa-faq-num">{String(i + 1).padStart(2, "0")}</span>
                        <strong>{item.q}</strong>
                        <span className="bwa-faq-icon" aria-hidden="true" />
                      </button>
                    </h3>
                    <div id={`faq-guia-resposta-${i}`} className="bwa-faq-answer">
                      <p>{item.a}</p>
                      {item.href && (
                        <a className="bwa-faqpage-guia-link" href={item.href}>
                          {item.linkLabel}
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bwa-faqpage-intro bwa-faqpage-contrato" aria-labelledby="faq-indicacoes-title">
          <div className="bwa-shell bwa-faq-head bwa-faqpage-head">
            <p className="bwa-label">Indicações e comissões</p>
            <div>
              <h2 className="bwa-title" id="faq-indicacoes-title">
                Indicações, <em>sem letra miúda.</em>
              </h2>
              <p className="bwa-faqpage-lead">
                As regras do programa de indicações — para parceiros do mercado
                e para quem só quer indicar um amigo.
              </p>
            </div>
          </div>

          <div className="bwa-shell">
            <div className="bwa-faq-list">
              {INDICACAO_ITEMS.map((item, i) => {
                const open = indicacaoAberto === i;
                return (
                  <article key={item.q} className={`bwa-faq-item${open ? " bwa-open" : ""}`}>
                    <h3 className="bwa-faqpage-q">
                      <button
                        className="bwa-faq-question"
                        type="button"
                        aria-expanded={open}
                        aria-controls={`faq-indicacao-resposta-${i}`}
                        onClick={() => {
                          if (!open) track("faq_question_click", { value: { pergunta: item.q } });
                          setIndicacaoAberto(open ? -1 : i);
                        }}
                      >
                        <span className="bwa-faq-num">{String(i + 1).padStart(2, "0")}</span>
                        <strong>{item.q}</strong>
                        <span className="bwa-faq-icon" aria-hidden="true" />
                      </button>
                    </h3>
                    <div id={`faq-indicacao-resposta-${i}`} className="bwa-faq-answer">
                      <p>{item.a}</p>
                      {item.href && (
                        <a className="bwa-faqpage-guia-link" href={item.href}>
                          {item.linkLabel}
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bwa-faqpage-ask" aria-labelledby="faq-ask-title">
          <div className="bwa-shell">
            <p className="bwa-label">Pergunte à Bewild</p>
            <h2 className="bwa-faqpage-ask-title" id="faq-ask-title">
              Sua dúvida não está na lista? <em>Fale com a gente.</em>
            </h2>
            <p className="bwa-faqpage-lead">
              Fale com o time da Bewild pelo WhatsApp ou peça um orçamento. Preço e prazo do seu
              imóvel saem fechados na proposta.
            </p>

            <div className="bwa-faqpage-ask-actions">
              <a className="bwa-button" href="/orcamento" data-cta="faq-diagnostico">
                Solicitar orçamento <span aria-hidden="true">→</span>
              </a>
              <a
                className="bwa-faqpage-ask-whats"
                href={whatsappHref()}
                target="_blank"
                rel="noopener noreferrer"
              >
                Falar no WhatsApp <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </section>

        <section className="bwa-faqpage-cta" aria-label="Solicitar orçamento">
          <div className="bwa-shell bwa-faqpage-cta-grid">
            <h2>
              Não encontrou sua resposta? <em>Vamos conversar.</em>
            </h2>
            <div className="bwa-faqpage-cta-actions">
              <a className="bwa-button bwa-button-light" href="/orcamento" data-cta="faq-cta">
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
