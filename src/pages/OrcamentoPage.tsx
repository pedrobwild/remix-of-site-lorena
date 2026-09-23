import { useEffect, useRef, useState } from "react";
import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { CONTACT, whatsappHref } from "@/components/landing/content";
import type { LeadPayload } from "@/lib/leadDelivery";
import {
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
  type LeadObjetivo,
} from "@/lib/leadForm";
import { formatBrPhone, isValidBrPhone, normalizeBrPhoneDigits } from "@/lib/phone";
import { useCtaClickTracking } from "@/lib/trackCta";
import {
  browserUserAgent,
  collectLeadAttribution,
  focusField,
  useLeadSubmit,
} from "@/lib/useLeadSubmit";
import { breadcrumbJsonLd, useSeo } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";
import "./contato.css";

/**
 * O VALOR enviado é o canônico do CRM (o mesmo de /diagnostico); o rótulo é
 * o texto amigável desta página. Antes o valor era o próprio rótulo
 * ("Morar", "Short stay (curta temporada)") e o CRM não agrupava os leads.
 */
const OBJETIVOS: ReadonlyArray<{ value: LeadObjetivo; label: string }> = [
  { value: "Moradia", label: "Morar" },
  { value: "Short stay", label: "Short stay (curta temporada)" },
  { value: "Locação tradicional", label: "Locação tradicional" },
  { value: "Uso misto", label: "Uso misto" },
  { value: "Ainda avaliando", label: "Ainda avaliando" },
];

type Campo = "nome" | "whats" | "mail" | "bairro" | "area";
const CAMPOS: readonly Campo[] = ["nome", "whats", "mail", "bairro", "area"];
const CAMPO_ID: Record<Campo, string> = {
  nome: "orc-nome",
  whats: "orc-whats",
  mail: "orc-mail",
  bairro: "orc-bairro",
  area: "orc-area",
};

function validar(v: Record<Campo, string>): FieldErrors<Campo> {
  const e: FieldErrors<Campo> = {};
  if (v.nome.trim().length < 2) e.nome = "Informe seu nome.";
  if (!isValidBrPhone(v.whats)) e.whats = "Informe um número com DDD.";
  if (v.mail.trim() && !isValidEmail(v.mail)) e.mail = "Confira o e-mail digitado.";
  if (v.bairro.trim().length < 2) e.bairro = "Informe o bairro.";
  if (v.area.trim() && !isValidAreaM2(parseAreaM2(v.area))) {
    e.area = "Informe a metragem em números (ex.: 28 ou 32,5).";
  }
  return e;
}

/**
 * OrcamentoPage — /orcamento
 *
 * Página real de pedido de orçamento. O formulário entrega no mesmo canal
 * do /contato (edge function `notify-lead`, via `sendLead`), marcado com
 * `form_path: "/orcamento"`; `landing_path` segue a atribuição da sessão.
 */
export default function OrcamentoPage() {
  useCtaClickTracking("orcamento");
  const { settings } = useSiteSettings();
  const email = settings?.contact_email || CONTACT.email;

  const [nome, setNome] = useState("");
  const [whats, setWhats] = useState("");
  const [mail, setMail] = useState("");
  const [bairro, setBairro] = useState("");
  const [area, setArea] = useState("");
  const [objetivo, setObjetivo] = useState<LeadObjetivo | "">("");
  const [mensagem, setMensagem] = useState("");
  const [touched, setTouched] = useState<Partial<Record<Campo, boolean>>>({});
  // WhatsApp com os dados do pedido — saída quando a entrega não é confirmada.
  const [whatsLink, setWhatsLink] = useState<string | null>(null);
  const resultadoRef = useRef<HTMLDivElement | null>(null);
  const { sending: enviando, outcome, submit } = useLeadSubmit({ method: "orcamento_form" });

  const errors = validar({ nome, whats, mail, bairro, area });
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

    setWhatsLink(
      whatsappHref(
        buildLeadMessage("Olá! Quero um orçamento de reforma para o meu apartamento.", [
          ["Nome", nome],
          ["WhatsApp", whats],
          ["E-mail", mail],
          ["Bairro", bairro],
          ["Metragem (m²)", area],
          ["Objetivo", objetivo],
          ["Detalhes", mensagem],
        ]),
      ),
    );

    const payload: LeadPayload = {
      name: nome.trim(),
      whatsapp: normalizeBrPhoneDigits(whats),
      email: mail.trim() || null,
      message: mensagem.trim() || null,
      location: bairro.trim(),
      // Decimal de verdade ("32,5" → 32.5); `fitLeadPayload` arredonda para a coluna INTEGER.
      area_m2: area.trim() ? parseAreaM2(area) : null,
      objetivo: objetivo || null,
      chaves: null,
      planta: null,
      ...collectLeadAttribution(),
      user_agent: browserUserAgent(),
      form_path: "/orcamento",
    };

    void submit(payload, {
      params: { objetivo: objetivo || undefined, location: bairro.trim() || undefined },
    });
  }

  useSeo({
    title: "Orçamento de projeto de arquitetura e reforma em SP | Bewild",
    description:
      "Peça o orçamento de arquitetura, engenharia e reforma do seu studio ou apartamento em São Paulo e receba faixa de custo e prazo: projeto, obra, marcenaria e mobília em um contrato fechado.",
    keywords:
      "orçamento de projeto de arquitetura, quanto custa um projeto de arquitetura em São Paulo, orçamento de reforma de studio, quanto custa reformar um studio em São Paulo, custo de reforma de studio, prazo de reforma de studio, orçamento de reforma de apartamento, orçamento de reforma em SP, preço e prazo de reforma São Paulo, reforma de studio para short stay, Bewild",
    canonicalPath: "/orcamento",
    ogType: "website",
    jsonLd: settings
      ? [
          breadcrumbJsonLd(settings, [
            { name: "Início", path: "/" },
            { name: "Orçamento", path: "/orcamento" },
          ]),
        ]
      : undefined,
  });

  const primeiroNome = nome.trim().split(" ")[0];

  return (
    <div className="bwa-contact-page">
      <BwaNav />

      <main id="main" tabIndex={-1}>
        <section className="bwa-contact-intro">
          <div className="bwa-shell bwa-contact-intro-grid">
            <div>
              <p className="bwa-label">Orçamento · São Paulo</p>
              <h1>Orçamento de reforma de apartamento em SP.</h1>
            </div>
            <p className="bwa-contact-lead">
              Conte o essencial sobre o imóvel e devolvemos uma faixa de investimento e prazo para
              a reforma completa — projeto, obra, marcenaria e mobília em um único contrato.
            </p>
          </div>
        </section>

        <section className="bwa-contact-form-sec" id="formulario">
          <div className="bwa-shell bwa-contact-form-grid">
            <div className="bwa-contact-form-intro">
              <p className="bwa-label">Pedido de orçamento</p>
              <h2>Preencha em um minuto. Respondemos pelo WhatsApp.</h2>
              <p>
                Sem custo e sem compromisso. Se preferir conversar antes, fale com a gente agora ou
                use os canais da <a href="/contato">página de contato</a>.
              </p>
              <a
                className="bwa-contact-link"
                href={whatsappHref("Olá, quero um orçamento de reforma para meu apartamento")}
                target="_blank"
                rel="noopener noreferrer"
                data-cta="orcamento-whatsapp"
              >
                Falar no WhatsApp <span aria-hidden="true">↗</span>
              </a>
              <p>
                Prefere e-mail? <a href={`mailto:${email}`}>{email}</a>
              </p>
            </div>

            {outcome === "delivered" ? (
              <div className="bwa-contact-form-done" role="status" tabIndex={-1} ref={resultadoRef}>
                <p className="bwa-label">Pedido recebido</p>
                <h3>Obrigado, {primeiroNome}.</h3>
                <p>
                  Nosso time analisa as informações do apartamento e responde pelo WhatsApp
                  informado. Se quiser adiantar, fale com a gente agora mesmo.
                </p>
                <a
                  className="bwa-button"
                  href={whatsappHref("Olá, acabei de pedir um orçamento pelo site da Bewild")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Falar no WhatsApp <span aria-hidden="true">→</span>
                </a>
              </div>
            ) : outcome === "timedOut" ? (
              <div className="bwa-contact-form-done" role="status" tabIndex={-1} ref={resultadoRef}>
                <p className="bwa-label">Envio sem confirmação</p>
                <h3>Seu pedido pode já ter chegado, {primeiroNome}.</h3>
                <p>
                  A confirmação demorou mais que o normal. Para garantir, mande o pedido pelo
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
              <form className="bwa-contact-form" onSubmit={enviar} noValidate aria-label="Pedido de orçamento">
                <div className="bwa-contact-field">
                  <label htmlFor="orc-nome">Nome</label>
                  <input
                    id="orc-nome"
                    type="text"
                    value={nome}
                    maxLength={120}
                    autoComplete="name"
                    required
                    onChange={(e) => setNome(e.target.value)}
                    onBlur={() => touch("nome")}
                    {...fieldErrorProps("orc-nome", erro("nome"))}
                  />
                  {erro("nome") && <em id={fieldErrorId("orc-nome")}>{erro("nome")}</em>}
                </div>

                <div className="bwa-contact-field">
                  <label htmlFor="orc-whats">WhatsApp</label>
                  <input
                    id="orc-whats"
                    type="tel"
                    inputMode="tel"
                    value={whats}
                    autoComplete="tel"
                    placeholder="(11) 90000-0000"
                    required
                    onChange={(e) => setWhats(formatBrPhone(e.target.value))}
                    onBlur={() => touch("whats")}
                    {...fieldErrorProps("orc-whats", erro("whats"))}
                  />
                  {erro("whats") && <em id={fieldErrorId("orc-whats")}>{erro("whats")}</em>}
                </div>

                <div className="bwa-contact-field">
                  <label htmlFor="orc-mail">E-mail (opcional)</label>
                  <input
                    id="orc-mail"
                    type="email"
                    value={mail}
                    maxLength={180}
                    autoComplete="email"
                    onChange={(e) => setMail(e.target.value)}
                    onBlur={() => touch("mail")}
                    {...fieldErrorProps("orc-mail", erro("mail"))}
                  />
                  {erro("mail") && <em id={fieldErrorId("orc-mail")}>{erro("mail")}</em>}
                </div>

                <div className="bwa-contact-field">
                  <label htmlFor="orc-bairro">Bairro do apartamento</label>
                  <input
                    id="orc-bairro"
                    type="text"
                    value={bairro}
                    maxLength={120}
                    placeholder="Vila Olímpia, São Paulo-SP"
                    required
                    onChange={(e) => setBairro(e.target.value)}
                    onBlur={() => touch("bairro")}
                    {...fieldErrorProps("orc-bairro", erro("bairro"))}
                  />
                  {erro("bairro") && <em id={fieldErrorId("orc-bairro")}>{erro("bairro")}</em>}
                </div>

                <div className="bwa-contact-field">
                  <label htmlFor="orc-area">Metragem (m²)</label>
                  <input
                    id="orc-area"
                    type="text"
                    inputMode="decimal"
                    value={area}
                    maxLength={7}
                    placeholder="28"
                    onChange={(e) => setArea(sanitizeAreaInput(e.target.value))}
                    onBlur={() => touch("area")}
                    {...fieldErrorProps("orc-area", erro("area"))}
                  />
                  {erro("area") && <em id={fieldErrorId("orc-area")}>{erro("area")}</em>}
                </div>

                <div className="bwa-contact-field">
                  <label htmlFor="orc-objetivo">Objetivo da reforma</label>
                  <select
                    id="orc-objetivo"
                    value={objetivo}
                    onChange={(e) => setObjetivo(e.target.value as LeadObjetivo | "")}
                  >
                    <option value="">Selecione</option>
                    {OBJETIVOS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bwa-contact-field bwa-contact-field--full">
                  <label htmlFor="orc-mensagem">Detalhes (opcional)</label>
                  <textarea
                    id="orc-mensagem"
                    rows={4}
                    value={mensagem}
                    maxLength={1200}
                    placeholder="Conte o estado do imóvel, prazo desejado e o que não pode faltar."
                    onChange={(e) => setMensagem(e.target.value)}
                  />
                </div>

                {outcome === "failed" && !enviando && (
                  <div className="bwa-contact-form-error" role="alert">
                    <p>
                      Não conseguimos enviar seu pedido agora. Tente de novo ou mande pelo WhatsApp —
                      a mensagem já vai com os seus dados.
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
                    data-cta="orcamento-enviar"
                    disabled={enviando}
                  >
                    {enviando ? "Enviando…" : outcome === "failed" ? "Tentar de novo" : "Pedir orçamento"}
                    <span aria-hidden="true">→</span>
                  </button>
                  <p>Seus dados são usados apenas para responder ao seu pedido de orçamento.</p>
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
