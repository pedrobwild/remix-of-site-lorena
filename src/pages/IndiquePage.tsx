import { useRef, useState } from "react";
import { z } from "zod";
import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { CONTACT, whatsappHref } from "@/components/landing/content";
import { supabase } from "@/integrations/supabase/client";
import { isServerAcceptedEmail, type LeadPayload } from "@/lib/leadDelivery";
import { buildLeadMessage } from "@/lib/leadForm";
import { formatBrPhone, isValidBrPhone, normalizeBrPhoneDigits } from "@/lib/phone";
import { useCtaClickTracking } from "@/lib/trackCta";
import { browserUserAgent, collectLeadAttribution, openWhatsapp, useLeadSubmit } from "@/lib/useLeadSubmit";
import { breadcrumbJsonLd, faqJsonLd, useSeo } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";
import "./faq-page.css";
import "./contato.css";
import "./parceiros.css";

/* ============================================================
 * IndiquePage — /indique-um-amigo
 * Programa de indicações para CLIENTES (pessoa física), sem
 * exigência de CNPJ, CRECI ou atuação profissional.
 *
 * Decisões travadas com o dono (23/09/2026):
 * - Recompensa SEM valor público — definida individualmente.
 * - Recompensa paga em PIX após o fechamento do contrato.
 * - Página separada do programa de parceiros profissionais
 *   (/parceiros), com cross-link entre as duas.
 * ============================================================ */

const RELACOES = ["Amigo(a)", "Familiar", "Vizinho(a)", "Colega de trabalho", "Outro"];

const PASSOS = [
  {
    n: "01",
    t: "Registre a indicação",
    d: "Dois minutos, no formulário desta página: seus dados e os dados de quem você está indicando. O registro vale por 12 meses.",
    tempo: "2 min",
  },
  {
    n: "02",
    t: "A Bewild chama o indicado",
    d: "Nossa equipe fala com a pessoa indicada em até 1 dia útil, se apresenta como Bewild e agenda o diagnóstico do imóvel. Você é avisado.",
    tempo: "até 1 dia útil",
  },
  {
    n: "03",
    t: "Proposta e contrato",
    d: "O indicado recebe escopo, preço e prazo fechados. Se assinar, a obra entra no Bwild Workflow com acompanhamento por foto.",
    tempo: "conforme o cliente",
  },
  {
    n: "04",
    t: "Recompensa no Pix",
    d: "Fechado o contrato e confirmado o primeiro pagamento do cliente, a sua recompensa é paga em Pix. Sem nota fiscal, sem burocracia.",
    tempo: "após o fechamento",
  },
];

const REGRAS = [
  {
    regra: "Recompensa definida com você",
    detalhe:
      "O valor da recompensa é combinado individualmente e confirmado por escrito no registro da indicação — antes de qualquer conversa com o indicado.",
  },
  {
    regra: "Pagamento em Pix",
    detalhe:
      "A recompensa é paga em Pix após o fechamento do contrato e a confirmação do primeiro pagamento do cliente indicado. Não pedimos nota fiscal nem CNPJ.",
  },
  {
    regra: "Indicação válida por 12 meses",
    detalhe:
      "Registrada a indicação, ela vale por 12 meses. Se o indicado fechar contrato nesse período, a recompensa é sua — mesmo que ele volte a falar com a gente meses depois.",
  },
  {
    regra: "Cliente já em negociação não conta",
    detalhe:
      "Se a pessoa indicada já estava em negociação com a Bewild ou chegou por canal próprio, não há recompensa. Por isso o registro vem sempre antes da primeira conversa.",
  },
  {
    regra: "Vale para qualquer indicado",
    detalhe:
      "Pode indicar amigo, familiar, vizinho ou colega — para reforma de apartamento, studio ou cobertura, para morar ou para investir.",
  },
  {
    regra: "Dados protegidos",
    detalhe:
      "Os dados do indicado são usados apenas para atender a indicação, conforme a LGPD. Nada de lista compartilhada ou contato fora do assunto.",
  },
];

const FAQ_INDICADOR = [
  {
    q: "Quanto eu ganho por indicação?",
    a: "O valor da recompensa é combinado individualmente e confirmado por escrito no registro da indicação, antes de qualquer conversa com o indicado. Você sabe exatamente quanto recebe antes de indicar — nada de descobrir depois.",
  },
  {
    q: "Quando e como recebo?",
    a: "Em Pix, após o fechamento do contrato e a confirmação do primeiro pagamento do cliente indicado. Não pedimos nota fiscal e não exigimos CNPJ — é um programa para clientes, não para empresas.",
  },
  {
    q: "Preciso ser cliente da Bewild para indicar?",
    a: "Não. Qualquer pessoa física pode indicar — cliente, ex-cliente ou alguém que conhece o nosso trabalho. Profissionais do mercado imobiliário (corretores, imobiliárias, arquitetos) têm um programa próprio, com comissão, na página de parceiros.",
  },
  {
    q: "Como registro a indicação e por quanto tempo ela vale?",
    a: "No formulário desta página: 2 minutos, com seus dados e os do indicado. O registro vale por 12 meses — se a pessoa fechar contrato nesse período, a recompensa é sua, mesmo que ela retome o contato meses depois.",
  },
  {
    q: "E se a pessoa que eu indiquei já estiver falando com a Bewild?",
    a: "Indicados já em negociação ou vindos de canal próprio não geram recompensa — essa regra evita disputa de origem. Por isso o registro formal da indicação vem sempre antes da primeira conversa.",
  },
  {
    q: "O que acontece depois que eu indico?",
    a: "Nossa equipe chama o indicado em até 1 dia útil, se apresenta como Bewild e conduz o diagnóstico do imóvel. Você é avisado do andamento e, se o contrato fechar, combina o Pix da recompensa.",
  },
];

// Telefone e e-mail com as mesmas regras dos outros formulários (e do servidor).
const indicadorSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  whats: z.string().refine(isValidBrPhone),
  mail: z.union([z.literal(""), z.string().trim().refine(isServerAcceptedEmail)]),
  indicadoNome: z.string().trim().min(2).max(120),
  indicadoWhats: z.string().refine(isValidBrPhone),
  relacao: z.enum(RELACOES as [string, ...string[]]),
  mensagem: z.string().trim().max(600),
});

export default function IndiquePage() {
  useCtaClickTracking("indique-um-amigo");
  const { settings } = useSiteSettings();
  const email = settings?.contact_email || CONTACT.email;
  const [faqAberto, setFaqAberto] = useState(0);

  const [nome, setNome] = useState("");
  const [whats, setWhats] = useState("");
  const [mail, setMail] = useState("");
  const [indicadoNome, setIndicadoNome] = useState("");
  const [indicadoWhats, setIndicadoWhats] = useState("");
  const [relacao, setRelacao] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { sending: enviando, submit } = useLeadSubmit({ method: "indique_um_amigo_form" });
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [whatsLink, setWhatsLink] = useState<string | null>(null);
  // Evita reabrir o WhatsApp e duplicar a indicação num reenvio igual.
  const ultimoAberto = useRef<string | null>(null);
  const ultimaIndicacao = useRef<string | null>(null);

  const nomeOk = nome.trim().length >= 2;
  const whatsOk = isValidBrPhone(whats);
  const mailOk = mail.trim() === "" || isServerAcceptedEmail(mail.trim());
  const indicadoNomeOk = indicadoNome.trim().length >= 2;
  const indicadoWhatsOk = isValidBrPhone(indicadoWhats);
  const relacaoOk = relacao !== "";
  const podeEnviar = nomeOk && whatsOk && mailOk && indicadoNomeOk && indicadoWhatsOk && relacaoOk;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setTouched({ nome: true, whats: true, mail: true, indicadoNome: true, indicadoWhats: true, relacao: true });
    const parsed = indicadorSchema.safeParse({
      nome,
      whats,
      mail,
      indicadoNome,
      indicadoWhats,
      relacao,
      mensagem,
    });
    if (!podeEnviar || !parsed.success) return;
    const dados = parsed.data;

    const linhas = [
      "Indicação de cliente (programa Indique um Amigo)",
      `Indicado: ${dados.indicadoNome}`,
      `WhatsApp do indicado: ${indicadoWhats}`,
      `Relação: ${dados.relacao}`,
      dados.mensagem ? `Mensagem: ${dados.mensagem}` : null,
    ].filter(Boolean);

    // Mensagem que chega no WhatsApp de atendimento, igual ao fluxo das
    // páginas /contato e /parceiros.
    const waLink = whatsappHref(
      buildLeadMessage("Olá, vim pelo site da Bewild e quero indicar alguém no programa Indique um Amigo.", [
        ["Meu nome", dados.nome],
        ["Meu WhatsApp", whats],
        ["Meu e-mail", dados.mail],
        ["Indicado", dados.indicadoNome],
        ["WhatsApp do indicado", indicadoWhats],
        ["Relação", dados.relacao],
        ["Mensagem", dados.mensagem],
      ]),
    );
    setWhatsLink(waLink);

    // A aba do WhatsApp abre DENTRO do gesto (antes de qualquer await): depois
    // do await o Safari/Chrome mobile bloqueiam o popup. Num reenvio com os
    // mesmos dados não abre de novo.
    if (ultimoAberto.current !== waLink) {
      ultimoAberto.current = waLink;
      openWhatsapp(waLink);
    }

    // Registra a indicação no painel /admin/indicacoes (mesma tabela do
    // programa de parceiros, com tipo próprio), uma vez por conjunto de dados.
    // Os tetos seguem a policy de INSERT anônimo da tabela.
    if (ultimaIndicacao.current !== waLink) {
      ultimaIndicacao.current = waLink;
      void supabase
        .from("partner_referrals")
        .insert({
          partner_name: dados.nome.slice(0, 160),
          partner_type: "Cliente indicador",
          whatsapp: normalizeBrPhoneDigits(whats),
          email: dados.mail ? dados.mail.slice(0, 254) : null,
          origin: "indique-um-amigo",
          message: linhas.join("\n").slice(0, 4000),
          client_name: dados.indicadoNome.slice(0, 160),
          landing_path: "/indique-um-amigo",
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

    const payload: LeadPayload = {
      name: dados.nome,
      whatsapp: normalizeBrPhoneDigits(whats),
      email: dados.mail || null,
      message: linhas.join("\n"),
      location: null,
      area_m2: null,
      objetivo: "Indique um Amigo — indicação de cliente",
      chaves: null,
      planta: null,
      ...collectLeadAttribution(),
      user_agent: browserUserAgent(),
      lead_source: "indique-um-amigo",
      form_path: "/indique-um-amigo",
    };

    setErro(null);
    const resultado = await submit(payload, { handedToWhatsapp: true });
    if (resultado === "delivered" || resultado === "timedOut") {
      setEnviado(true);
    } else if (resultado === "failed") {
      setErro(
        "Não conseguimos registrar sua indicação agora. Envie a mensagem que abriu no WhatsApp ou tente novamente.",
      );
    }
  }

  useSeo({
    title: "Indique um amigo e ganhe no Pix | Programa de indicações Bewild",
    description:
      "Indique alguém que vai reformar um apartamento, studio ou cobertura em São Paulo. Se o contrato fechar, você recebe a recompensa em Pix. Sem CNPJ, sem burocracia — registro em 2 minutos.",
    keywords:
      "indique e ganhe reforma, programa de indicação reforma São Paulo, recompensa por indicação apartamento, reforma de studio São Paulo, reforma de apartamento SP, Bewild indicações",
    canonicalPath: "/indique-um-amigo",
    ogType: "website",
    jsonLd: settings
      ? [
          breadcrumbJsonLd(settings, [
            { name: "Início", path: "/" },
            { name: "Indique um amigo", path: "/indique-um-amigo" },
          ]),
          faqJsonLd(FAQ_INDICADOR.map((i) => ({ q: i.q, a: i.a }))),
        ]
      : undefined,
  });

  return (
    <div className="bwa-parceiros">
      <BwaNav />

      <main id="main" tabIndex={-1}>
        {/* 01 · Abertura + recompensa */}
        <section className="bwa-parc-hero">
          <div className="bwa-shell bwa-parc-hero-grid">
            <div>
              <p className="bwa-label">Programa de indicações · para clientes e amigos</p>
              <h1>
                Indique quem vai reformar. <em>Se fechar, você recebe no Pix.</em>
              </h1>
              <p className="bwa-parc-lead">
                Conhece alguém que comprou um apartamento, studio ou cobertura em São Paulo e
                precisa reformar? Registre a indicação em 2 minutos. Se o contrato fechar, a
                sua recompensa cai em Pix — sem CNPJ, sem nota fiscal, sem burocracia.
              </p>
              <div className="bwa-parc-hero-actions">
                <a className="bwa-button" href="#indicar" data-cta="indique-hero-form">
                  Registrar uma indicação <span aria-hidden="true">→</span>
                </a>
                <a className="bwa-parc-ghost" href="#como-funciona" data-cta="indique-hero-como">
                  Ver como funciona <span aria-hidden="true">↓</span>
                </a>
              </div>
            </div>
            <aside className="bwa-parc-seal" aria-label="Recompensa do programa de indicações">
              <p className="bwa-label">Sua recompensa</p>
              <strong>Pix após o fechamento do contrato</strong>
              <p>
                O valor é combinado individualmente e confirmado por escrito no registro da
                indicação — você sabe exatamente quanto recebe antes de indicar. O pagamento
                acontece após o contrato fechar e o primeiro pagamento do cliente ser confirmado.
              </p>
              <a className="bwa-parc-seal-link" href="#regras">Ver todas as regras <span aria-hidden="true">↓</span></a>
            </aside>
          </div>
          <div className="bwa-shell">
            <ul className="bwa-parc-facts">
              <li><strong>2 min</strong> para registrar</li>
              <li><strong>12 meses</strong> de validade da indicação</li>
              <li><strong>até 1 dia útil</strong> para chamarmos o indicado</li>
              <li><strong>Pix</strong> após o fechamento</li>
            </ul>
          </div>
        </section>

        {/* 02 · Quem indicar */}
        <section className="bwa-parc-section" id="quem">
          <div className="bwa-shell">
            <p className="bwa-label">02 · Quem indicar</p>
            <h2>Aquele amigo que comprou e não sabe por onde começar.</h2>
            <div className="bwa-parc-grid3">
              <article className="bwa-parc-reason">
                <h3>Comprou para investir</h3>
                <p>
                  Studios e apartamentos compactos para alugar ou operar em curta temporada são a
                  nossa especialidade: entregamos o imóvel pronto para o anúncio, com marcenaria e
                  mobília incluídas no mesmo contrato.
                </p>
              </article>
              <article className="bwa-parc-reason">
                <h3>Comprou para morar</h3>
                <p>
                  Apartamento novo ou antigo, entregue no contrapiso ou pedindo reforma completa:
                  projeto, obra, marcenaria e mobília em um único contrato, com preço e prazo
                  fechados.
                </p>
              </article>
              <article className="bwa-parc-reason">
                <h3>Mora fora de São Paulo</h3>
                <p>
                  Quase metade dos nossos clientes mora fora da capital e acompanha tudo à
                  distância, com foto e registro de cada etapa no Bwild Workflow. Indicar alguém
                  de longe não é problema — é o nosso dia a dia.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* 03 · Como funciona */}
        <section className="bwa-parc-section bwa-parc-section--alt" id="como-funciona">
          <div className="bwa-shell">
            <p className="bwa-label">03 · Como funciona</p>
            <h2>4 passos, com o tempo de cada um declarado.</h2>
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
          </div>
        </section>

        {/* 04 · Regras, sem letra miúda */}
        <section className="bwa-parc-section" id="regras">
          <div className="bwa-shell">
            <p className="bwa-label">04 · As regras, sem letra miúda</p>
            <h2>As regras são públicas. O valor é combinado com você.</h2>
            <p className="bwa-parc-lead2">
              O que desanima em programa de indicação é promessa vaga. Então publicamos as regras
              linha a linha — e o valor da sua recompensa é combinado individualmente, por escrito,
              antes de qualquer conversa com o indicado.
            </p>
            <div className="bwa-parc-table-wrap">
              <table className="bwa-parc-table">
                <caption className="sr-only">Regras do programa Indique um Amigo da Bewild</caption>
                <thead>
                  <tr>
                    <th scope="col">Regra</th>
                    <th scope="col">Como funciona</th>
                  </tr>
                </thead>
                <tbody>
                  {REGRAS.map((r) => (
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

        {/* 05 · O que o indicado recebe */}
        <section className="bwa-parc-section bwa-parc-section--alt" id="entrega">
          <div className="bwa-shell">
            <p className="bwa-label">05 · O que o seu indicado recebe</p>
            <h2>Você indica tranquilo: quem responde pela obra é a Bewild.</h2>
            <div className="bwa-parc-grid4">
              <article className="bwa-parc-reason">
                <span className="bwa-parc-num">01</span>
                <h3>Escopo completo em 1 contrato</h3>
                <p>
                  Projeto, obra, marcenaria e mobília com preço e prazo fechados. O indicado não
                  coordena pedreiro, marceneiro e loja — e não volta para você com problema de obra.
                </p>
              </article>
              <article className="bwa-parc-reason">
                <span className="bwa-parc-num">02</span>
                <h3>Bwild Workflow</h3>
                <p>
                  Cada etapa com foto e registro, acompanhada de onde a pessoa estiver. É o que
                  torna a obra possível para quem mora longe do imóvel.
                </p>
              </article>
              <article className="bwa-parc-reason">
                <span className="bwa-parc-num">03</span>
                <h3>~60 dias úteis de obra</h3>
                <p>
                  Prazo de referência declarado antes de assinar, com cronograma em contrato.
                  Nada de obra sem data para acabar.
                </p>
              </article>
              <article className="bwa-parc-reason">
                <span className="bwa-parc-num">04</span>
                <h3>5 anos de garantia</h3>
                <p>
                  Garantia formal da execução. Se algo falha depois da entrega, quem responde é a
                  Bewild — não você, que indicou.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* 06 · FAQ */}
        <section className="bwa-parc-section" id="faq">
          <div className="bwa-shell">
            <p className="bwa-label">06 · Perguntas de quem indica</p>
            <h2>6 respostas diretas, sem rodeio.</h2>
            <div className="bwa-faq-list" itemScope itemType="https://schema.org/FAQPage">
              {FAQ_INDICADOR.map((item, i) => {
                const open = faqAberto === i;
                return (
                  <article
                    key={item.q}
                    className={`bwa-faq-item${open ? " bwa-open" : ""}`}
                    itemScope
                    itemProp="mainEntity"
                    itemType="https://schema.org/Question"
                  >
                    <h3 className="bwa-faqpage-q">
                      <button
                        className="bwa-faq-question"
                        type="button"
                        aria-expanded={open}
                        aria-controls={`indique-resposta-${i}`}
                        onClick={() => setFaqAberto(open ? -1 : i)}
                      >
                        <span className="bwa-faq-num">{String(i + 1).padStart(2, "0")}</span>
                        <strong itemProp="name">{item.q}</strong>
                        <span className="bwa-faq-icon" aria-hidden="true" />
                      </button>
                    </h3>
                    <div
                      id={`indique-resposta-${i}`}
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

        {/* 07 · Registro da indicação */}
        <section className="bwa-contact-form-sec" id="indicar">
          <div className="bwa-shell bwa-contact-form-grid">
            <div className="bwa-contact-form-intro">
              <p className="bwa-label">07 · Registrar indicação</p>
              <h2>2 minutos e a indicação está valendo por 12 meses.</h2>
              <p>
                Preencha seus dados e os dados de quem você está indicando. Nossa equipe chama o
                indicado em até 1 dia útil e confirma com você, por escrito, o valor da recompensa
                antes de qualquer conversa.
              </p>
              <p>
                <strong>Você é corretor, imobiliária ou arquiteto?</strong> O programa de
                parceiros profissionais, com comissão e relatório mensal, fica na{" "}
                <a href="/parceiros">página de parceiros</a>.
              </p>
              <p>
                Prefere e-mail? <a href={`mailto:${email}`}>{email}</a>
              </p>
            </div>

            {enviado ? (
              <div className="bwa-contact-form-done" role="status">
                <p className="bwa-label">Indicação registrada</p>
                <h3>Obrigado, {nome.trim().split(" ")[0]}.</h3>
                <p>
                  Sua indicação está registrada e vale por 12 meses. Nossa equipe chama{" "}
                  {indicadoNome.trim().split(" ")[0]} em até 1 dia útil e confirma com você, por
                  escrito, o valor da recompensa em Pix.
                </p>
                <a
                  className="bwa-button"
                  href={whatsLink ?? whatsappHref("Olá, acabei de registrar uma indicação pelo site da Bewild")}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cta="indique-form-whatsapp"
                >
                  Confirmar no WhatsApp <span aria-hidden="true">↗</span>
                </a>
              </div>
            ) : (
              <form className="bwa-contact-form" onSubmit={enviar} noValidate>
                <label className="bwa-contact-field">
                  <span>Seu nome</span>
                  <input
                    type="text"
                    value={nome}
                    maxLength={120}
                    autoComplete="name"
                    onChange={(e) => setNome(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, nome: true }))}
                    aria-invalid={touched.nome && !nomeOk}
                  />
                  {touched.nome && !nomeOk && <em>Informe seu nome.</em>}
                </label>

                <label className="bwa-contact-field">
                  <span>Seu WhatsApp</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={whats}
                    autoComplete="tel"
                    placeholder="(11) 90000-0000"
                    onChange={(e) => setWhats(formatBrPhone(e.target.value))}
                    onBlur={() => setTouched((t) => ({ ...t, whats: true }))}
                    aria-invalid={touched.whats && !whatsOk}
                  />
                  {touched.whats && !whatsOk && <em>Informe um número com DDD.</em>}
                </label>

                <label className="bwa-contact-field">
                  <span>Seu e-mail (opcional)</span>
                  <input
                    type="email"
                    value={mail}
                    maxLength={180}
                    autoComplete="email"
                    onChange={(e) => setMail(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, mail: true }))}
                    aria-invalid={touched.mail && !mailOk}
                  />
                  {touched.mail && !mailOk && <em>Confira o e-mail digitado.</em>}
                </label>

                <label className="bwa-contact-field">
                  <span>Nome de quem você indica</span>
                  <input
                    type="text"
                    value={indicadoNome}
                    maxLength={120}
                    placeholder="Nome do amigo, familiar ou colega"
                    onChange={(e) => setIndicadoNome(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, indicadoNome: true }))}
                    aria-invalid={touched.indicadoNome && !indicadoNomeOk}
                  />
                  {touched.indicadoNome && !indicadoNomeOk && <em>Informe o nome do indicado.</em>}
                </label>

                <label className="bwa-contact-field">
                  <span>WhatsApp do indicado</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={indicadoWhats}
                    placeholder="(11) 90000-0000"
                    onChange={(e) => setIndicadoWhats(formatBrPhone(e.target.value))}
                    onBlur={() => setTouched((t) => ({ ...t, indicadoWhats: true }))}
                    aria-invalid={touched.indicadoWhats && !indicadoWhatsOk}
                  />
                  {touched.indicadoWhats && !indicadoWhatsOk && <em>Informe um número com DDD.</em>}
                </label>

                <label className="bwa-contact-field">
                  <span>Relação com o indicado</span>
                  <select
                    value={relacao}
                    onChange={(e) => setRelacao(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, relacao: true }))}
                    aria-invalid={touched.relacao && !relacaoOk}
                  >
                    <option value="">Selecione</option>
                    {RELACOES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  {touched.relacao && !relacaoOk && <em>Selecione a relação.</em>}
                </label>

                <label className="bwa-contact-field bwa-contact-field--full">
                  <span>Algo que ajude na primeira conversa (opcional)</span>
                  <textarea
                    value={mensagem}
                    maxLength={600}
                    rows={3}
                    placeholder="Ex.: comprou um studio na Vila Olímpia e quer alugar em curta temporada"
                    onChange={(e) => setMensagem(e.target.value)}
                  />
                </label>

                {erro && (
                  <p className="bwa-contact-form-error" role="alert">
                    {erro}
                  </p>
                )}

                <div className="bwa-contact-form-actions">
                  <button
                    className="bwa-button"
                    type="submit"
                    data-cta="indique-enviar"
                    disabled={enviando}
                  >
                    {enviando ? "Enviando…" : "Registrar indicação"}
                    <span aria-hidden="true">→</span>
                  </button>
                  <p>
                    Seus dados e os do indicado são usados apenas para atender a indicação,
                    conforme a LGPD.
                  </p>
                </div>
              </form>
            )}
          </div>
        </section>
      </main>

      <BwaFooter />
    </div>
  );
}
