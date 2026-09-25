/**
 * Regras compartilhadas pelos formulários de lead (/orcamento, /contato,
 * /orcamento, /parceiros, /o, /p).
 *
 * Só lógica pura aqui — testável sem DOM. A cola com o navegador (envio,
 * atribuição, GA4, foco) fica em `useLeadSubmit.ts`. Telefone: `phone.ts`.
 */
import { isServerAcceptedEmail } from "@/lib/leadDelivery";
import {
  resolveLeadAttribution,
  type LeadAttribution,
  type LeadAttributionInput,
} from "@/lib/campaignParams";
import type { SendLeadResult } from "@/lib/sendLead";

/* ------------------------------------------------------------------ */
/* Valores canônicos do CRM                                            */
/* ------------------------------------------------------------------ */

/**
 * Valores de `objetivo` que o CRM conhece — os mesmos em todos os
 * formulários. O RÓTULO exibido pode variar por página; o valor enviado não
 * (/orcamento mandava "Morar" e "Short stay (curta temporada)", que o CRM
 * não agrupava com "Moradia" e "Short stay" de /orcamento).
 */
export const LEAD_OBJETIVOS = [
  "Short stay",
  "Locação tradicional",
  "Uso misto",
  "Moradia",
  "Ainda avaliando",
] as const;
export type LeadObjetivo = (typeof LEAD_OBJETIVOS)[number];

export const LEAD_CHAVES = ["Sim", "Ainda não", "Estou comprando"] as const;

/* ------------------------------------------------------------------ */
/* Metragem                                                            */
/* ------------------------------------------------------------------ */

/** Acima disso é erro de digitação, não apartamento. */
export const AREA_M2_MAX = 10000;

/**
 * Máscara do campo de metragem: dígitos e UM separador ("," ou ".").
 * Antes, `digits()` apagava a vírgula e "32,5" virava 325 m².
 */
export function sanitizeAreaInput(raw: string): string {
  // Separador inicial não tem significado (",5" seria lido como 0,5 m²).
  const cleaned = (raw || "").replace(/[^\d.,]/g, "").replace(/^[.,]+/, "");
  const sep = cleaned.search(/[.,]/);
  const single =
    sep === -1
      ? cleaned
      : cleaned.slice(0, sep + 1) + cleaned.slice(sep + 1).replace(/[.,]/g, "");
  return single.slice(0, 7);
}

/**
 * Metragem digitada → número (m²), ou `null` se não houver número.
 * Convenção pt-BR: vírgula é decimal ("32,5" → 32.5); ponto seguido de
 * exatamente três dígitos é milhar ("1.200" → 1200); qualquer outro ponto é
 * decimal ("32.5" → 32.5). O arredondamento para a coluna INTEGER
 * `leads.area_m2` fica em `fitLeadPayload`.
 */
export function parseAreaM2(raw: string): number | null {
  const v = (raw || "").trim().replace(/\s+/g, "");
  if (!/\d/.test(v)) return null;
  const normalized = /^\d{1,3}\.\d{3}$/.test(v) ? v.replace(".", "") : v.replace(",", ".");
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : null;
}

export function isValidAreaM2(n: number | null): n is number {
  return n != null && n > 0 && n <= AREA_M2_MAX;
}

/* ------------------------------------------------------------------ */
/* E-mail                                                              */
/* ------------------------------------------------------------------ */

/**
 * Mesma regra do servidor: um e-mail que o cliente aceitasse e a função
 * recusasse era movido para a mensagem sem o visitante saber do erro de
 * digitação ("joao@gmail.c").
 */
export function isValidEmail(value: string): boolean {
  return isServerAcceptedEmail((value || "").trim());
}

/* ------------------------------------------------------------------ */
/* Mensagem pré-preenchida do WhatsApp                                 */
/* ------------------------------------------------------------------ */

export type LeadMessageField = readonly [label: string, value: string | null | undefined];

/** "Intro\nRótulo: valor\n…" — campos vazios ficam de fora. */
export function buildLeadMessage(
  intro: string,
  fields: ReadonlyArray<LeadMessageField>,
  footer?: string | null,
): string {
  const lines = [intro];
  for (const [label, value] of fields) {
    const v = (value ?? "").trim();
    if (v) lines.push(`${label}: ${v}`);
  }
  if (footer) lines.push(footer);
  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/* Resultado do envio                                                  */
/* ------------------------------------------------------------------ */

/**
 * - `delivered`: algum destino real (banco, Slack ou CRM) confirmou.
 * - `failed`: nenhum destino confirmou — reenviar não duplica.
 * - `timedOut`: a função não respondeu a tempo e PODE ter gravado; não
 *   convidar a reenviar às cegas, oferecer o WhatsApp com os dados.
 */
export type LeadOutcome = "delivered" | "failed" | "timedOut";

export function leadOutcomeOf(result: SendLeadResult): LeadOutcome {
  if (result.delivered) return "delivered";
  return result.timedOut ? "timedOut" : "failed";
}

/** Valor do parâmetro `delivery` nos eventos GA4 de lead. */
export function deliveryParam(outcome: LeadOutcome): "confirmed" | "failed" | "timeout" {
  if (outcome === "delivered") return "confirmed";
  return outcome === "timedOut" ? "timeout" : "failed";
}

/* ------------------------------------------------------------------ */
/* Atribuição das LPs de QR (/o e /p)                                  */
/* ------------------------------------------------------------------ */

export type QrUtmDefaults = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
};

/**
 * /o e /p só são alcançadas pelo QR impresso: o toque que converteu é o QR,
 * não o first-touch antigo do visitante. Ordem por campo: parâmetro da URL
 * (a campanha pode vir no QR) → padrão da peça (placa/panfleto). Referrer e
 * página de entrada seguem a regra comum.
 */
export function resolveQrLeadAttribution(
  input: Omit<LeadAttributionInput, "sessionUtm" | "firstUtm" | "clickIds">,
  defaults: QrUtmDefaults,
): LeadAttribution {
  // Peça impressa: vale o que está na URL do QR (ou o padrão da peça), nunca
  // uma campanha ou clique de anúncio guardado de outra visita.
  const base = resolveLeadAttribution({ ...input, sessionUtm: null, firstUtm: null, clickIds: null });
  return {
    ...base,
    utm_source: base.utm_source ?? defaults.utm_source,
    utm_medium: base.utm_medium ?? defaults.utm_medium,
    utm_campaign: base.utm_campaign ?? defaults.utm_campaign,
  };
}

/* ------------------------------------------------------------------ */
/* Validação acessível                                                 */
/* ------------------------------------------------------------------ */

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

/** Primeiro campo com erro, na ordem visual do formulário. */
export function firstInvalidField<K extends string>(
  order: readonly K[],
  errors: FieldErrors<K>,
): K | null {
  return order.find((k) => !!errors[k]) ?? null;
}

/** Id do elemento com a mensagem de erro de um campo. */
export const fieldErrorId = (fieldId: string) => `${fieldId}-erro`;

/** `aria-invalid` + `aria-describedby` para um campo com erro visível. */
export function fieldErrorProps(fieldId: string, error: string | null | undefined) {
  return error
    ? { "aria-invalid": true as const, "aria-describedby": fieldErrorId(fieldId) }
    : {};
}

/** Todos os campos marcados como tocados (mostra todos os erros no envio). */
export function touchAll<K extends string>(fields: readonly K[]): Record<K, boolean> {
  return Object.fromEntries(fields.map((k) => [k, true])) as Record<K, boolean>;
}
