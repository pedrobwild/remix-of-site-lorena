import { useEffect, useMemo, useRef, useState } from "react";
import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { whatsappHref } from "@/components/landing/content";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/ga4";
import { track } from "@/lib/analytics";
import { breadcrumbJsonLd, faqJsonLd, useSeo } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";
import { safeKbActions, type KbItem } from "@/lib/assistant/assistantEngine";
import { isExternalHref } from "@/lib/safeUrl";
import { scrollBehavior } from "@/lib/reducedMotion";
import "./faq-page.css";

type RespostaIa = {
  resposta: string;
  pontos: string[];
  proximo_passo: string;
  fora_do_escopo: boolean;
};

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

type FaqItem = { q: string; a: string; href?: string; linkLabel?: string };

const FAQ_ITEMS: FaqItem[] = [
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
    a: "Cerca de 60 dias úteis de obra para studios e apartamentos compactos de até 30 m²; imóveis maiores ou com integração de varanda levam mais. A sua data exata fica escrita no contrato, antes de a obra começar.",
  },
  {
    q: "Onde vocês atuam?",
    a: "Só em São Paulo capital, com obras entregues em mais de 27 bairros. Não atendemos a Grande São Paulo nem o interior, mas o dono do imóvel pode morar em qualquer cidade: o acompanhamento é todo à distância.",
  },
];

/* Complemento da lista principal só enquanto o banco não carregou (ou se
 * falhar), para o HTML do servidor não perder preço, atraso, garantia,
 * condomínio e portfólio. Espelha os itens `preco`, `atraso`, `garantia`,
 * `condominio` e `confianca` do banco. Com o banco no ar, some. */
const FAQ_ITEMS_SEM_BANCO: FaqItem[] = [
  {
    q: "Quanto custa uma reforma?",
    a: "Nas 58 obras completas da nossa base de 2025 (fevereiro a outubro), em imóveis de 21 a 35 m², a mediana foi de R$ 63.763 por obra, ou R$ 2.389 por metro quadrado, com projeto, obra, marcenaria sob medida, mobília e eletros incluídos. Metade das obras ficou entre R$ 2.107 e R$ 2.716 por m². O valor do seu imóvel sai fechado na proposta, com memorial item a item, antes de a obra começar.",
    href: "/orcamento",
    linkLabel: "Pedir um orçamento →",
  },
  {
    q: "E se a obra atrasar?",
    a: "A data de entrega entra no contrato antes de a obra começar. Se o atraso for por nossa conta, pagamos multa por dia de atraso, prevista em contrato. E cada etapa fica registrada no Bwild Workflow, visível para você do começo ao fim.",
  },
  {
    q: "Qual é a garantia?",
    a: "São 5 anos de garantia em contrato, para a obra e para a marcenaria. Se algo falhar nesse período, quem resolve é a Bewild.",
  },
  {
    q: "Preciso de autorização do condomínio para reformar?",
    a: "Sim. A maioria dos condomínios pede comunicado prévio, plano de reforma com ART ou RRT do responsável técnico (NBR 16280) e horários definidos para obra e elevador. Essa documentação e o pedido de liberação ficam com a Bewild, antes de a obra começar: você não precisa tratar com a administradora.",
    href: "/autorizacao-condominio",
    linkLabel: "Guia completo: autorização de reforma no condomínio →",
  },
  {
    q: "Posso ver obras que a Bewild já entregou?",
    a: "Pode. São mais de 160 reformas entregues em mais de 27 bairros de São Paulo, e o portfólio tem uma página para cada projeto, com fotos reais, metragem, bairro e o que foi feito. Para saber se há obra no seu prédio ou uma unidade para visitar, a equipe confere para você.",
    href: "/portfolio",
    linkLabel: "Ver o portfólio completo →",
  },
];

/** Lista principal quando o banco não está disponível. */
const FALLBACK_ITEMS: FaqItem[] = [...FAQ_ITEMS, ...FAQ_ITEMS_SEM_BANCO];

/* Bloco de conteúdo (não é copy travada da home): responde a buscas do tipo
 * "como fazer uma reforma de apartamento" e "por onde começar uma reforma".
 * Preço, prazo e condomínio ficam só na lista principal. */
const GUIA_ITEMS: FaqItem[] = [
  {
    q: "Como fazer uma reforma de apartamento, passo a passo?",
    a: "Na ordem: pedido de orçamento com a planta e o objetivo do imóvel (morar, alugar ou vender); proposta com preço, prazo e memorial item a item; projeto 3D revisado até a sua aprovação; projeto executivo, ART e liberação no condomínio; obra com equipe e marcenaria próprias, acompanhada pelo Bwild Workflow; e entrega com vistoria final. Na Bewild, tudo isso cabe num contrato só, com um único responsável.",
    href: "/como-funciona",
    linkLabel: "Ver como funciona, etapa por etapa →",
  },
  {
    q: "Por onde começar uma reforma de apartamento?",
    a: "Comece pelo objetivo, não pelo acabamento. Um apartamento para short stay pede layout, marcenaria e mobília pensados para alta rotatividade; um para morar pede outra coisa. Definido o objetivo, o passo seguinte é o projeto — decidir tudo no papel e no 3D é o que evita mudança cara no meio da obra.",
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

/* Bloco "Indicações e comissões": regras do programa de indicações (parceiros
 * e clientes). Contrato fechado, atraso e garantia ficam na lista principal.
 * Copy segue as decisões travadas do dono: sem percentual público de
 * comissão — o valor é definido no termo individual. */
const INDICACAO_ITEMS: FaqItem[] = [
  {
    q: "Como funciona a comissão para parceiros que indicam?",
    a: "Corretores, imobiliárias, incorporadoras, arquitetos e administradoras de locação recebem comissão por contrato indicado. O percentual não é público: é definido no termo individual, conforme o perfil e o volume de indicações, calculado sobre o valor líquido do contrato e com relatório mensal. O pagamento acontece após o recebimento da Bewild.",
    href: "/parceiros",
    linkLabel: "Ver o programa de indicações para parceiros →",
  },
  {
    q: "Como funciona a recompensa para quem indica um amigo?",
    a: "Qualquer pessoa pode indicar, sem precisar ser do mercado. O valor da recompensa é combinado com você e confirmado por escrito no momento do registro, e o pagamento é feito por Pix após o fechamento do contrato e a confirmação do primeiro pagamento do indicado.",
    href: "/indique-um-amigo",
    linkLabel: "Indicar um amigo agora →",
  },
  {
    q: "Por quanto tempo vale uma indicação?",
    a: "A indicação vale por 12 meses contados do registro. Se a pessoa indicada fechar contrato dentro desse período, a recompensa ou a comissão é sua.",
  },
  {
    q: "Meu indicado já estava negociando com a Bewild. Conta?",
    a: "Não. A indicação só vale para quem ainda não estava em negociação com a Bewild nem chegou por um canal próprio da empresa. A regra evita disputa entre indicadores e vale para todo mundo.",
  },
];

/* Bloco "Portfólio": exemplos de obras entregues, cada um ligado a um projeto
 * ou case real. "Posso ver as obras?", preço e região ficam na lista
 * principal. Links usam slugs reais do banco — se um projeto sair do ar,
 * trocar o href aqui. */
const PORTFOLIO_ITEMS: FaqItem[] = [
  {
    q: "Vocês já reformaram um studio pequeno, de uns 25 m²?",
    a: "Sim, é a nossa especialidade. Um exemplo é o AB – Península Vila Madalena, um studio de 23 m² reformado para locação, com marcenaria sob medida para aproveitar cada centímetro.",
    href: "/portfolio/ab-peninsula-vila-madalena",
    linkLabel: "Ver o projeto na Vila Madalena →",
  },
  {
    q: "Dá para ver o antes e depois de um studio para short stay?",
    a: "Dá. O FG – Nurban Vila Madalena é um studio de 26 m² reformado para aluguel de curta temporada, e o case mostra a obra da medição à entrega: fotos do antes, da obra e do resultado, com o passo a passo de cada decisão. Layout, marcenaria e mobília foram pensados para alta rotatividade e boas fotos de anúncio.",
    href: "/conteudos/antes-e-depois-studio-26-m2-vila-madalena",
    linkLabel: "Ler o case de antes e depois →",
  },
];

export default function FaqPage() {
  const { settings } = useSiteSettings();
  const [aberto, setAberto] = useState("f-0");
  const [guiaAberto, setGuiaAberto] = useState(-1);
  const [indicacaoAberto, setIndicacaoAberto] = useState(-1);
  const [portfolioAberto, setPortfolioAberto] = useState(-1);
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
        respostaRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: "nearest" });
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
      "Dúvidas sobre arquitetura, engenharia e reforma de apartamento em SP respondidas: quanto custa, quanto tempo leva, contrato fechado, garantia, comissão de indicações, autorização do condomínio, etapas da obra e obras reais do portfólio da Bewild, com links para os projetos.",
    keywords:
      "dúvidas sobre arquitetura e engenharia, projeto de arquitetura em São Paulo, dúvidas sobre reforma de apartamento em SP, reforma de apartamento em SP, custo de reforma, prazo de reforma, contrato fechado de reforma, garantia de reforma, comissão de indicação de imóvel, autorização de reforma condomínio, Bewild",
    canonicalPath: "/faq",
    ogType: "website",
    // Um único FAQPage por página (só JSON-LD, sem microdata duplicada), com
    // exatamente as perguntas visíveis: as do banco (ou a lista fixa) + os
    // blocos Portfólio, Como fazer uma reforma e Indicações.
    jsonLd: settings
      ? [
          breadcrumbJsonLd(settings, [
            { name: "Início", path: "/" },
            { name: "Perguntas frequentes", path: "/faq" },
          ]),
          faqJsonLd([
            ...(kb
              ? kb.map((i) => ({ q: i.pergunta, a: i.resposta }))
              : FALLBACK_ITEMS.map((i) => ({ q: i.q, a: i.a }))),
            // Blocos fixos exibidos em qualquer cenário (com ou sem o banco).
            ...PORTFOLIO_ITEMS.map((i) => ({ q: i.q, a: i.a })),
            ...GUIA_ITEMS.map((i) => ({ q: i.q, a: i.a })),
            ...INDICACAO_ITEMS.map((i) => ({ q: i.q, a: i.a })),
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
              Sua dúvida não está na lista? <em>Pergunte aqui.</em>
            </h2>
            <p className="bwa-faqpage-lead">
              Escreva com suas palavras e a assistente da Bewild responde na
              hora, com base em como a gente trabalha. Preço e prazo do seu
              imóvel saem fechados na proposta.
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
                aria-describedby="faq-pergunta-aviso"
                placeholder="Ex.: moro em Curitiba e comprei um studio de 28 m² na Vila Olímpia. Como funciona o acompanhamento?"
                value={pergunta}
                onChange={(e) => setPergunta(e.target.value)}
              />
              <button className="bwa-button" type="submit" disabled={carregando}>
                {carregando ? "Pensando…" : "Perguntar"} <span aria-hidden="true">→</span>
              </button>
            </form>
            {/* faq-page.css é compartilhado com /parceiros: ajuste local inline. */}
            <p className="bwa-faqpage-ask-note" id="faq-pergunta-aviso" style={{ maxWidth: "62ch" }}>
              Sua pergunta é enviada a um provedor de inteligência artificial só para gerar a
              resposta. Não escreva nome, telefone ou outros dados pessoais.{" "}
              <a href="/privacidade" style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>
                Política de privacidade
              </a>
              .
            </p>

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
                    <a className="bwa-button" href="/orcamento" data-cta="faq-ia-diagnostico">
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
                    Preço e prazo do seu imóvel são confirmados na proposta.
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
              <p className="bwa-faqpage-cta-note">+160 reformas entregues · +200 projetos</p>
            </div>
          </div>
        </section>
      </main>

      <BwaFooter />
    </div>
  );
}
