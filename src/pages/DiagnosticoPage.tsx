import { useEffect, useMemo, useRef, useState } from "react";
import { useSeo, breadcrumbJsonLd, organizationJsonLd } from "../lib/useSeo";
import { useSiteSettings } from "../lib/useSiteSettings";
import BwaNav from "@/components/BwaNav";
import BwaFooter from "@/components/BwaFooter";
import { whatsappHref } from "../components/landing/content";
import { trackEvent } from "@/lib/ga4";
import { useCtaClickTracking } from "@/lib/trackCta";
import type { LeadPayload } from "@/lib/leadDelivery";
import { formatBrPhone, isValidBrPhone, normalizeBrPhoneDigits } from "@/lib/phone";
import {
  LEAD_CHAVES,
  LEAD_OBJETIVOS,
  buildLeadMessage,
  fieldErrorId,
  fieldErrorProps,
  firstInvalidField,
  isValidAreaM2,
  isValidEmail,
  parseAreaM2,
  sanitizeAreaInput,
  touchAll,
  type FieldErrors,
} from "@/lib/leadForm";
import {
  browserUserAgent,
  collectLeadAttribution,
  focusField,
  openWhatsapp,
  useLeadSubmit,
} from "@/lib/useLeadSubmit";
import depoimentoVideo from "@/assets/testimonials/depoimento-cliente.mp4.asset.json";
import diagCssUrl from "./diagnostico-bwa.css?url";

/* ============================================================
 * DiagnosticoPage — /diagnostico no visual .bwa aprovado em
 * public/mockups/diag-bwa-aprovado.html (fonte da verdade da
 * APRESENTAÇÃO + COPY). A MECÂNICA do formulário é a testada:
 * names/ids/types, máscara de telefone, validações, notify-lead (via sendLead),
 * GA4 (generate_lead, play_depoimento), WhatsApp, useSeo e
 * jsonLd — TUDO PRESERVADO.
 *
 * Adições permitidas (documentadas no brief do dono):
 *  a) mensagens de erro de validação sob os campos;
 *  b) modal do vídeo da Vivian (thumb com <video>);
 *  c) botão "Enviando…" durante submit.
 *
 * O bloco FAQ dinâmico (useFaq) foi substituído pela versão de 4
 * perguntas aprovada pelo dono em 18/jul, com microdata FAQPage.
 * ============================================================ */

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Manrope:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,500&display=swap";

function ensureLinkOnce(rel: string, href: string, marker: string) {
  if (document.head.querySelector(`link[${marker}]`)) return;
  const el = document.createElement("link");
  el.rel = rel;
  el.href = href;
  el.setAttribute(marker, "");
  document.head.appendChild(el);
}

/** Mesma técnica da home: injeta o CSS da rota POR ÚLTIMO no head
 *  para vencer cascata dos globais (index.css, bwh-*); remove no
 *  unmount para não vazar paleta para outras rotas. */
function mountDiagStylesheet(): () => void {
  const marker = "data-bwa-diag-css";
  let link = document.head.querySelector<HTMLLinkElement>(`link[${marker}]`);
  if (!link) {
    link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = diagCssUrl;
    link.setAttribute(marker, "");
    document.head.appendChild(link);
  } else {
    document.head.appendChild(link);
  }
  return () => {
    link?.parentNode?.removeChild(link);
  };
}

/* VALORES verbatim do mockup (dados do CRM, inalterados) — a lista canônica
   vive em leadForm.ts para /orcamento e /p mandarem os mesmos valores. */
const CHAVES = LEAD_CHAVES;
const OBJETIVOS = LEAD_OBJETIVOS;
const OBJETIVO_QUERY_MAP: Record<string, string> = {
  "short-stay": "Short stay",
  moradia: "Moradia",
  locacao: "Locação tradicional",
  "uso-misto": "Uso misto",
  avaliando: "Ainda avaliando",
};
const PLANTA = ["Sim", "Não", "Não sei"];
/* Rótulo exibido difere do valor enviado ao CRM (valor permanece o histórico). */
const OBJETIVO_LABELS: Record<string, string> = { "Locação tradicional": "Locação longa" };
/* Dois campos de qualificação/atribuição (plano de copy vs. concorrentes, 22/09/2026):
   ~48% dos clientes moram fora da capital e ~97% das vendas não tinham origem registrada. */
const MORA_SP = ["Sim", "Não"];
const ORIGENS = ["Indicação", "Instagram", "Google", "Placa de obra", "Corretor ou imobiliária", "Outro"];

type Form = {
  nome: string; whats: string; email: string; local: string;
  metragem: string; objetivo: string; chaves: string; planta: string; mensagem: string;
  moraSp: string; origem: string;
};
const EMPTY_FORM: Form = {
  nome: "", whats: "", email: "", local: "", metragem: "", objetivo: "", chaves: "", planta: "", mensagem: "",
  moraSp: "", origem: "",
};

/* Campos validados, na ordem visual (o foco vai para o primeiro inválido). */
type Campo = "nome" | "whats" | "email" | "local" | "chaves" | "objetivo" | "metragem" | "moraSp" | "origem";
const CAMPOS: readonly Campo[] = ["nome", "whats", "email", "local", "chaves", "objetivo", "metragem", "moraSp", "origem"];
const CAMPO_ID: Record<Campo, string> = {
  nome: "dg-nome", whats: "dg-whats", email: "dg-email", local: "dg-local", chaves: "dg-chaves",
  objetivo: "dg-objetivo", metragem: "dg-m2", moraSp: "dg-morasp", origem: "dg-origem",
};

function validar(f: Form): FieldErrors<Campo> {
  const e: FieldErrors<Campo> = {};
  if (f.nome.trim().length < 2) e.nome = "Informe seu nome.";
  if (!isValidBrPhone(f.whats)) e.whats = "Informe um WhatsApp com DDD.";
  if (f.email.trim() && !isValidEmail(f.email)) e.email = "E-mail inválido.";
  if (f.local.trim().length < 2) e.local = "Informe o bairro do imóvel.";
  if (!f.chaves) e.chaves = "Selecione uma opção.";
  if (!f.objetivo) e.objetivo = "Selecione o objetivo.";
  // Metragem aproximada é obrigatória: é ela que define a faixa de investimento.
  if (!isValidAreaM2(parseAreaM2(f.metragem))) {
    e.metragem = f.metragem.trim() ? "Confira a metragem (em m²)." : "Informe a metragem aproximada.";
  }
  if (!f.moraSp) e.moraSp = "Selecione uma opção.";
  if (!f.origem) e.origem = "Selecione uma opção.";
  return e;
}

export default function DiagnosticoPage() {
  useCtaClickTracking("diagnostico");
  const { settings } = useSiteSettings();

  useSeo({
    title: "Diagnóstico de arquitetura e reforma em São Paulo | Bewild",
    description:
      "Solicite o diagnóstico de arquitetura e engenharia para a reforma completa do seu apartamento em São Paulo, do projeto à entrega do imóvel pronto. Sem custo e sem compromisso.",
    keywords:
      "projeto de arquitetura em São Paulo, arquitetura e engenharia, orçamento de reforma de apartamento, custo de reforma em SP, quanto custa reformar apartamento São Paulo, orçamento reforma completa, Bewild",
    canonicalPath: "/diagnostico",
    ogType: "website",
    jsonLd: settings
      ? [
          organizationJsonLd(settings),
          breadcrumbJsonLd(settings, [
            { name: "Início", path: "/" },
            { name: "Orçamento", path: "/diagnostico" },
          ]),
        ]
      : undefined,
  });

  useEffect(() => {
    ensureLinkOnce("preconnect", "https://fonts.googleapis.com", "data-bwa-diag-pc1");
    const el2 = document.head.querySelector("link[data-bwa-diag-pc2]");
    if (!el2) {
      const l = document.createElement("link");
      l.rel = "preconnect";
      l.href = "https://fonts.gstatic.com";
      l.crossOrigin = "anonymous";
      l.setAttribute("data-bwa-diag-pc2", "");
      document.head.appendChild(l);
    }
    ensureLinkOnce("stylesheet", FONTS_HREF, "data-bwa-diag-fonts");
    const unmountCss = mountDiagStylesheet();

    return () => {
      unmountCss();
    };
  }, []);

  const waUrl = whatsappHref("Olá, prefiro falar com um especialista sobre o orçamento.");

  return (
    <>
      {/* Nav compartilhado (mesmo componente da home e das demais internas).
          A nav própria .dg-nav foi removida: era o único header do site com
          wordmark de 20px, tracking .2em nos links e CTA navy sólido. */}
      <BwaNav />

      <main id="main" tabIndex={-1}>
        {/* 01 · HERO + FICHA */}
        <section className="dg-hero" aria-label="Solicitar orçamento">
          <div className="dg-shell dg-hero-grid">
            <div>
              <div className="dg-intro">
                <p className="dg-label">Orçamento · 01 · sem custo, sem compromisso</p>
                <h1 className="dg-title">Conte o que você tem. A Bewild devolve escopo, investimento e prazo.</h1>
                <p className="dg-lead">
                  Preencha os dados do seu apartamento. A Bewild analisa o potencial do imóvel — para morar, alugar ou vender — e volta no seu WhatsApp com uma leitura clara do escopo, do investimento estimado e dos próximos passos. Não precisa ter as chaves nem a planta.
                </p>
              </div>

              <div className="dg-support">
                <div className="dg-recebe">
                  <p className="dg-label">O que você recebe</p>
                  <ol>
                    <li><i>01</i><span><strong>Leitura do potencial do imóvel</strong>, considerando uso, bairro e metragem.</span></li>
                    <li><i>02</i><span><strong>Escopo da reforma</strong> para deixar o apartamento pronto para o seu objetivo.</span></li>
                    <li><i>03</i><span><strong>Faixa de investimento e prazo</strong> estimados para o seu caso.</span></li>
                    <li><i>04</i><span><strong>Próximos passos, no seu tempo</strong> — você decide se avança.</span></li>
                  </ol>
                </div>

                <p className="dg-trust">+160 reformas entregues</p>

                <TestimonialCard waUrl={waUrl} />
              </div>
            </div>

            <DiagnosticoForm />
          </div>
        </section>

        {/* 02 · DEPOIS DO ENVIO */}
        <section className="dg-section" aria-labelledby="dg-passos-title">
          <div className="dg-shell">
            <div className="dg-section-head">
              <p className="dg-label">Depois do envio · 02</p>
              <h2 id="dg-passos-title" className="dg-title">O que acontece quando você manda os dados.</h2>
              <p className="dg-lead">Nada de mistério nem de fila. O processo é direto — e você decide cada passo seguinte.</p>
            </div>
            <div className="dg-cells">
              <div className="dg-cell"><i>01 · Análise</i><h3>A gente lê o seu imóvel.</h3><p>Bairro, metragem, estado atual e objetivo entram na leitura do potencial.</p></div>
              <div className="dg-cell"><i>02 · Retorno</i><h3>Voltamos no seu WhatsApp.</h3><p>Uma leitura inicial e as suas dúvidas respondidas. Gente de verdade, sem robô.</p></div>
              <div className="dg-cell"><i>03 · Visita e projeto</i><h3>Se fizer sentido, avançamos.</h3><p>Agendamos a visita técnica e começamos o projeto do seu apartamento.</p></div>
              <div className="dg-cell"><i>04 · Proposta fechada</i><h3>Preço e prazo antes da obra.</h3><p>Escopo, data de entrega e valor definidos em contrato antes de a obra começar.</p></div>
            </div>
          </div>
        </section>

        {/* 03 · PROVA EM NÚMEROS */}
        <section className="dg-section" style={{ paddingTop: 0 }} aria-labelledby="dg-num-title">
          <div className="dg-shell">
            <div className="dg-section-head">
              <p className="dg-label">Por que a Bewild · 03</p>
              <h2 id="dg-num-title" className="dg-title">Já fizemos isso mais de 160 vezes.</h2>
            </div>
            <div className="dg-cells">
              <div className="dg-cell dg-stat"><b>+160</b><span>reformas entregues</span></div>
              <div className="dg-cell dg-stat"><b>60<em>dias úteis</em></b><span>referência de prazo de obra até 30 m²</span></div>
              <div className="dg-cell dg-stat"><b>5<em>anos</em></b><span>garantia de obra e marcenaria</span></div>
              <div className="dg-cell dg-stat"><b>1<em>contrato</em></b><span>preço e prazo fechados antes de a obra começar</span></div>
            </div>
            <p className="dg-fine dg-mono">Referências sujeitas ao escopo · detalhes na proposta e no contrato</p>
          </div>
        </section>

        {/* 04 · FAQ — versão aprovada de 4 perguntas (substitui useFaq dinâmico) */}
        <section className="dg-section" style={{ paddingTop: 0 }} aria-labelledby="dg-faq-title">
          <div className="dg-shell">
            <div className="dg-section-head">
              <p className="dg-label">Perguntas · 04</p>
              <h2 id="dg-faq-title" className="dg-title">Antes de mandar os dados.</h2>
            </div>
            <div className="dg-faq" itemScope itemType="https://schema.org/FAQPage">
              <details open itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                <summary itemProp="name">Quanto custa pedir o orçamento?</summary>
                <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                  <p itemProp="text">Nada. É uma análise inicial sem custo e sem compromisso — você decide se quer avançar depois de receber a leitura.</p>
                </div>
              </details>
              <details itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                <summary itemProp="name">Em quanto tempo vocês respondem?</summary>
                <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                  <p itemProp="text">Nosso time retorna no seu WhatsApp em horário comercial, normalmente no mesmo dia útil.</p>
                </div>
              </details>
              <details itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                <summary itemProp="name">Preciso ter as chaves para pedir o orçamento?</summary>
                <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                  <p itemProp="text">Não. Dá para começar a análise antes mesmo da compra — muitos clientes usam essa leitura para decidir o imóvel.</p>
                </div>
              </details>
              <details itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                <summary itemProp="name">E se eu ainda não souber o objetivo?</summary>
                <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                  <p itemProp="text">Sem problema. Marque "Ainda avaliando" e a gente compara com você os cenários de morar, alugar e vender.</p>
                </div>
              </details>
              <details itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                <summary itemProp="name">Moro em outra cidade. Consigo reformar sem ir a São Paulo?</summary>
                <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                  <p itemProp="text">Sim. Vistoria de entrega por procuração, ligação de energia, contratação e instalação da internet, manutenção preventiva e chamados de emergência ficam com a Bewild. Você acompanha a obra pelo Bwild Workflow, de onde estiver, e recebe o imóvel pronto para usar ou anunciar.</p>
                </div>
              </details>
            </div>
          </div>
        </section>

        {/* 05 · CTA FINAL */}
        <section className="dg-final" aria-label="Preencher os dados">
          <div className="dg-shell">
            <p className="dg-label" style={{ justifySelf: "center" }}>Orçamento · 05 · sem custo</p>
            <h2 className="dg-title">Pronto para ver o projeto antes da obra?</h2>
            <p className="dg-lead" style={{ margin: "0 auto" }}>Leva menos de dois minutos. O resto do trabalho é nosso.</p>
            <div className="dg-final-actions">
              <a className="dg-button dg-button-light" data-cta="diagnostico-preencher" href="#dg-ficha">Preencher os dados <span aria-hidden="true">↑</span></a>
              <a className="dg-textlink" href={waUrl} target="_blank" rel="noopener noreferrer">Falar no WhatsApp →</a>
            </div>
            <p className="dg-mono">Atendimento de gente real · retorno rápido · +160 reformas entregues</p>
          </div>
        </section>
      </main>

      <BwaFooter />
    </>
  );
}

function DiagnosticoForm() {
  const [f, setF] = useState<Form>(EMPTY_FORM);
  const [touched, setTouched] = useState<Partial<Record<Campo, boolean>>>({});
  const [showMore, setShowMore] = useState(false);
  // Link do WhatsApp COM os dados do lead — é o fallback quando a entrega
  // não é confirmada (antes o fallback abria uma mensagem genérica).
  const [waLeadUrl, setWaLeadUrl] = useState<string | null>(null);
  const lastPayload = useRef<LeadPayload | null>(null);
  const successRef = useRef<HTMLDivElement | null>(null);
  const { sending, outcome, submit, isMounted } = useLeadSubmit({ method: "diagnostico_form" });

  useEffect(() => {
    const objetivoParam = new URLSearchParams(window.location.search).get("objetivo");
    const objetivo = objetivoParam ? OBJETIVO_QUERY_MAP[objetivoParam] : undefined;
    if (!objetivo) return;
    setF((previous) => ({ ...previous, objetivo }));
    setTouched((previous) => ({ ...previous, objetivo: true }));
  }, []);

  // O formulário some quando há resultado: o foco vai para o aviso, senão
  // ficaria num botão escondido (e o leitor de tela não saberia do envio).
  useEffect(() => {
    if (outcome) successRef.current?.focus();
  }, [outcome]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
  const touch = (k: Campo) => setTouched((t) => ({ ...t, [k]: true }));

  const errors = validar(f);
  const erro = (k: Campo) => (touched[k] ? errors[k] : undefined);

  const messageText = useMemo(
    () =>
      buildLeadMessage("Olá! Quero um orçamento para o meu apartamento.", [
        ["Nome", f.nome],
        ["WhatsApp", f.whats],
        ["E-mail", f.email],
        ["Bairro", f.local],
        ["Chaves", f.chaves],
        ["Objetivo", f.objetivo],
        ["Metragem (m²)", f.metragem],
        ["Mora em SP capital", f.moraSp],
        ["Como conheceu", f.origem],
        ["Planta", f.planta],
        ["Mensagem", f.mensagem],
      ]),
    [f],
  );

  async function enviar(payload: LeadPayload, abrirWhatsapp?: string) {
    const result = await submit(payload, {
      beforeSend: abrirWhatsapp ? () => openWhatsapp(abrirWhatsapp) : undefined,
      handedToWhatsapp: true,
      params: {
        objetivo: payload.objetivo || undefined,
        chaves: payload.chaves || undefined,
        planta: payload.planta || undefined,
        location: payload.location || undefined,
        lead_source: payload.lead_source || undefined,
        lives_in_sp: f.moraSp || undefined,
      },
    });
    // Só limpa o formulário quando o lead chegou: em falha ou timeout os
    // dados continuam no estado para o reenvio e para o link do WhatsApp.
    if (result === "delivered" && isMounted()) {
      setF(EMPTY_FORM);
      setTouched({});
      setShowMore(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    const primeiro = firstInvalidField(CAMPOS, errors);
    if (primeiro) {
      setTouched(touchAll(CAMPOS));
      focusField(CAMPO_ID[primeiro]);
      return;
    }

    // Origem: URL atual → last-touch da sessão → first-touch do visitante.
    // (Antes lia só a URL atual, e quem chegava com UTM na home perdia a
    // origem ao navegar para /diagnostico — 22 de 38 leads sem UTM.)
    const attribution = collectLeadAttribution();
    const payload: LeadPayload = {
      name: f.nome.trim(),
      whatsapp: normalizeBrPhoneDigits(f.whats),
      email: f.email.trim() || null,
      location: f.local.trim() || null,
      // Decimal de verdade ("32,5" → 32.5); `fitLeadPayload` arredonda para a coluna INTEGER.
      area_m2: parseAreaM2(f.metragem),
      objetivo: f.objetivo || null,
      chaves: f.chaves || null,
      planta: f.planta || null,
      message: f.mensagem.trim() || null,
      ...attribution,
      user_agent: browserUserAgent(),
      // Qualificação e atribuição declaradas pelo lead (gravadas em `leads` e enviadas ao CRM).
      lives_in_sp: f.moraSp ? f.moraSp === "Sim" : null,
      lead_source: f.origem || null,
      form_path: "/diagnostico",
    };
    lastPayload.current = payload;

    // WhatsApp abre ANTES de qualquer await (senão o navegador bloqueia o
    // popup); `sendLead` espera a confirmação real (teto de 8 s).
    const url = whatsappHref(messageText);
    setWaLeadUrl(url);
    void enviar(payload, url);
  }

  function reenviar() {
    // Só em falha confirmada (nada gravado): o WhatsApp já foi aberto uma vez.
    if (lastPayload.current && !sending) void enviar(lastPayload.current);
  }

  const badCls = (bad: boolean) => (bad ? " dg-bad" : "");

  return (
    <form
      className={`dg-ficha${outcome ? " dg-sent" : ""}`}
      id="dg-ficha"
      data-ficha
      noValidate
      onSubmit={onSubmit}
      aria-label="Formulário de orçamento"
    >
      <div className="dg-ficha-head">
        <span className="dg-label">Dados do seu apartamento</span>
        <span className="dg-mono">BW—002</span>
      </div>

      <div
        className="dg-success"
        role="status"
        tabIndex={-1}
        ref={successRef}
        data-delivery={outcome === "delivered" ? "confirmed" : outcome === "timedOut" ? "timeout" : "fallback"}
      >
        {outcome === "delivered" && (
          <>
            <strong>Recebemos seus dados.</strong>
            <span>Nosso time vai falar com você no WhatsApp.</span>
          </>
        )}
        {outcome === "failed" && (
          <>
            <strong>Abrimos o WhatsApp com seus dados.</strong>
            <span>
              Não conseguimos registrar os dados pelo site. Envie a mensagem que já está pronta no
              WhatsApp para garantir o atendimento.
            </span>
          </>
        )}
        {outcome === "timedOut" && (
          <>
            <strong>Seus dados podem já ter chegado.</strong>
            <span>
              A confirmação demorou mais que o normal. Para garantir, envie a mensagem que já está
              pronta no WhatsApp — se já tivermos recebido, é só ignorar.
            </span>
          </>
        )}
        {outcome && outcome !== "delivered" && waLeadUrl && (
          <div className="dg-success-actions">
            <a className="dg-textlink" href={waLeadUrl} target="_blank" rel="noopener noreferrer">
              Abrir o WhatsApp de novo
            </a>
            {outcome === "failed" && (
              <button type="button" className="dg-textlink" onClick={reenviar} disabled={sending}>
                {sending ? "Enviando…" : "Tentar enviar de novo"}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="dg-field dg-hidepós">
        <label htmlFor="dg-nome">Nome <span aria-hidden="true">*</span></label>
        <input
          id="dg-nome" name="nome" type="text" placeholder="Como podemos te chamar"
          autoComplete="name" required
          className={badCls(!!erro("nome")).trim()}
          {...fieldErrorProps("dg-nome", erro("nome"))}
          value={f.nome}
          onChange={(e) => set("nome", e.target.value)}
          onBlur={() => touch("nome")}
          maxLength={120}
        />
        {erro("nome") && <span className="dg-field-error" id={fieldErrorId("dg-nome")}>{erro("nome")}</span>}
      </div>

      <div className="dg-row dg-hidepós">
        <div className="dg-field">
          <label htmlFor="dg-whats">WhatsApp <span aria-hidden="true">*</span></label>
          <input
            id="dg-whats" name="whats" type="tel" inputMode="tel" placeholder="(11) 99999-9999"
            autoComplete="tel" required
            className={badCls(!!erro("whats")).trim()}
            {...fieldErrorProps("dg-whats", erro("whats"))}
            value={f.whats}
            onChange={(e) => set("whats", formatBrPhone(e.target.value))}
            onBlur={() => touch("whats")}
          />
          {erro("whats") && <span className="dg-field-error" id={fieldErrorId("dg-whats")}>{erro("whats")}</span>}
        </div>
        <div className="dg-field">
          <label htmlFor="dg-email">E-mail <span className="dg-opt">(opcional)</span></label>
          <input
            id="dg-email" name="email" type="email" placeholder="voce@email.com"
            autoComplete="email"
            className={badCls(!!erro("email")).trim()}
            {...fieldErrorProps("dg-email", erro("email"))}
            value={f.email}
            onChange={(e) => set("email", e.target.value)}
            onBlur={() => touch("email")}
            maxLength={254}
          />
          {erro("email") && <span className="dg-field-error" id={fieldErrorId("dg-email")}>{erro("email")}</span>}
        </div>
      </div>

      <div className="dg-field dg-hidepós">
        <label htmlFor="dg-local">Bairro do imóvel <span aria-hidden="true">*</span></label>
        <input
          id="dg-local" name="local" type="text" placeholder="Ex: Pinheiros, Itaim, Butantã" required
          className={badCls(!!erro("local")).trim()}
          {...fieldErrorProps("dg-local", erro("local"))}
          value={f.local}
          onChange={(e) => set("local", e.target.value)}
          onBlur={() => touch("local")}
          maxLength={120}
        />
        {erro("local") && <span className="dg-field-error" id={fieldErrorId("dg-local")}>{erro("local")}</span>}
      </div>

      <fieldset className="dg-field dg-hidepós" id="dg-chaves" aria-describedby={erro("chaves") ? fieldErrorId("dg-chaves") : undefined}>
        <legend>Já tem as chaves do imóvel? <span aria-hidden="true">*</span></legend>
        <ChipRow
          options={CHAVES} value={f.chaves}
          onChange={(v) => { set("chaves", v); touch("chaves"); }}
        />
        {erro("chaves") && <span className="dg-field-error" id={fieldErrorId("dg-chaves")}>{erro("chaves")}</span>}
      </fieldset>

      <fieldset className="dg-field dg-hidepós" id="dg-objetivo" aria-describedby={erro("objetivo") ? fieldErrorId("dg-objetivo") : undefined}>
        <legend>Objetivo <span aria-hidden="true">*</span></legend>
        <ChipRow
          options={OBJETIVOS} labels={OBJETIVO_LABELS} value={f.objetivo}
          onChange={(v) => { set("objetivo", v); touch("objetivo"); }}
        />
        {erro("objetivo") && <span className="dg-field-error" id={fieldErrorId("dg-objetivo")}>{erro("objetivo")}</span>}
      </fieldset>

      <div className="dg-field dg-hidepós">
        <label htmlFor="dg-m2">Metragem (m²) <span aria-hidden="true">*</span> <span className="dg-opt">(aproximada serve)</span></label>
        <input
          id="dg-m2" name="metragem" type="text" inputMode="decimal" placeholder="32" required
          className={badCls(!!erro("metragem")).trim()}
          {...fieldErrorProps("dg-m2", erro("metragem"))}
          value={f.metragem}
          onChange={(e) => set("metragem", sanitizeAreaInput(e.target.value))}
          onBlur={() => touch("metragem")}
        />
        {erro("metragem") && <span className="dg-field-error" id={fieldErrorId("dg-m2")}>{erro("metragem")}</span>}
      </div>

      <fieldset className="dg-field dg-hidepós" id="dg-morasp" aria-describedby={erro("moraSp") ? fieldErrorId("dg-morasp") : undefined}>
        <legend>Você mora em São Paulo capital? <span aria-hidden="true">*</span></legend>
        <ChipRow
          options={MORA_SP} value={f.moraSp}
          onChange={(v) => { set("moraSp", v); touch("moraSp"); }}
        />
        {f.moraSp === "Não" && (
          <span className="dg-mono">Sem problema: a Bewild faz a vistoria por procuração, liga energia e internet, e você acompanha pelo Bwild Workflow.</span>
        )}
        {erro("moraSp") && <span className="dg-field-error" id={fieldErrorId("dg-morasp")}>{erro("moraSp")}</span>}
      </fieldset>

      <fieldset className="dg-field dg-hidepós" id="dg-origem" aria-describedby={erro("origem") ? fieldErrorId("dg-origem") : undefined}>
        <legend>Como conheceu a Bewild? <span aria-hidden="true">*</span></legend>
        <ChipRow
          options={ORIGENS} value={f.origem}
          onChange={(v) => { set("origem", v); touch("origem"); }}
        />
        {erro("origem") && <span className="dg-field-error" id={fieldErrorId("dg-origem")}>{erro("origem")}</span>}
      </fieldset>

      <button
        type="button"
        className="dg-textlink dg-more dg-hidepós"
        data-more
        aria-expanded={showMore}
        onClick={() => setShowMore((s) => !s)}
      >
        {showMore ? "− Menos detalhes" : "+ Mais detalhes (opcional)"}
      </button>

      {showMore && (
        <div className="dg-hidepós" data-more-panel>
          <fieldset className="dg-field">
            <legend>Tem planta do imóvel?</legend>
            <ChipRow options={PLANTA} value={f.planta} onChange={(v) => set("planta", v)} />
          </fieldset>
          <div className="dg-field" style={{ marginTop: 14 }}>
            <label htmlFor="dg-msg">Mensagem</label>
            <textarea id="dg-msg" name="mensagem" maxLength={1000}
              value={f.mensagem} onChange={(e) => set("mensagem", e.target.value)} />
          </div>
        </div>
      )}

      {/* Habilitado mesmo com campos pendentes: o clique mostra TODOS os erros
          e leva o foco ao primeiro. Desabilitado só durante o envio. */}
      <button type="submit" className="dg-button dg-hidepós" data-cta="diagnostico-solicitar-orcamento" disabled={sending}>
        {sending ? "Enviando…" : "Solicitar orçamento"} <span aria-hidden="true">→</span>
      </button>
      <p className="dg-ficha-note dg-hidepós">Sem compromisso · a gente só te chama no WhatsApp</p>
    </form>
  );
}

function ChipRow({ options, value, onChange, labels }: {
  options: readonly string[]; value: string; onChange: (v: string) => void; labels?: Record<string, string>;
}) {
  return (
    <div className="dg-chips" data-chips>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            className="dg-chip"
            aria-pressed={active}
            onClick={() => onChange(active ? "" : opt)}
          >
            {labels?.[opt] ?? opt}
          </button>
        );
      })}
    </div>
  );
}

/** Guarda de foco invisível: ao receber foco, devolve-o para dentro do diálogo.
 *  Funciona também com os controles nativos do <video>, que ficam em shadow DOM
 *  e não aparecem num querySelectorAll. */
const FOCUS_GUARD_STYLE: React.CSSProperties = {
  position: "fixed", top: 1, left: 1, width: 1, height: 0, padding: 0, overflow: "hidden",
};

function TestimonialCard({ waUrl }: { waUrl: string }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  function handleOpen() {
    trackEvent("play_depoimento", { page: "diagnostico", cliente: "vivian" });
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    // O diálogo já está no DOM (efeito roda após o commit): foco para dentro.
    closeBtnRef.current?.focus();
    videoRef.current?.play().catch(() => {});
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      // Devolve o foco a quem abriu o modal.
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <aside className="dg-testi" aria-label="Depoimento em vídeo de cliente">
        <button
          ref={triggerRef}
          type="button"
          className="dg-testithumb"
          onClick={handleOpen}
          aria-label="Assistir depoimento em vídeo de Vivian"
          aria-haspopup="dialog"
        >
          {/* Conforme nota do mockup: em produção entra o vídeo real (muted,
              preload=metadata) no lugar da <img> poster. */}
          <video src={depoimentoVideo.url} muted playsInline preload="metadata" tabIndex={-1} aria-hidden="true" />
        </button>
        <div className="dg-testimeta">
          <p className="dg-mono">Depoimento</p>
          <p className="dg-testiname">Vivian</p>
          <p className="dg-testirole">cliente Bewild · depoimento gravado sem roteiro</p>
          <a className="dg-textlink" href={waUrl} target="_blank" rel="noopener noreferrer">
            Prefiro falar com um especialista →
          </a>
        </div>
      </aside>

      {open && (
        <div
          className="dg-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Depoimento em vídeo de Vivian"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          {/* Tab/Shift+Tab ficam presos no diálogo: as guardas das pontas
              mandam o foco para o outro extremo. */}
          <div
            tabIndex={0}
            style={FOCUS_GUARD_STYLE}
            onFocus={() => {
              videoRef.current?.focus();
              if (document.activeElement !== videoRef.current) closeBtnRef.current?.focus();
            }}
          />
          <div className="dg-modal-inner">
            <button
              ref={closeBtnRef}
              type="button"
              className="dg-modal-close"
              onClick={() => setOpen(false)}
              aria-label="Fechar vídeo"
            >
              ✕
            </button>
            <video
              ref={videoRef}
              src={depoimentoVideo.url}
              controls
              playsInline
              autoPlay
              tabIndex={0}
              className="dg-modal-video"
            />
          </div>
          <div tabIndex={0} style={FOCUS_GUARD_STYLE} onFocus={() => closeBtnRef.current?.focus()} />
        </div>
      )}
    </>
  );
}
