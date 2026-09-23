import { useEffect, useMemo, useRef, useState } from "react";
import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { whatsappHref } from "@/components/landing/content";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/ga4";
import { track } from "@/lib/analytics";
import { breadcrumbJsonLd, faqJsonLd, useSeo } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";
import type { KbItem } from "@/lib/assistant/assistantEngine";
import "./faq-page.css";

type RespostaIa = {
  resposta: string;
  pontos: string[];
  proximo_passo: string;
  fora_do_escopo: boolean;
};

/* ============================================================
 * FaqPage — /faq
 * Mesmas perguntas e respostas do bloco "FAQ · 09" da home,
 * com a mesma linguagem visual (.bwa). Copy travada pelo CEO:
 * qualquer mudança de texto precisa acontecer aqui E na home.
 * ============================================================ */

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "O que é uma reforma turnkey?",
    a: "Turnkey quer dizer chave na mão. Você assina um contrato, a gente executa tudo e devolve o imóvel pronto para usar. É o modelo da Bewild desde o primeiro projeto.",
  },
  {
    q: "O que vocês chamam de contrato fechado?",
    a: "Preço e prazo definidos e assinados antes de a obra começar. Se o valor ultrapassar o combinado, a diferença é por nossa conta.",
  },
  {
    q: "Vocês só reformam para Airbnb?",
    a: "Não. Reformamos para morar, para alugar em curta ou longa temporada e para vender. O projeto muda conforme o objetivo.",
  },
  {
    q: "Preciso ir à obra?",
    a: "Só se você quiser. Todo o acompanhamento acontece pelo Bwild Workflow. E moradores de fora de São Paulo contam com vistoria por procuração, ligação de energia e instalação de internet feitas pela gente.",
  },
  {
    q: "Quanto tempo leva uma reforma?",
    a: "A maioria fica pronta em torno de 60 dias úteis. A sua data exata sai definida no contrato, antes de a obra começar.",
  },
  {
    q: "Onde vocês atuam?",
    a: "Atendemos São Paulo capital, com obras entregues em mais de 27 bairros. Seu imóvel está fora dessa região? Manda mesmo assim: a gente avalia caso a caso.",
  },
];

/* Bloco de conteúdo (não é copy travada da home): responde a buscas do tipo
 * "como fazer uma reforma de apartamento", "por onde começar uma reforma",
 * "quanto custa reformar apartamento em São Paulo". */
const GUIA_ITEMS: { q: string; a: string; href?: string; linkLabel?: string }[] = [
  {
    q: "Como fazer uma reforma de apartamento, passo a passo?",
    a: "Na prática são seis etapas: definir o objetivo do imóvel (morar, alugar ou vender), levantar a metragem e o estado atual, aprovar o projeto em 3D, fechar preço e prazo em contrato, executar a obra com marcenaria e mobília, e receber o apartamento pronto para usar. Na Bewild essas seis etapas acontecem dentro de um único contrato, com um só responsável.",
  },
  {
    q: "Por onde começar uma reforma de apartamento?",
    a: "Comece pelo objetivo, não pelo acabamento. Um apartamento para short stay pede layout, marcenaria e mobília pensados para alta rotatividade; um para morar pede outra coisa. Definido o objetivo, o passo seguinte é o projeto — decidir tudo no papel e no 3D é o que evita mudança cara no meio da obra.",
  },
  {
    q: "Quanto custa reformar um apartamento em São Paulo?",
    a: "Depende da metragem, do estado do imóvel e do nível de acabamento. Nas obras que entregamos, apartamentos compactos de 21 a 35 m² ficam em torno de R$ 2.400 por metro quadrado, já incluindo projeto, obra, marcenaria e mobília. O valor do seu imóvel sai fechado no diagnóstico, antes de a obra começar.",
  },
  {
    q: "Quanto tempo demora uma reforma de apartamento?",
    a: "A maior parte das nossas obras fica pronta em cerca de 60 dias úteis, referência para apartamentos de até 30 m². A data exata entra no contrato antes do início — e se o prazo atrasar por nossa conta, o problema é nosso.",
  },
  {
    q: "Preciso de autorização do condomínio para reformar?",
    a: "Sim. A maioria dos condomínios pede comunicado prévio, ART ou RRT do responsável técnico e horários definidos para obra e para uso do elevador. Toda essa parte burocrática com o condomínio é conduzida pela nossa equipe, não por você.",
    href: "/autorizacao-condominio",
    linkLabel: "Guia completo: autorização de reforma no condomínio →",
  },
  {
    q: "Reforma com empresa única ou contratando profissionais separados?",
    a: "Contratar arquiteto, empreiteiro, marceneiro e mobiliário separadamente costuma sair mais barato no papel e mais caro na conta final: cada um culpa o outro pelo atraso e o custo escapa. Com um contrato único, preço e prazo são fechados e existe um só responsável pelo resultado.",
  },
  {
    q: "Quais erros mais atrasam uma reforma de apartamento?",
    a: "Mudar de ideia depois que a obra começou, deixar elétrica e hidráulica para decidir na hora, comprar acabamento sem medida definida e contratar por orçamento aberto. Projeto aprovado em 3D antes de quebrar a primeira parede resolve quase todos eles.",
  },
];

/* Bloco "Contratos e comissões": regras do contrato fechado e do programa de
 * indicações (parceiros e clientes). Copy segue as decisões travadas do dono:
 * sem percentual público de comissão — o valor é definido no termo individual. */
const CONTRATO_ITEMS: { q: string; a: string; href?: string; linkLabel?: string }[] = [
  {
    q: "Como funciona o contrato fechado da Bewild?",
    a: "Preço e prazo são definidos e assinados antes de a obra começar, com memorial descritivo item a item. Se o valor final ultrapassar o combinado, a diferença é por nossa conta — sem aditivo surpresa. O contrato cobre projeto, obra, marcenaria, mobiliário e entrega.",
  },
  {
    q: "O que acontece se a obra atrasar?",
    a: "A data de entrega entra no contrato antes do início da obra. Se o atraso for por nossa conta, a indenização prevista em contrato é aplicada — você não paga por um problema nosso. E tudo fica registrado no Bwild Workflow, visível para você do começo ao fim.",
  },
  {
    q: "Qual é a garantia da reforma?",
    a: "Cinco anos de garantia, cobrindo a execução da obra e o que está no contrato. Se algo der errado dentro desse período, a Bewild resolve.",
  },
  {
    q: "Como funciona a comissão para parceiros que indicam?",
    a: "Corretores, imobiliárias, incorporadoras, arquitetos e administradoras de locação recebem comissão por contrato indicado. O percentual não é público: é definido no termo individual, conforme o perfil e o volume de indicações, calculado sobre o valor líquido do contrato e com relatório mensal. O pagamento acontece após o recebimento da Bewild.",
    href: "/parceiros",
    linkLabel: "Ver o programa de indicações para parceiros →",
  },
  {
    q: "Como funciona a recompensa para quem indica um amigo?",
    a: "Qualquer pessoa pode indicar, sem precisar ser do mercado. O valor da recompensa é combinado com você e confirmado por escrito no momento do registro, e o pagamento é feito por Pix após o fechamento do contrato do indicado.",
    href: "/indique-um-amigo",
    linkLabel: "Indicar um amigo agora →",
  },
  {
    q: "Por quanto tempo vale uma indicação?",
    a: "A indicação vale por 12 meses contados do registro. Se a pessoa indicada fechar contrato dentro desse período, a recompensa ou a comissão é sua.",
  },
  {
    q: "Meu indicado já estava negociando com a Bewild. Conta?",
    a: "Não. A indicação só vale para quem ainda não está em negociação com a gente — evita conflito entre indicadores e mantém a regra clara para todo mundo.",
  },
];

export default function FaqPage() {
  const { settings } = useSiteSettings();
  const [aberto, setAberto] = useState("f-0");
  const [guiaAberto, setGuiaAberto] = useState(-1);
  const [contratoAberto, setContratoAberto] = useState(-1);
  const [pergunta, setPergunta] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erroIa, setErroIa] = useState<string | null>(null);
  const [respostaIa, setRespostaIa] = useState<RespostaIa | null>(null);
  const respostaRef = useRef<HTMLDivElement>(null);

  // Dúvidas do assistente (tabela assistant_kb): quando existem, substituem a
  // lista fixa abaixo, agrupadas por tema. Se o banco estiver vazio ou a
  // leitura falhar, a lista fixa continua no ar.
  const [kb, setKb] = useState<KbItem[] | null>(null);
  useEffect(() => {
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
  }, []);

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

  async function perguntar(e: React.FormEvent) {
    e.preventDefault();
    if (carregando) return;
    const texto = pergunta.trim();
    if (texto.length < 8) {
      setErroIa("Escreva sua pergunta com um pouco mais de detalhe.");
      return;
    }
    setErroIa(null);
    setCarregando(true);
    trackEvent("faq_ai_question", { location: "faq" });

    try {
      const { data, error } = await supabase.functions.invoke("faq-answer", {
        body: { pergunta: texto },
      });
      const payload = data as { resposta?: RespostaIa; error?: string } | null;
      if (error || !payload?.resposta) {
        setErroIa(
          payload?.error ||
            "Não conseguimos responder agora. Tente de novo em instantes ou fale com a gente no WhatsApp.",
        );
        return;
      }
      setRespostaIa(payload.resposta);
      trackEvent("faq_ai_answer", { location: "faq" });
      window.setTimeout(() => {
        respostaRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 60);
    } catch {
      setErroIa("Não conseguimos responder agora. Tente de novo em instantes.");
    } finally {
      setCarregando(false);
    }
  }


  useSeo({
    title: "Dúvidas sobre arquitetura, engenharia e reforma em SP | Bewild",
    description:
      "Dúvidas sobre arquitetura, engenharia e reforma de apartamento em SP respondidas: quanto custa, quanto tempo leva, projeto, autorização do condomínio, etapas e o que entra no contrato fechado da Bewild.",
    keywords:
      "dúvidas sobre arquitetura e engenharia, projeto de arquitetura em São Paulo, dúvidas sobre reforma de apartamento em SP, dúvidas sobre reforma de apartamento, reforma de apartamento em SP, custo de reforma, prazo de reforma, autorização de reforma condomínio, Bewild",
    canonicalPath: "/faq",
    ogType: "website",
    jsonLd: settings
      ? [
          breadcrumbJsonLd(settings, [
            { name: "Início", path: "/" },
            { name: "Perguntas frequentes", path: "/faq" },
          ]),
          faqJsonLd([
            ...(kb
              ? kb.map((i) => ({ q: i.pergunta, a: i.resposta }))
              : [...FAQ_ITEMS, ...GUIA_ITEMS].map((i) => ({ q: i.q, a: i.a }))),
            // Contratos e comissões entram no JSON-LD em qualquer cenário.
            ...CONTRATO_ITEMS.map((i) => ({ q: i.q, a: i.a })),
          ]),
        ]
      : undefined,
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
                  <div className="bwa-faq-list" itemScope itemType="https://schema.org/FAQPage">
                    {itens.map((item, i) => {
                      const key = `k-${item.id}`;
                      const open = aberto === key;
                      return (
                        <article
                          key={item.id}
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
                              aria-controls={`faq-resposta-${item.id}`}
                              onClick={() => abrirPergunta(key, open, item.pergunta)}
                            >
                              <span className="bwa-faq-num">{String(i + 1).padStart(2, "0")}</span>
                              <strong itemProp="name">{item.pergunta}</strong>
                              <span className="bwa-faq-icon" aria-hidden="true" />
                            </button>
                          </h2>
                          <div
                            id={`faq-resposta-${item.id}`}
                            className="bwa-faq-answer"
                            itemScope
                            itemProp="acceptedAnswer"
                            itemType="https://schema.org/Answer"
                          >
                            <p itemProp="text">{item.resposta}</p>
                            {(item.acoes ?? []).map((acao) => (
                              <a
                                key={acao.rotulo}
                                className="bwa-faqpage-guia-link"
                                href={acao.tipo === "whatsapp" ? whatsappHref() : acao.url}
                                {...(acao.tipo === "whatsapp"
                                  ? { target: "_blank", rel: "noopener noreferrer" }
                                  : {})}
                              >
                                {acao.rotulo} →
                              </a>
                            ))}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="bwa-faq-list" itemScope itemType="https://schema.org/FAQPage">
                {FAQ_ITEMS.map((item, i) => {
                  const key = `f-${i}`;
                  const open = aberto === key;
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
                          aria-controls={`faq-resposta-${i}`}
                          onClick={() => abrirPergunta(key, open, item.q)}
                        >
                          <span className="bwa-faq-num">{String(i + 1).padStart(2, "0")}</span>
                          <strong itemProp="name">{item.q}</strong>
                          <span className="bwa-faq-icon" aria-hidden="true" />
                        </button>
                      </h2>
                      <div
                        id={`faq-resposta-${i}`}
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
            )}
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
                Paulo: por onde começar, quanto custa, quanto demora e o que o
                condomínio exige.
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

        <section className="bwa-faqpage-ask" aria-labelledby="faq-ask-title">
          <div className="bwa-shell">
            <p className="bwa-label">Pergunte à Bewild</p>
            <h2 className="bwa-faqpage-ask-title" id="faq-ask-title">
              Sua dúvida não está na lista? <em>Pergunte aqui.</em>
            </h2>
            <p className="bwa-faqpage-lead">
              Escreva com suas palavras e a assistente da Bewild responde na
              hora, com base em como a gente trabalha. Para preço e prazo do seu
              imóvel, quem fecha é o time no diagnóstico.
            </p>

            <form className="bwa-faqpage-ask-form" onSubmit={perguntar}>
              <label className="bwa-faqpage-ask-label" htmlFor="faq-pergunta">
                Sua pergunta
              </label>
              <textarea
                id="faq-pergunta"
                className="bwa-faqpage-ask-input"
                rows={3}
                maxLength={1000}
                placeholder="Ex.: moro em Curitiba e comprei um studio de 28 m² na Vila Olímpia. Como funciona o acompanhamento?"
                value={pergunta}
                onChange={(e) => setPergunta(e.target.value)}
              />
              <button className="bwa-button" type="submit" disabled={carregando}>
                {carregando ? "Pensando…" : "Perguntar"} <span aria-hidden="true">→</span>
              </button>
            </form>

            <div aria-live="polite" ref={respostaRef}>
              {erroIa && <p className="bwa-faqpage-ask-erro">{erroIa}</p>}

              {respostaIa && (
                <div className="bwa-faqpage-ask-answer">
                  <p className="bwa-faqpage-ask-text">{respostaIa.resposta}</p>
                  {respostaIa.pontos?.length > 0 && (
                    <ul className="bwa-faqpage-ask-list">
                      {respostaIa.pontos.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  )}
                  {respostaIa.proximo_passo && (
                    <p className="bwa-faqpage-ask-next">{respostaIa.proximo_passo}</p>
                  )}
                  <div className="bwa-faqpage-ask-actions">
                    <a className="bwa-button" href="/diagnostico" data-cta="faq-ia-diagnostico">
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
                  <p className="bwa-faqpage-ask-note">
                    Resposta gerada por IA com base nas informações da Bewild.
                    Preço e prazo do seu imóvel são confirmados no diagnóstico.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bwa-faqpage-cta" aria-label="Solicitar orçamento">
          <div className="bwa-shell bwa-faqpage-cta-grid">
            <h2>
              Não encontrou sua resposta? <em>Vamos conversar.</em>
            </h2>
            <div className="bwa-faqpage-cta-actions">
              <a className="bwa-button bwa-button-light" href="/diagnostico" data-cta="faq-cta">
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
