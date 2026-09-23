import { useEffect, useRef, useState } from "react";
import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import BewildLealMoreiraLogos from "@/components/BewildLealMoreiraLogos";
import { CONTACT, whatsappHref } from "@/components/landing/content";
import type { LeadPayload } from "@/lib/leadDelivery";
import {
  buildLeadMessage,
  fieldErrorId,
  fieldErrorProps,
  firstInvalidField,
  isValidEmail,
  touchAll,
  type FieldErrors,
} from "@/lib/leadForm";
import { formatBrPhone, isValidBrPhone, normalizeBrPhoneDigits } from "@/lib/phone";
import { supabase } from "@/integrations/supabase/client";
import { PARCEIROS_WHEN_INCORP_ON } from "@/content/incorporadoras";
import { isIncorporadorasPreview, useIncorporadorasEnabled } from "@/lib/incorporadorasFlag";
import { usePartnerCase } from "@/lib/usePartnerCase";
import { useCtaClickTracking } from "@/lib/trackCta";
import {
  browserUserAgent,
  collectLeadAttribution,
  focusField,
  openWhatsapp,
  useLeadSubmit,
} from "@/lib/useLeadSubmit";
import { breadcrumbJsonLd, faqJsonLd, useSeo } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";
import "./faq-page.css";
import "./contato.css";
import "./parceiros.css";

/* ============================================================
 * ParceirosPage — /parceiros
 * Corretores, imobiliárias e incorporadoras.
 * A página não vende reforma: vende remoção de objeção de venda
 * imobiliária ("e depois, quem reforma isso?"). Estrutura de 12
 * blocos conforme a especificação de 22/09/2026.
 *
 * Decisões travadas com o dono:
 * - Comissão SEM percentual público — só as regras do contrato.
 * - Leal Moreira citado com autorização (selo + bloco de prova).
 * ============================================================ */

const INDICACAO_URL = "https://forms.gle/vG9n5bWb4Rc7vEV56";

const TIPOS = [
  "Corretor autônomo",
  "Imobiliária",
  "Incorporadora",
  "Arquiteto(a)",
  "Administradora de locação",
];

const RAZOES = [
  {
    n: "01",
    t: "O studio de 20 a 35 m² é o centro, não a exceção",
    d: "Outras reformadoras cortam abaixo de 60 m² ou de R$ 100 mil. O corretor que vende studio fica sem fornecedor — e o comprador trava na pergunta “quem reforma isso?”. A Bewild existe exatamente para esse imóvel.",
  },
  {
    n: "02",
    t: "O comprador mora longe e decide à distância",
    d: "Quase metade dos nossos clientes mora fora da capital. Quem vende lançamento para investidor de outro estado precisa de um executante que o cliente acompanha de onde estiver — com foto, etapa e registro no Bwild Workflow.",
  },
  {
    n: "03",
    t: "Preço e prazo em contrato, com 5 anos de garantia",
    d: "O corretor não precisa prometer nada do próprio bolso. O que está no contrato Bewild é da Bewild: escopo, valor, prazo e garantia. A promessa que segura a assinatura da venda não é sua — é nossa.",
  },
  {
    n: "04",
    t: "O imóvel sai da obra pronto para anunciar",
    d: "Projeto, obra, marcenaria e mobília em um único contrato. O apartamento é entregue mobiliado e fotografável — pronto para morar, para o anúncio de locação ou para a primeira reserva de curta temporada.",
  },
];

const PASSOS = [
  {
    n: "01",
    t: "Cadastro de parceiro",
    d: "Dois minutos, no formulário desta página. Tipo de atuação, região e volume — o suficiente para priorizarmos quem indica com frequência.",
    tempo: "2 min",
  },
  {
    n: "02",
    t: "Registro da indicação",
    d: "Cada cliente indicado entra no formulário oficial de indicação. O registro vale por 12 meses: se o cliente fechar nesse período, a indicação é sua.",
    tempo: "2 min",
  },
  {
    n: "03",
    t: "Primeira conversa com o cliente",
    d: "Nossa equipe chama o indicado em até 1 dia útil, se apresenta como Bewild e conduz o diagnóstico do imóvel. Você é informado do andamento.",
    tempo: "até 1 dia útil",
  },
  {
    n: "04",
    t: "Proposta e contrato",
    d: "O cliente recebe escopo, preço e prazo fechados. Se assinar, a obra entra no Bwild Workflow — e você acompanha o status no relatório mensal.",
    tempo: "conforme o cliente",
  },
  {
    n: "05",
    t: "Comissão após o recebimento",
    d: "A comissão é calculada sobre o que o cliente efetivamente pagou, dentro dos prazos do termo de parceria. Sem adiantamento e sem letra miúda.",
    tempo: "regras abaixo",
  },
];

// Regras do contrato de parceria, sem o percentual (decisão do dono:
// o número fica para o termo individual, a página publica as regras).
const REGRAS_COMISSAO = [
  {
    regra: "Base de cálculo líquida",
    detalhe:
      "A comissão incide sobre o valor líquido do contrato: fora da base entram impostos (ISS, PIS, COFINS, IRPJ, CSLL), descontos, glosas e devoluções.",
  },
  {
    regra: "Contrato à vista",
    detalhe:
      "Parcela única de comissão em até 30 dias corridos do recebimento do valor pelo cliente.",
  },
  {
    regra: "Contrato parcelado",
    detalhe:
      "A comissão é dividida a partir da 2ª parcela e paga em até 10 dias úteis após cada recebimento.",
  },
  {
    regra: "Só sobre o efetivamente recebido",
    detalhe: "Não há adiantamento de comissão: ela acompanha o que o cliente pagou, quando pagou.",
  },
  {
    regra: "Aditivo não entra na base",
    detalhe:
      "Serviços complementares contratados depois (aditivos) não alteram a comissão da indicação original.",
  },
  {
    regra: "Indicação válida por 12 meses",
    detalhe:
      "Registrada a indicação, ela vale por 12 meses. Se o cliente fechar nesse período, a comissão é devida.",
  },
  {
    regra: "Cliente já em negociação não comissiona",
    detalhe:
      "Não há comissão para cliente que já estava em negociação com a Bewild ou chegou por canal próprio.",
  },
  {
    regra: "Distrato devolve proporcionalmente",
    detalhe:
      "Se o contrato for distratado, a comissão sobre valores devolvidos ao cliente é restituída ou compensada nas parcelas seguintes.",
  },
  {
    regra: "Parceria não exclusiva",
    detalhe:
      "Você continua livre para indicar outros fornecedores — e a Bewild continua livre para receber indicações de outros parceiros.",
  },
  {
    regra: "Nota fiscal como condição de pagamento",
    detalhe:
      "O pagamento da comissão é feito contra nota fiscal de intermediação, como previsto no termo de parceria.",
  },
  {
    regra: "Relatório mensal",
    detalhe:
      "Todo mês você recebe o status de cada indicação: contratos, recebimentos e comissões, linha a linha.",
  },
];

const FAQ_PARCEIRO = [
  {
    q: "Qual é o percentual de comissão?",
    a: "O percentual é definido no termo de parceria, por perfil e volume de indicações. O que é público são as regras — base líquida, prazos de pagamento, validade de 12 meses e relatório mensal — reproduzidas nesta página, linha a linha, para você saber exatamente como a comissão é calculada antes de assinar qualquer coisa.",
  },
  {
    q: "Como registro uma indicação e por quanto tempo ela vale?",
    a: "Pelo formulário oficial de indicação, linkado nesta página. São 2 minutos: dados do cliente e do imóvel. O registro vale por 12 meses — se o cliente fechar contrato nesse período, a indicação é sua, mesmo que ele volte a falar com a Bewild meses depois.",
  },
  {
    q: "E se o cliente já estiver falando com a Bewild?",
    a: "Clientes já em negociação ou vindos de canal próprio não geram comissão — essa regra protege os dois lados de disputa de origem. Por isso o registro formal da indicação vem sempre antes da primeira conversa.",
  },
  {
    q: "Quem fala com o cliente depois da indicação?",
    a: "A Bewild, sempre em nome próprio. Não usamos o nome do corretor, da imobiliária ou da incorporadora em nenhuma etapa, e não acessamos a sua carteira: atendemos apenas o cliente indicado, no assunto indicado.",
  },
  {
    q: "Quando a comissão é paga?",
    a: "Sobre o que o cliente efetivamente pagou. Contrato à vista: parcela única em até 30 dias corridos do recebimento. Contrato parcelado: a partir da 2ª parcela, em até 10 dias úteis por recebimento. Sem adiantamento — e com relatório mensal mostrando cada valor.",
  },
  {
    q: "Preciso de CNPJ para ser parceiro?",
    a: "O pagamento da comissão é feito contra nota fiscal de intermediação. Na prática, isso pede um CNPJ ativo — inclusive o de corretor autônomo. Se você atua como pessoa física, fale com a gente antes de cadastrar: avaliamos o formato caso a caso.",
  },
  {
    q: "A Bewild disputa meus clientes ou vende para a minha carteira?",
    a: "Não. A Bewild executa reforma — não vende imóvel, não capta cliente de venda e não fala em seu nome. Os dados do indicado são usados só para atender a indicação, conforme a LGPD, e o relacionamento comercial do cliente continua sendo seu.",
  },
  {
    q: "O que acontece se o cliente desistir depois de assinar?",
    a: "Distrato gera devolução proporcional: a comissão referente aos valores devolvidos ao cliente é restituída ou compensada nas parcelas seguintes. A regra é a mesma para os dois lados — comissão existe sobre o que ficou no contrato.",
  },
];

/* Uma única fonte de validação. Antes havia duas (flags + schema zod) que
   discordavam: um e-mail aceito por uma e recusado pela outra fazia o
   clique em "Cadastrar" não fazer nada, sem mensagem nenhuma. */
type Campo = "tipo" | "nome" | "whats" | "mail" | "regiao";
const CAMPOS: readonly Campo[] = ["tipo", "nome", "whats", "mail", "regiao"];
const CAMPO_ID: Record<Campo, string> = {
  tipo: "parc-tipo",
  nome: "parc-nome",
  whats: "parc-whats",
  mail: "parc-mail",
  regiao: "parc-regiao",
};

function validar(v: Record<Campo, string>): FieldErrors<Campo> {
  const e: FieldErrors<Campo> = {};
  if (!TIPOS.includes(v.tipo)) e.tipo = "Selecione o tipo de atuação.";
  if (v.nome.trim().length < 2) e.nome = "Informe seu nome.";
  if (!isValidBrPhone(v.whats)) e.whats = "Informe um número com DDD.";
  if (v.mail.trim() && !isValidEmail(v.mail)) e.mail = "Confira o e-mail digitado.";
  if (v.regiao.trim().length < 2) e.regiao = "Informe a região ou os empreendimentos.";
  return e;
}

export default function ParceirosPage() {
  useCtaClickTracking("parceiros");
  const { settings } = useSiteSettings();
  const email = settings?.contact_email || CONTACT.email;
  const [faqAberto, setFaqAberto] = useState(0);

  const [tipo, setTipo] = useState("");
  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [documento, setDocumento] = useState("");
  const [whats, setWhats] = useState("");
  const [mail, setMail] = useState("");
  const [regiao, setRegiao] = useState("");
  const [unidades, setUnidades] = useState("");
  const [origem, setOrigem] = useState("");
  const [touched, setTouched] = useState<Partial<Record<Campo, boolean>>>({});
  // WhatsApp com os dados do cadastro — saída quando a entrega não é confirmada.
  const [whatsLink, setWhatsLink] = useState<string | null>(null);
  const resultadoRef = useRef<HTMLDivElement | null>(null);
  const { sending: enviando, outcome, submit } = useLeadSubmit({ method: "parceiros_form" });
  // Evita reabrir o WhatsApp e duplicar a indicação num reenvio com os mesmos dados.
  const ultimoAberto = useRef<string | null>(null);
  const ultimaIndicacao = useRef<string | null>(null);

  const errors = validar({ tipo, nome, whats, mail, regiao });
  const erro = (k: Campo) => (touched[k] ? errors[k] : undefined);
  const touch = (k: Campo) => setTouched((t) => ({ ...t, [k]: true }));
  const concluido = outcome === "delivered" || outcome === "timedOut";

  useEffect(() => {
    if (concluido) resultadoRef.current?.focus();
  }, [concluido]);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    const primeiro = firstInvalidField(CAMPOS, errors);
    if (primeiro) {
      setTouched(touchAll(CAMPOS));
      focusField(CAMPO_ID[primeiro]);
      return;
    }

    const waLink = whatsappHref(
      buildLeadMessage("Olá, vim pelo site da Bewild e quero participar do programa de indicações.", [
        ["Tipo de parceiro", tipo],
        ["Nome", nome],
        ["Empresa", empresa],
        ["CRECI/CNPJ", documento],
        ["WhatsApp", whats],
        ["E-mail", mail],
        ["Região ou empreendimentos", regiao],
        ["Unidades vendidas por mês", unidades],
        ["Como conheceu", origem],
      ]),
    );
    setWhatsLink(waLink);

    // `form_path: "/parceiros"` separa o cadastro de parceiro dos leads de
    // cliente no banco e no admin; `landing_path` é a atribuição da sessão.
    const payload: LeadPayload = {
      name: nome.trim(),
      whatsapp: normalizeBrPhoneDigits(whats),
      email: mail.trim() || null,
      message: buildLeadMessage(`Tipo de parceiro: ${tipo}`, [
        ["Empresa", empresa],
        ["CRECI/CNPJ", documento],
        ["Unidades vendidas por mês", unidades],
      ]),
      location: regiao.trim(),
      area_m2: null,
      objetivo: `Parceria comercial — ${tipo}`,
      chaves: null,
      planta: null,
      ...collectLeadAttribution(),
      user_agent: browserUserAgent(),
      lead_source: origem.trim() || null,
      form_path: "/parceiros",
    };

    // Registra a solicitação no painel /admin/indicacoes (uma vez por
    // conjunto de dados). Os tetos seguem a policy de INSERT anônimo.
    const assinatura = JSON.stringify([tipo, nome, whats, mail, regiao]);
    if (ultimaIndicacao.current !== assinatura) {
      ultimaIndicacao.current = assinatura;
      void supabase
        .from("partner_referrals")
        .insert({
          partner_name: nome.trim().slice(0, 160),
          partner_type: tipo.slice(0, 80),
          company: empresa.trim().slice(0, 160) || null,
          document: documento.trim().slice(0, 40) || null,
          whatsapp: normalizeBrPhoneDigits(whats),
          email: mail.trim().slice(0, 254) || null,
          region: regiao.trim().slice(0, 200),
          units: unidades.trim().slice(0, 80) || null,
          origin: origem.trim().slice(0, 120) || null,
          message: payload.message?.slice(0, 4000) ?? null,
          landing_path: "/parceiros",
          referrer: typeof document !== "undefined" ? (document.referrer || "").slice(0, 500) || null : null,
          user_agent: browserUserAgent()?.slice(0, 500) ?? null,
        })
        .then(({ error }) => {
          if (error) {
            ultimaIndicacao.current = null;
            console.error("[partner_referrals] insert failed", error);
          }
        });
    }

    // O cadastro continua no WhatsApp de atendimento com a mensagem pronta. A
    // aba abre DENTRO do gesto (antes de qualquer await), senão o Safari/Chrome
    // mobile bloqueiam o popup. Num reenvio com os mesmos dados não abre de novo.
    void submit(payload, {
      params: { tipo },
      beforeSend:
        ultimoAberto.current === waLink
          ? undefined
          : () => {
              ultimoAberto.current = waLink;
              openWhatsapp(waLink);
            },
      handedToWhatsapp: true,
    });
  }

  // Com a página de incorporadoras no ar, a /parceiros deixa de falar por ela.
  const incorporadorasOn = useIncorporadorasEnabled();
  const { data: casoLeal } = usePartnerCase("leal-moreira", incorporadorasOn);
  // Com a página própria no ar, incorporadora não se cadastra por aqui.
  const tiposVisiveis = incorporadorasOn ? TIPOS.filter((t) => t !== "Incorporadora") : TIPOS;
  const mostrarStats = !!casoLeal && (casoLeal.published || isIncorporadorasPreview());
  const statsLeal = mostrarStats ? casoLeal.stats.slice(0, 3) : [];

  useSeo({
    title: "Programa de indicações para parceiros profissionais | Bewild",
    description: incorporadorasOn
      ? PARCEIROS_WHEN_INCORP_ON.seoDescription
      : "Indique clientes para a Bewild, acompanhe cada oportunidade e receba comissão conforme o termo. Programa para corretores, imobiliárias, incorporadoras, arquitetos e administradoras.",
    keywords:
      "escritório de arquitetura e engenharia em SP, reforma de apartamento em SP, parceria corretor reforma, indicação reforma comissão, reforma de studio para investidor, reforma apartamento compacto São Paulo, incorporadora reforma pós-chaves, custo de reforma, Bewild parceiros",
    canonicalPath: "/parceiros",
    ogType: "website",
    jsonLd: settings
      ? [
          breadcrumbJsonLd(settings, [
            { name: "Início", path: "/" },
            { name: "Programa de indicações", path: "/parceiros" },
          ]),
          faqJsonLd(FAQ_PARCEIRO.map((i) => ({ q: i.q, a: i.a }))),
        ]
      : undefined,
  });

  return (
    <div className="bwa-parceiros">
      <BwaNav />

      <main id="main" tabIndex={-1}>
        {/* 01 · Programa de indicações + recompensa + parceria vigente */}
        <section className="bwa-parc-hero">
          <div className="bwa-shell bwa-parc-hero-grid">
            <div>
              <p className="bwa-label">Programa de indicações · parceiros profissionais</p>
              <h1>
                Indique um cliente. <em>A Bewild entrega e você recebe.</em>
              </h1>
              <p className="bwa-parc-lead">
                {incorporadorasOn
                  ? PARCEIROS_WHEN_INCORP_ON.heroLead
                  : "Corretores, imobiliárias, incorporadoras, arquitetos e administradoras podem indicar clientes para uma entrega completa de projeto, obra, marcenaria e mobília. Quando o contrato indicado é pago, você recebe a comissão definida no seu termo."}
              </p>
              <div className="bwa-parc-hero-actions">
                <a className="bwa-button" href="#cadastro" data-cta="parceiros-hero-cadastro">
                  Solicitar participação <span aria-hidden="true">→</span>
                </a>
                <a
                  className="bwa-parc-ghost"
                  href={INDICACAO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cta="parceiros-hero-indicacao"
                >
                  Já sou parceiro — registrar indicação <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
            <aside className="bwa-parc-seal" aria-label="Recompensa do programa de indicações">
              <p className="bwa-label">Sua recompensa</p>
              <strong>Comissão por contrato indicado</strong>
              <p>
                O percentual é definido no termo individual, conforme o perfil e o volume de
                indicações. Você recebe sobre o valor líquido efetivamente pago pelo cliente e
                acompanha contratos, recebimentos e comissões em relatório mensal.
              </p>
              <a className="bwa-parc-seal-link" href="#comissao">Ver todas as regras <span aria-hidden="true">↓</span></a>
            </aside>
          </div>
          <div className="bwa-shell">
            <ul className="bwa-parc-facts">
              <li><strong>+160</strong> reformas entregues</li>
              <li><strong>20 a 35 m²</strong> studios como centro</li>
              <li><strong>~60 dias úteis</strong> da obra à entrega</li>
              <li><strong>5 anos</strong> de garantia</li>
              <li><strong>30 de 62</strong> clientes fora da capital</li>
            </ul>
          </div>
        </section>

        {/* 02 · Dois caminhos */}
        <section className="bwa-parc-section" id="caminhos">
          <div className="bwa-shell">
            <p className="bwa-label">02 · Dois caminhos</p>
            <h2>Quem vende o imóvel e quem entrega o empreendimento.</h2>
            <div className="bwa-parc-two">
              <article className="bwa-parc-card">
                <h3>Corretores e imobiliárias</h3>
                <p>
                  O comprador gostou do studio, mas travou no “quem reforma?”. Você indica a
                  Bewild, registra a indicação em 2 minutos e segue a venda. A reforma deixa de
                  ser objeção e vira argumento de fechamento — com comissão de indicação e
                  relatório mensal.
                </p>
                <a href="#cadastro" data-cta="parceiros-caminho-corretor">
                  Cadastrar como corretor ou imobiliária <span aria-hidden="true">→</span>
                </a>
              </article>
              <article className="bwa-parc-card">
                <h3>Incorporadoras</h3>
                <p>
                  O empreendimento entrega o apartamento; a Bewild entrega ele pronto para morar
                  ou render. Atuamos antes das chaves (padrão de acabamento e decorado) e depois
                  delas (reforma dos compradores e investidores), sem disputar a venda e sem
                  falar em nome da incorporadora.
                </p>
                <a
                  href={incorporadorasOn ? "/parceiros/incorporadoras" : "#incorporadoras"}
                  data-cta="parceiros-caminho-incorporadora"
                >
                  {incorporadorasOn
                    ? PARCEIROS_WHEN_INCORP_ON.caminhoIncorporadorasLink
                    : "Ver o modelo para incorporadoras"}{" "}
                  <span aria-hidden="true">→</span>
                </a>
              </article>
            </div>
          </div>
        </section>

        {/* 03 · Quatro razões ligadas à venda dele */}
        <section className="bwa-parc-section bwa-parc-section--alt" id="razoes">
          <div className="bwa-shell">
            <p className="bwa-label">03 · Por que indicar a Bewild</p>
            <h2>4 razões que aparecem na sua venda, não na nossa.</h2>
            <div className="bwa-parc-grid4">
              {RAZOES.map((r) => (
                <article className="bwa-parc-reason" key={r.n}>
                  <span className="bwa-parc-num">{r.n}</span>
                  <h3>{r.t}</h3>
                  <p>{r.d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 04 · Como funciona a indicação */}
        <section className="bwa-parc-section" id="como-funciona">
          <div className="bwa-shell">
            <p className="bwa-label">04 · Como funciona a indicação</p>
            <h2>5 passos, com o tempo de cada um declarado.</h2>
            <ol className="bwa-parc-steps">
              {PASSOS.map((p) => (
                <li className="bwa-parc-step" key={p.n}>
                  <span className="bwa-parc-num">{p.n}</span>
                  <div>
                    <h3>{p.t}</h3>
                    <p>{p.d}</p>
                  </div>
                  <span className="bwa-parc-step-time">{p.tempo}</span>
                </li>
              ))}
            </ol>
            <p className="bwa-parc-note">
              Já é parceiro?{" "}
              <a
                href={INDICACAO_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-cta="parceiros-passos-indicacao"
              >
                Registre a indicação aqui
              </a>{" "}
              — o registro vale por 12 meses a partir do envio.
            </p>
          </div>
        </section>

        {/* 05 · A comissão, sem letra miúda (regras, sem percentual) */}
        <section className="bwa-parc-section bwa-parc-section--alt" id="comissao">
          <div className="bwa-shell">
            <p className="bwa-label">05 · A comissão, sem letra miúda</p>
            <h2>As regras são públicas. O percentual fica no termo.</h2>
            <p className="bwa-parc-lead2">
              O que corretor experiente desconfia é de “excelente comissão” sem regra. Então a
              página publica as regras do nosso termo de parceria, linha a linha — o percentual
              é definido por perfil e volume, no termo individual.
            </p>
            <div className="bwa-parc-table-wrap">
              <table className="bwa-parc-table">
                <caption className="sr-only">Regras de comissionamento da parceria Bewild</caption>
                <thead>
                  <tr>
                    <th scope="col">Regra</th>
                    <th scope="col">Como funciona</th>
                  </tr>
                </thead>
                <tbody>
                  {REGRAS_COMISSAO.map((r) => (
                    <tr key={r.regra}>
                      <th scope="row">{r.regra}</th>
                      <td>{r.detalhe}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 06 · O que o cliente recebe */}
        <section className="bwa-parc-section" id="entrega">
          <div className="bwa-shell">
            <p className="bwa-label">06 · O que o seu cliente recebe</p>
            <h2>A indicação protege a sua reputação — ou não vale nada.</h2>
            <div className="bwa-parc-grid4">
              <article className="bwa-parc-reason">
                <span className="bwa-parc-num">01</span>
                <h3>Escopo completo em 1 contrato</h3>
                <p>
                  Projeto, obra, marcenaria e mobília com preço e prazo fechados. O cliente não
                  coordena pedreiro, marceneiro e loja — e não volta para você com problema de obra.
                </p>
              </article>
              <article className="bwa-parc-reason">
                <span className="bwa-parc-num">02</span>
                <h3>Bwild Workflow</h3>
                <p>
                  O cliente acompanha cada etapa com foto e registro, de onde estiver. Para quem
                  mora fora da capital — quase metade dos nossos clientes — é o que torna a obra
                  possível.
                </p>
              </article>
              <article className="bwa-parc-reason">
                <span className="bwa-parc-num">03</span>
                <h3>~60 dias úteis de obra</h3>
                <p>
                  Prazo de referência declarado antes de assinar, com cronograma em contrato.
                  O investidor sabe quando o imóvel começa a render.
                </p>
              </article>
              <article className="bwa-parc-reason">
                <span className="bwa-parc-num">04</span>
                <h3>5 anos de garantia</h3>
                <p>
                  Garantia formal da execução. Se algo falha depois da entrega, quem responde é a
                  Bewild — não o corretor que indicou.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* 07 · Bloco B2B incorporadoras. Com a página própria no ar, aqui
            fica só um card curto que leva para ela. */}
        {incorporadorasOn ? (
          <section className="bwa-parc-section bwa-parc-section--dark" id="incorporadoras">
            <div className="bwa-shell">
              <p className="bwa-label">{PARCEIROS_WHEN_INCORP_ON.bloco07.label}</p>
              <h2>{PARCEIROS_WHEN_INCORP_ON.bloco07.title}</h2>
              <p className="bwa-parc-lead2">{PARCEIROS_WHEN_INCORP_ON.bloco07.text}</p>
              <a
                className="bwa-button bwa-button-light"
                href="/parceiros/incorporadoras"
                data-cta="parceiros-b2b-pagina"
              >
                {PARCEIROS_WHEN_INCORP_ON.bloco07.cta} <span aria-hidden="true">→</span>
              </a>
            </div>
          </section>
        ) : (
          <section className="bwa-parc-section bwa-parc-section--dark" id="incorporadoras">
            <div className="bwa-shell">
              <p className="bwa-label">07 · Para incorporadoras</p>
              <h2>Antes das chaves e depois delas.</h2>
              <div className="bwa-parc-two">
                <article className="bwa-parc-card bwa-parc-card--dark">
                  <h3>Antes das chaves</h3>
                  <p>
                    Padrão de acabamento e unidade decorada de studios e apartamentos, desenhados
                    para o comprador investidor. O decorado mostra o imóvel pronto para render.
                  </p>
                </article>
                <article className="bwa-parc-card bwa-parc-card--dark">
                  <h3>Depois das chaves</h3>
                  <p>
                    Quase metade dos clientes da Bewild mora fora da capital e precisa de quem
                    entregue o apartamento pronto à distância. A Bewild executa a reforma dos
                    compradores do empreendimento com preço, prazo e garantia em contrato, sem
                    disputar a venda e sem falar em nome da incorporadora.
                  </p>
                </article>
              </div>
              <a className="bwa-button bwa-button-light" href="#cadastro" data-cta="parceiros-b2b-cta">
                Conversar sobre o empreendimento <span aria-hidden="true">→</span>
              </a>
            </div>
          </section>
        )}

        {/* 08 · Prova */}
        <section className="bwa-parc-section" id="prova">
          <div className="bwa-shell">
            <p className="bwa-label">08 · Parceria e resultado</p>
            <h2>Parceria e resultado com nome e número.</h2>
            {incorporadorasOn && (
              <a
                className="bwa-parc-card bwa-parc-leal-hero"
                href={PARCEIROS_WHEN_INCORP_ON.cardLealMoreira.href}
                data-cta="parceiros-prova-leal-moreira"
              >
                <BewildLealMoreiraLogos />
                <p>{PARCEIROS_WHEN_INCORP_ON.cardLealMoreira.text}</p>
                {statsLeal.length > 0 && (
                  <ul className="bwa-parc-facts">
                    {statsLeal.map((st) => (
                      <li key={st.label}>
                        <strong>{st.value}</strong> {st.label}
                      </li>
                    ))}
                  </ul>
                )}
                <span className="bwa-parc-leal-cta">
                  {PARCEIROS_WHEN_INCORP_ON.cardLealMoreira.cta} <span aria-hidden="true">→</span>
                </span>
              </a>
            )}
            <div className={incorporadorasOn ? "bwa-parc-two bwa-parc-two--single" : "bwa-parc-two"}>
              {!incorporadorasOn && (
                <article className="bwa-parc-card">
                  <BewildLealMoreiraLogos />
                  <p>
                    Programa de indicações vigente com a Leal Moreira, formalizado em termo de
                    parceria: registro de indicação com validade de 12 meses, comissão sobre valor
                    líquido recebido e relatório mensal de status, contratos e comissões.
                  </p>
                </article>
              )}
              <article className="bwa-parc-card">
                <h3>Vivian · Pinheiros · 98% de ocupação em setembro</h3>
                <p>
                  A Vivian comprou um studio em Pinheiros para renda de curta temporada e mora fora
                  de São Paulo. A Bewild entregou projeto, obra, marcenaria e mobília à distância, e
                  o imóvel opera com cerca de 98% de ocupação em setembro.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* 09 · Regras de convivência */}
        <section className="bwa-parc-section bwa-parc-section--alt" id="convivencia">
          <div className="bwa-shell">
            <p className="bwa-label">09 · Regras de convivência</p>
            <h2>O que a Bewild nunca faz com a sua carteira.</h2>
            <div className="bwa-parc-grid3">
              <article className="bwa-parc-reason">
                <h3>Não disputamos sua carteira</h3>
                <p>
                  A Bewild executa reforma. Não vende imóvel, não capta cliente de venda e não
                  intermedeia locação. O relacionamento comercial do cliente continua sendo seu.
                </p>
              </article>
              <article className="bwa-parc-reason">
                <h3>Não falamos em seu nome</h3>
                <p>
                  Do primeiro contato à entrega, nos apresentamos como Bewild. Seu nome, sua
                  imobiliária ou sua incorporadora não aparecem em nenhuma promessa de obra.
                </p>
              </article>
              <article className="bwa-parc-reason">
                <h3>LGPD na indicação</h3>
                <p>
                  Os dados do indicado são usados apenas para atender a indicação, com base na
                  LGPD. Nada de lista compartilhada, campanha cruzada ou contato fora do escopo.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* 10 · FAQ do parceiro */}
        <section className="bwa-parc-section" id="faq">
          <div className="bwa-shell">
            <p className="bwa-label">10 · Perguntas de quem indica</p>
            <h2>8 respostas diretas, sem rodeio.</h2>
            {/* Dados estruturados só pelo JSON-LD (faqJsonLd no useSeo): microdata
                FAQPage no mesmo conteúdo duplicava a entidade para o Google. */}
            <div className="bwa-faq-list">
              {FAQ_PARCEIRO.map((item, i) => {
                const open = faqAberto === i;
                return (
                  <article
                    key={item.q}
                    className={`bwa-faq-item${open ? " bwa-open" : ""}`}
                  >
                    <h3 className="bwa-faqpage-q">
                      <button
                        className="bwa-faq-question"
                        type="button"
                        aria-expanded={open}
                        aria-controls={`parceiros-resposta-${i}`}
                        onClick={() => setFaqAberto(open ? -1 : i)}
                      >
                        <span className="bwa-faq-num">{String(i + 1).padStart(2, "0")}</span>
                        <strong>{item.q}</strong>
                        <span className="bwa-faq-icon" aria-hidden="true" />
                      </button>
                    </h3>
                    <div id={`parceiros-resposta-${i}`} className="bwa-faq-answer">
                      <p>{item.a}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* 11 · Cadastro de parceiro + porta de indicação */}
        <section className="bwa-contact-form-sec" id="cadastro">
          <div className="bwa-shell bwa-contact-form-grid">
            <div className="bwa-contact-form-intro">
              <p className="bwa-label">11 · Cadastro de parceiro</p>
              <h2>Duas portas, dois formulários.</h2>
              <p>
                <strong>Quero ser parceiro:</strong> cadastro aqui ao lado — tipo de atuação,
                região e volume. Nossa equipe responde pelo WhatsApp com o termo de parceria.
              </p>
              <p>
                <strong>Já sou parceiro:</strong> o registro de cada cliente indicado é no
                formulário oficial do contrato, com validade de 12 meses.
              </p>
              <a
                className="bwa-contact-link"
                href={INDICACAO_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-cta="parceiros-form-indicacao"
              >
                Registrar uma indicação <span aria-hidden="true">↗</span>
              </a>
              <p>
                Prefere e-mail? <a href={`mailto:${email}`}>{email}</a>
              </p>
            </div>

            {outcome === "delivered" ? (
              <div className="bwa-contact-form-done" role="status" tabIndex={-1} ref={resultadoRef}>
                <p className="bwa-label">Cadastro recebido</p>
                <h3>Obrigado, {nome.trim().split(" ")[0]}.</h3>
                <p>
                  Nossa equipe analisa seu perfil e responde pelo WhatsApp informado com o termo
                  de parceria. Se já tem um cliente para indicar, registre agora — a validade de
                  12 meses conta a partir do registro.
                </p>
                <a
                  className="bwa-button"
                  href={whatsLink ?? whatsappHref("Olá, acabei de enviar meu cadastro de parceiro pelo site da Bewild")}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cta="parceiros-form-whatsapp"
                >
                  Confirmar no WhatsApp <span aria-hidden="true">↗</span>
                </a>
                <a
                  href={INDICACAO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Registrar indicação <span aria-hidden="true">↗</span>
                </a>
              </div>
            ) : outcome === "timedOut" ? (
              <div className="bwa-contact-form-done" role="status" tabIndex={-1} ref={resultadoRef}>
                <p className="bwa-label">Envio sem confirmação</p>
                <h3>Seu cadastro pode já ter chegado, {nome.trim().split(" ")[0]}.</h3>
                <p>
                  A confirmação demorou mais que o normal. Para garantir, mande o cadastro pelo
                  WhatsApp — a mensagem já vai com os seus dados. Se já tivermos recebido, é só
                  ignorar.
                </p>
                {whatsLink && (
                  <a className="bwa-button" href={whatsLink} target="_blank" rel="noopener noreferrer">
                    Enviar pelo WhatsApp <span aria-hidden="true">→</span>
                  </a>
                )}
              </div>
            ) : (
              <form className="bwa-contact-form" onSubmit={enviar} noValidate aria-label="Cadastro de parceiro">
                <div className="bwa-contact-field">
                  <label htmlFor="parc-tipo">Tipo de parceiro</label>
                  <select
                    id="parc-tipo"
                    value={tipo}
                    required
                    onChange={(e) => setTipo(e.target.value)}
                    onBlur={() => touch("tipo")}
                    {...fieldErrorProps("parc-tipo", erro("tipo"))}
                  >
                    <option value="">Selecione</option>
                    {tiposVisiveis.map((tp) => (
                      <option key={tp} value={tp}>
                        {tp}
                      </option>
                    ))}
                  </select>
                  {erro("tipo") && <em id={fieldErrorId("parc-tipo")}>{erro("tipo")}</em>}
                </div>

                <div className="bwa-contact-field">
                  <label htmlFor="parc-nome">Nome</label>
                  <input
                    id="parc-nome"
                    type="text"
                    value={nome}
                    maxLength={120}
                    autoComplete="name"
                    required
                    onChange={(e) => setNome(e.target.value)}
                    onBlur={() => touch("nome")}
                    {...fieldErrorProps("parc-nome", erro("nome"))}
                  />
                  {erro("nome") && <em id={fieldErrorId("parc-nome")}>{erro("nome")}</em>}
                </div>

                <div className="bwa-contact-field">
                  <label htmlFor="parc-empresa">Empresa (opcional)</label>
                  <input
                    id="parc-empresa"
                    type="text"
                    value={empresa}
                    maxLength={120}
                    autoComplete="organization"
                    placeholder="Imobiliária, incorporadora ou escritório"
                    onChange={(e) => setEmpresa(e.target.value)}
                  />
                </div>

                <div className="bwa-contact-field">
                  <label htmlFor="parc-documento">CRECI ou CNPJ (opcional)</label>
                  <input
                    id="parc-documento"
                    type="text"
                    value={documento}
                    maxLength={24}
                    placeholder="CRECI 00000-F ou 00.000.000/0000-00"
                    onChange={(e) => setDocumento(e.target.value)}
                  />
                </div>

                <div className="bwa-contact-field">
                  <label htmlFor="parc-whats">WhatsApp</label>
                  <input
                    id="parc-whats"
                    type="tel"
                    inputMode="tel"
                    value={whats}
                    autoComplete="tel"
                    placeholder="(11) 90000-0000"
                    required
                    onChange={(e) => setWhats(formatBrPhone(e.target.value))}
                    onBlur={() => touch("whats")}
                    {...fieldErrorProps("parc-whats", erro("whats"))}
                  />
                  {erro("whats") && <em id={fieldErrorId("parc-whats")}>{erro("whats")}</em>}
                </div>

                <div className="bwa-contact-field">
                  <label htmlFor="parc-mail">E-mail (opcional)</label>
                  <input
                    id="parc-mail"
                    type="email"
                    value={mail}
                    maxLength={180}
                    autoComplete="email"
                    onChange={(e) => setMail(e.target.value)}
                    onBlur={() => touch("mail")}
                    {...fieldErrorProps("parc-mail", erro("mail"))}
                  />
                  {erro("mail") && <em id={fieldErrorId("parc-mail")}>{erro("mail")}</em>}
                </div>

                <div className="bwa-contact-field">
                  <label htmlFor="parc-regiao">Região ou empreendimentos</label>
                  <input
                    id="parc-regiao"
                    type="text"
                    value={regiao}
                    maxLength={180}
                    placeholder="Pinheiros e Vila Olímpia · ou nomes dos empreendimentos"
                    required
                    onChange={(e) => setRegiao(e.target.value)}
                    onBlur={() => touch("regiao")}
                    {...fieldErrorProps("parc-regiao", erro("regiao"))}
                  />
                  {erro("regiao") && <em id={fieldErrorId("parc-regiao")}>{erro("regiao")}</em>}
                </div>

                <div className="bwa-contact-field">
                  <label htmlFor="parc-unidades">Unidades vendidas por mês (opcional)</label>
                  <input
                    id="parc-unidades"
                    type="text"
                    inputMode="numeric"
                    value={unidades}
                    maxLength={4}
                    placeholder="Ex.: 6"
                    onChange={(e) => setUnidades(e.target.value.replace(/\D+/g, ""))}
                  />
                </div>

                <div className="bwa-contact-field bwa-contact-field--full">
                  <label htmlFor="parc-origem">Como conheceu a Bewild (opcional)</label>
                  {/* 80 = limite de `lead_source` no servidor (acima disso era cortado em silêncio). */}
                  <input
                    id="parc-origem"
                    type="text"
                    value={origem}
                    maxLength={80}
                    placeholder="Indicação, Instagram, Google, evento…"
                    onChange={(e) => setOrigem(e.target.value)}
                  />
                </div>

                {outcome === "failed" && !enviando && (
                  <div className="bwa-contact-form-error" role="alert">
                    <p>
                      Não conseguimos enviar seu cadastro agora. Tente de novo ou mande pelo
                      WhatsApp — a mensagem já vai com os seus dados.
                    </p>
                    {whatsLink && (
                      <a
                        className="bwa-contact-link"
                        href={whatsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Enviar pelo WhatsApp <span aria-hidden="true">↗</span>
                      </a>
                    )}
                  </div>
                )}

                <div className="bwa-contact-form-actions">
                  {/* Habilitado com campos pendentes: o clique mostra os erros e leva o foco ao primeiro. */}
                  <button
                    className="bwa-button"
                    type="submit"
                    data-cta="parceiros-enviar"
                    disabled={enviando}
                  >
                    {enviando
                      ? "Enviando…"
                      : outcome === "failed"
                        ? "Tentar de novo"
                        : "Cadastrar como parceiro"}
                    <span aria-hidden="true">→</span>
                  </button>
                  <p>
                    Seus dados são usados apenas para responder ao cadastro, conforme a LGPD.
                  </p>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* 12 · Rodapé com assinatura (BwaFooter já traz “Seu desejo é uma obra.”) */}
      </main>

      <BwaFooter />
    </div>
  );
}
