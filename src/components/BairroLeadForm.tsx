/**
 * Formulário de orçamento das páginas de bairro (/reforma/<bairro>).
 * Mesmo pipeline do /orcamento (useLeadSubmit → notify-lead → Lead no
 * Meta/Google): grava com form_path "/orcamento", o bairro em `location` e
 * a página de origem no `landing_path` da atribuição.
 */
import { useEffect, useRef, useState } from "react";
import type { LeadPayload } from "@/lib/leadDelivery";
import {
  fieldErrorId,
  fieldErrorProps,
  firstInvalidField,
  isValidEmail,
  touchAll,
  type FieldErrors,
} from "@/lib/leadForm";
import { formatBrPhone, isValidBrPhone, normalizeBrPhoneDigits } from "@/lib/phone";
import { browserUserAgent, collectLeadAttribution, focusField, useLeadSubmit } from "@/lib/useLeadSubmit";
import { whatsappHref } from "@/components/landing/content";
import FormPrivacyNote from "@/components/FormPrivacyNote";
import "@/styles/bairro-form.css";

type Campo = "nome" | "whats" | "email" | "area";
const CAMPOS: readonly Campo[] = ["nome", "whats", "email", "area"];
const id = (c: Campo) => `bf-${c}`;

function validar(v: Record<Campo, string>): FieldErrors<Campo> {
  const e: FieldErrors<Campo> = {};
  if (v.nome.trim().length < 2) e.nome = "Informe seu nome.";
  if (!isValidBrPhone(v.whats)) e.whats = "Informe um telefone com DDD.";
  if (!isValidEmail(v.email)) e.email = v.email.trim() ? "Confira o e-mail digitado." : "Informe seu e-mail.";
  if (v.area.trim()) {
    const n = Number(v.area);
    if (!Number.isInteger(n) || n < 10 || n > 1000) e.area = "Use um número entre 10 e 1000.";
  }
  return e;
}

export default function BairroLeadForm({ bairro }: { bairro: string }) {
  const [v, setV] = useState<Record<Campo, string>>({ nome: "", whats: "", email: "", area: "" });
  const [touched, setTouched] = useState<Partial<Record<Campo, boolean>>>({});
  const [done, setDone] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const { sending, outcome, submit, isMounted } = useLeadSubmit({ method: "pagina_bairro" });

  const errors = validar(v);
  const erro = (k: Campo) => (touched[k] ? errors[k] : undefined);
  const set = (k: Campo, val: string) => setV((s) => ({ ...s, [k]: val }));

  useEffect(() => {
    if (done) boxRef.current?.focus();
  }, [done]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    const primeiro = firstInvalidField(CAMPOS, errors);
    if (primeiro) {
      setTouched(touchAll(CAMPOS));
      focusField(id(primeiro));
      return;
    }
    const area = v.area.trim() ? Number(v.area) : null;
    const payload: LeadPayload = {
      name: v.nome.trim().slice(0, 120),
      whatsapp: normalizeBrPhoneDigits(v.whats),
      email: v.email.trim().slice(0, 254) || null,
      location: bairro,
      area_m2: area,
      objetivo: null,
      chaves: null,
      planta: null,
      message: `Pedido de orçamento pela página de reformas em ${bairro}`,
      ...collectLeadAttribution(),
      user_agent: browserUserAgent(),
      lead_source: "pagina-bairro",
      form_path: "/orcamento",
    };
    const result = await submit(payload, { params: { location: bairro } });
    if (result && isMounted()) setDone(true);
  };

  if (done) {
    const ok = outcome === "delivered";
    return (
      <div className="bf-card" tabIndex={-1} ref={boxRef} role="status">
        <h3 className="bf-title">{ok ? "Recebemos seu pedido." : "Não confirmamos o envio."}</h3>
        <p className="bf-text">
          {ok
            ? "Em breve a equipe da Bewild fala com você pelo WhatsApp."
            : "Para garantir, mande seus dados pelo WhatsApp — se já tivermos recebido, é só ignorar."}
        </p>
        {!ok && (
          <a
            className="bwh-btn bwh-btn--invert"
            href={whatsappHref(`Olá! Quero um orçamento de reforma em ${bairro}. Me chamo ${v.nome.trim()}.`)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Enviar pelo WhatsApp <span className="bwh-ar">→</span>
          </a>
        )}
      </div>
    );
  }

  const field = (k: Campo, label: string, input: React.ReactNode, req = true) => (
    <div className="bf-fld">
      <label htmlFor={id(k)}>
        {label} {req ? <span aria-hidden="true">*</span> : <span className="bf-opt">(opcional)</span>}
      </label>
      {input}
      {erro(k) && (
        <p className="bf-err" id={fieldErrorId(id(k))}>
          {erro(k)}
        </p>
      )}
    </div>
  );

  return (
    <form className="bf-card" onSubmit={onSubmit} noValidate aria-label={`Orçamento de reforma em ${bairro}`}>
      <h3 className="bf-title">Peça um orçamento para seu imóvel em {bairro}</h3>
      <div className="bf-grid">
        {field(
          "nome",
          "Nome",
          <input id={id("nome")} type="text" autoComplete="name" maxLength={120} value={v.nome}
            onChange={(e) => set("nome", e.target.value)} onBlur={() => setTouched((t) => ({ ...t, nome: true }))}
            {...fieldErrorProps(id("nome"), erro("nome"))} />,
        )}
        {field(
          "whats",
          "WhatsApp",
          <input id={id("whats")} type="tel" inputMode="tel" autoComplete="tel" placeholder="(11) 99999-9999" value={v.whats}
            onChange={(e) => set("whats", formatBrPhone(e.target.value))} onBlur={() => setTouched((t) => ({ ...t, whats: true }))}
            {...fieldErrorProps(id("whats"), erro("whats"))} />,
        )}
        {field(
          "email",
          "E-mail",
          <input id={id("email")} type="email" inputMode="email" autoComplete="email" maxLength={254} value={v.email}
            onChange={(e) => set("email", e.target.value)} onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            {...fieldErrorProps(id("email"), erro("email"))} />,
        )}
        {field(
          "area",
          "Metragem (m²)",
          <input id={id("area")} type="number" inputMode="numeric" min={10} max={1000} value={v.area}
            onChange={(e) => set("area", e.target.value)} onBlur={() => setTouched((t) => ({ ...t, area: true }))}
            {...fieldErrorProps(id("area"), erro("area"))} />,
          false,
        )}
      </div>
      <button type="submit" className="bwh-btn bwh-btn--invert" disabled={sending}>
        {sending ? "Enviando…" : "Solicitar orçamento"} <span className="bwh-ar">→</span>
      </button>
      <FormPrivacyNote platforms="meta-google" className="bf-privacy">
        Usamos seus dados para responder ao seu pedido de orçamento.
      </FormPrivacyNote>
    </form>
  );
}
