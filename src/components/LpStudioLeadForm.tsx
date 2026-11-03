/**
 * Formulário da LP /lp/reforma-de-studio-sao-paulo (handoff de 02/11/2026,
 * seção 2). Mesmo pipeline do /orcamento (useLeadSubmit → notify-lead →
 * Lead no Meta / conversão do Google Ads): grava com `form_path: "/orcamento"`
 * (a edge function só aceita formulários conhecidos e todos os relatórios do
 * painel filtram por esse valor) e marca a origem em `lead_source` e na
 * mensagem; `landing_path` da atribuição já guarda a URL da LP.
 *
 * Objetivo é obrigatório: só uma escolha explícita decide se o lead é de
 * investidor, e só esses viram conversão do Google Ads (reportLead). A
 * conversão sai no SUCESSO (useLeadSubmit só conta lead entregue ou com
 * entrega não confirmada), nunca no clique.
 */
import { useEffect, useRef, useState } from "react";
import FormPrivacyNote from "@/components/FormPrivacyNote";
import { whatsappHref } from "@/components/landing/content";
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
import { browserUserAgent, collectLeadAttribution, focusField, useLeadSubmit } from "@/lib/useLeadSubmit";
import { LP_FORM_PROMESSA, LP_FORM_SUCESSO, LP_PATH, type LpVariante } from "@/content/pages/lp-reforma-de-studio-sao-paulo";

type Campo = "nome" | "whats" | "mail" | "bairro" | "area" | "objetivo";
/** Ordem visual: é a ordem em que o primeiro erro recebe o foco. */
const CAMPOS: readonly Campo[] = ["nome", "whats", "mail", "bairro", "area", "objetivo"];
const id = (c: Campo) => `lp-${c}`;

/** Rótulo da LP → valor canônico do CRM (LEAD_OBJETIVOS). */
const OBJETIVOS: ReadonlyArray<{ value: LeadObjetivo; label: string }> = [
  { value: "Short stay", label: "Airbnb / short stay" },
  { value: "Locação tradicional", label: "Locação longa" },
  { value: "Moradia", label: "Morar" },
];

/** Rótulo da LP → valor canônico de `chaves` (LEAD_CHAVES) e nota em `planta`. */
const CHAVES: ReadonlyArray<{ value: "Sim" | "Ainda não"; label: string; planta: string | null }> = [
  { value: "Sim", label: "Sim", planta: null },
  { value: "Ainda não", label: "Não, comprei na planta", planta: "Comprei na planta" },
];

export const LP_LEAD_SOURCE = "lp-google-ads-studio";

function validar(v: Record<Campo, string>): FieldErrors<Campo> {
  const e: FieldErrors<Campo> = {};
  if (v.nome.trim().length < 2) e.nome = "Informe seu nome.";
  if (!isValidBrPhone(v.whats)) e.whats = "Informe um número com DDD.";
  if (!v.mail.trim()) e.mail = "Informe seu e-mail.";
  else if (!isValidEmail(v.mail)) e.mail = "Confira o e-mail digitado.";
  if (v.area.trim() && !isValidAreaM2(parseAreaM2(v.area))) e.area = "Informe a metragem em m² (ex.: 27).";
  if (!v.objetivo) e.objetivo = "Escolha o que você quer fazer com o studio.";
  return e;
}

export default function LpStudioLeadForm({ variante }: { variante: LpVariante }) {
  const [v, setV] = useState<Record<Campo, string>>({ nome: "", whats: "", mail: "", bairro: "", area: "", objetivo: "" });
  const [chaves, setChaves] = useState<(typeof CHAVES)[number] | null>(null);
  const [touched, setTouched] = useState<Partial<Record<Campo, boolean>>>({});
  const [done, setDone] = useState<"delivered" | "timedOut" | null>(null);
  const [whatsLink, setWhatsLink] = useState<string | null>(null);
  const doneRef = useRef<HTMLDivElement | null>(null);
  const { sending, outcome, submit, isMounted } = useLeadSubmit({ method: "lp_google_ads_studio" });

  const errors = validar(v);
  const erro = (k: Campo) => (touched[k] ? errors[k] : undefined);
  const set = (k: Campo, val: string) => setV((s) => ({ ...s, [k]: val }));
  const touch = (k: Campo) => setTouched((t) => ({ ...t, [k]: true }));

  useEffect(() => {
    if (done) doneRef.current?.focus();
  }, [done]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    const primeiro = firstInvalidField(CAMPOS, errors);
    if (primeiro) {
      setTouched(touchAll(CAMPOS));
      focusField(id(primeiro));
      return;
    }
    const objetivo = v.objetivo as LeadObjetivo;
    const area = v.area.trim() ? parseAreaM2(v.area) : null;
    const objetivoLabel = OBJETIVOS.find((o) => o.value === objetivo)?.label ?? objetivo;

    setWhatsLink(
      whatsappHref(
        buildLeadMessage("Olá! Quero um orçamento de reforma de studio em São Paulo.", [
          ["Nome", v.nome],
          ["WhatsApp", v.whats],
          ["E-mail", v.mail],
          ["Bairro ou endereço", v.bairro],
          ["Metragem (m²)", v.area],
          ["Objetivo", objetivoLabel],
          ["Já tem as chaves?", chaves?.label],
        ]),
      ),
    );

    const payload: LeadPayload = {
      name: v.nome.trim().slice(0, 120),
      whatsapp: normalizeBrPhoneDigits(v.whats),
      email: v.mail.trim().slice(0, 254),
      location: v.bairro.trim().slice(0, 160) || null,
      area_m2: area,
      objetivo,
      chaves: chaves?.value ?? null,
      planta: chaves?.planta ?? null,
      // A variante do topo (palavra-chave do anúncio) não tem coluna no CRM; vai na mensagem.
      message: `Pedido pela LP de anúncios de reforma de studio (${LP_PATH}) · topo "${variante}"`,
      ...collectLeadAttribution(),
      user_agent: browserUserAgent(),
      lead_source: LP_LEAD_SOURCE,
      form_path: "/orcamento",
    };
    const resultado = await submit(payload, { params: { objetivo, location: v.bairro.trim() || undefined, variante } });
    if (isMounted() && (resultado === "delivered" || resultado === "timedOut")) setDone(resultado);
  }

  if (done === "delivered") {
    return (
      <div className="bwa-form-success" role="status" tabIndex={-1} ref={doneRef}>
        <strong>Pedido recebido.</strong>
        <p>{LP_FORM_SUCESSO}</p>
      </div>
    );
  }

  if (done === "timedOut") {
    return (
      <div className="bwa-form-success" role="status" tabIndex={-1} ref={doneRef}>
        <strong>Seu pedido pode já ter chegado.</strong>
        <p>
          A confirmação demorou mais que o normal. Para garantir, mande o pedido pelo WhatsApp — a mensagem já vai
          com os seus dados. Se já tivermos recebido, é só ignorar.
        </p>
        {whatsLink && (
          <a className="bwa-button bwa-button-light bwa-lp-form-submit" href={whatsLink} target="_blank" rel="noopener noreferrer">
            Enviar pelo WhatsApp <span aria-hidden="true">→</span>
          </a>
        )}
      </div>
    );
  }

  const falhou = outcome === "failed" && !sending;

  const campo = (k: Campo, label: string, input: React.ReactNode, req = true) => (
    <div className="bwa-form-field">
      <label htmlFor={id(k)}>
        {label}
        {req ? <span className="bwa-form-req" aria-hidden="true"> *</span> : <span className="bwa-form-opt">opcional</span>}
      </label>
      {input}
      {erro(k) && (
        <p className="bwa-form-error" id={fieldErrorId(id(k))} role="alert">
          {erro(k)}
        </p>
      )}
    </div>
  );

  return (
    <form className="bwa-form bwa-lp-form" onSubmit={onSubmit} noValidate aria-label="Pedido de orçamento da reforma do studio">
      <p className="bwa-lp-form-promessa">{LP_FORM_PROMESSA}</p>

      {campo(
        "nome",
        "Nome",
        <input id={id("nome")} type="text" autoComplete="name" maxLength={120} value={v.nome}
          className={erro("nome") ? "bad" : undefined}
          onChange={(e) => set("nome", e.target.value)} onBlur={() => touch("nome")}
          {...fieldErrorProps(id("nome"), erro("nome"))} />,
      )}
      {campo(
        "whats",
        "WhatsApp",
        <input id={id("whats")} type="tel" inputMode="tel" autoComplete="tel" placeholder="(11) 99999-9999" value={v.whats}
          className={erro("whats") ? "bad" : undefined}
          onChange={(e) => set("whats", formatBrPhone(e.target.value))} onBlur={() => touch("whats")}
          {...fieldErrorProps(id("whats"), erro("whats"))} />,
      )}
      {campo(
        "mail",
        "E-mail",
        <input id={id("mail")} type="email" inputMode="email" autoComplete="email" maxLength={254} value={v.mail}
          className={erro("mail") ? "bad" : undefined}
          onChange={(e) => set("mail", e.target.value)} onBlur={() => touch("mail")}
          {...fieldErrorProps(id("mail"), erro("mail"))} />,
      )}
      <div className="bwa-form-row">
        {campo(
          "bairro",
          "Bairro ou endereço",
          <input id={id("bairro")} type="text" autoComplete="off" maxLength={160} placeholder="Ex.: Rua Augusta, Consolação" value={v.bairro}
            onChange={(e) => set("bairro", e.target.value)} />,
          false,
        )}
        {campo(
          "area",
          "Metragem",
          <input id={id("area")} type="text" inputMode="numeric" placeholder="Ex.: 27 m²" value={v.area}
            className={erro("area") ? "bad" : undefined}
            onChange={(e) => set("area", sanitizeAreaInput(e.target.value))} onBlur={() => touch("area")}
            {...fieldErrorProps(id("area"), erro("area"))} />,
          false,
        )}
      </div>

      <fieldset className="bwa-form-field bwa-lp-fieldset" id={id("objetivo")} aria-describedby={erro("objetivo") ? fieldErrorId(id("objetivo")) : undefined}>
        <legend>
          Objetivo<span className="bwa-form-req" aria-hidden="true"> *</span>
        </legend>
        <div className="bwa-chip-row" role="group" aria-label="Objetivo do studio">
          {OBJETIVOS.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`bwa-chip${v.objetivo === o.value ? " sel" : ""}`}
              aria-pressed={v.objetivo === o.value}
              onClick={() => {
                set("objetivo", o.value);
                touch("objetivo");
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
        {erro("objetivo") && (
          <p className="bwa-form-error" id={fieldErrorId(id("objetivo"))} role="alert">
            {erro("objetivo")}
          </p>
        )}
      </fieldset>

      <fieldset className="bwa-form-field bwa-lp-fieldset">
        <legend>
          Já tem as chaves?<span className="bwa-form-opt">opcional</span>
        </legend>
        <div className="bwa-chip-row" role="group" aria-label="Já tem as chaves do imóvel?">
          {CHAVES.map((c) => (
            <button
              key={c.value}
              type="button"
              className={`bwa-chip${chaves?.value === c.value ? " sel" : ""}`}
              aria-pressed={chaves?.value === c.value}
              onClick={() => setChaves(c)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </fieldset>

      {falhou && (
        <p className="bwa-form-error bwa-lp-form-falha" role="alert">
          Não conseguimos enviar agora. Tente de novo ou{" "}
          <a href={whatsLink ?? whatsappHref("Olá! Quero um orçamento de reforma de studio em São Paulo.")} target="_blank" rel="noopener noreferrer">
            mande pelo WhatsApp
          </a>
          .
        </p>
      )}

      <button type="submit" className="bwa-button bwa-lp-form-submit" disabled={sending} data-cta="lp-studio-form">
        {sending ? "Enviando…" : "Receber orçamento"} <span aria-hidden="true">→</span>
      </button>

      <FormPrivacyNote platforms="meta-google" className="bwa-lp-form-privacidade">
        Seus dados ficam só com a Bewild, para responder o pedido.
      </FormPrivacyNote>
    </form>
  );
}
