// Lógica pura do notify-lead (sem rede, sem Deno.serve) — testada em
// lead.test.ts. O handler HTTP fica em index.ts.

import { z } from "npm:zod@3.23.8";

export type Outcome = "sent" | "skipped" | "error";

export type StepResult = {
  status: Outcome;
  id?: string;
  error?: string;
};

/** Formulários conhecidos. Qualquer outro valor vira null. */
export const FORM_PATHS = ["/diagnostico", "/contato", "/orcamento", "/parceiros", "/o", "/p"] as const;
export type FormPath = (typeof FORM_PATHS)[number];

const FORM_LABELS: Record<FormPath, string> = {
  "/diagnostico": "Diagnóstico",
  "/contato": "Contato",
  "/orcamento": "Orçamento",
  "/parceiros": "Parceria comercial",
  "/o": "LP Obra (QR)",
  "/p": "LP Panfleto (QR)",
};

/**
 * LEAD-07 — limites de tamanho por campo.
 *
 * Esta função grava com a SERVICE ROLE KEY, então nenhuma policy de RLS
 * limita o que entra. Os tetos são generosos para uso legítimo e cortam o
 * abuso. Truncar em vez de rejeitar: um lead real com um campo grande demais
 * precisa chegar ao time comercial mesmo assim. (Uma versão anterior deste
 * arquivo validava com `.max()` e recusava o lead inteiro.)
 * Manter em sincronia com LEAD_FIELD_LIMITS em src/lib/leadDelivery.ts.
 */
export const FIELD_LIMITS = {
  name: 120,
  whatsapp: 20,
  email: 254,
  location: 200,
  objetivo: 80,
  chaves: 80,
  planta: 80,
  message: 4000,
  utm_source: 200,
  utm_medium: 200,
  utm_campaign: 200,
  referrer: 500,
  landing_path: 500,
  user_agent: 500,
  lead_source: 80,
} as const;

/** Teto do corpo cru, antes de qualquer parse. */
export const MAX_BODY_BYTES = 64 * 1024;

/** Rate limit: por IP (janela curta) e global por dia (teto de custo). */
export const RATE_PER_IP = { windowS: 600, max: 10 };
export const RATE_GLOBAL_DAY = { windowS: 86_400, max: 500 };

// Tipos soltos na entrada: o schema só garante a FORMA; tamanho e conteúdo
// são normalizados em `sanitizeLead`. Chaves desconhecidas são descartadas
// (não rejeitadas) para que um cliente mais novo não derrube a função.
const looseText = z.union([z.string(), z.number(), z.null()]).optional();
export const leadSchema = z.object({
  name: looseText,
  whatsapp: looseText,
  email: looseText,
  location: looseText,
  area_m2: z.union([z.number(), z.string(), z.null()]).optional(),
  objetivo: looseText,
  chaves: looseText,
  planta: looseText,
  message: looseText,
  utm_source: looseText,
  utm_medium: looseText,
  utm_campaign: looseText,
  referrer: looseText,
  landing_path: looseText,
  user_agent: looseText,
  lead_source: looseText,
  lives_in_sp: z.union([z.boolean(), z.null()]).optional(),
  form_path: looseText,
});

export type RawLead = z.infer<typeof leadSchema>;

export type CleanLead = {
  name: string;
  whatsapp: string;
  email: string | null;
  location: string | null;
  area_m2: number | null;
  objetivo: string | null;
  chaves: string | null;
  planta: string | null;
  message: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  landing_path: string | null;
  user_agent: string | null;
  lead_source: string | null;
  lives_in_sp: boolean | null;
  form_path: FormPath | null;
};

function cut(value: unknown, max: number): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

/** Mesma regra de src/lib/phone.ts: remove DDI 55 e tronco 0 ANTES de cortar. */
export function normalizeBrPhoneDigits(input: unknown): string {
  let d = typeof input === "string" || typeof input === "number" ? String(input).replace(/\D/g, "") : "";
  if (d.length >= 12 && d.startsWith("55")) d = d.slice(2);
  d = d.replace(/^0+/, "");
  return d.slice(0, 11);
}

// Mesma regra de e-mail do zod 3 (espelhada em src/lib/leadDelivery.ts).
const EMAIL_RE =
  /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9-]*\.)+[A-Z]{2,}$/i;

function parseArea(value: unknown): number | null {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value.replace(",", "."))
        : Number.NaN;
  if (!Number.isFinite(n) || n < 0 || n > 100000) return null;
  // `leads.area_m2` é INTEGER.
  return Math.round(n);
}

/** Único ponto que decide o que entra no banco, no Slack e no CRM. */
export function sanitizeLead(raw: RawLead): CleanLead {
  let message = cut(raw.message, FIELD_LIMITS.message);
  let email = cut(raw.email, FIELD_LIMITS.email);
  if (email && !EMAIL_RE.test(email)) {
    // Não descarta o que a pessoa digitou: o time ainda vê na mensagem.
    message = [message, `E-mail informado: ${email}`].filter(Boolean).join("\n\n").slice(0, FIELD_LIMITS.message);
    email = null;
  }
  const formPath = cut(raw.form_path, 40);
  return {
    name: cut(raw.name, FIELD_LIMITS.name) || "Lead sem nome",
    whatsapp: normalizeBrPhoneDigits(raw.whatsapp),
    email,
    location: cut(raw.location, FIELD_LIMITS.location),
    area_m2: parseArea(raw.area_m2),
    objetivo: cut(raw.objetivo, FIELD_LIMITS.objetivo),
    chaves: cut(raw.chaves, FIELD_LIMITS.chaves),
    planta: cut(raw.planta, FIELD_LIMITS.planta),
    message,
    utm_source: cut(raw.utm_source, FIELD_LIMITS.utm_source),
    utm_medium: cut(raw.utm_medium, FIELD_LIMITS.utm_medium),
    utm_campaign: cut(raw.utm_campaign, FIELD_LIMITS.utm_campaign),
    referrer: cut(raw.referrer, FIELD_LIMITS.referrer),
    landing_path: cut(raw.landing_path, FIELD_LIMITS.landing_path),
    user_agent: cut(raw.user_agent, FIELD_LIMITS.user_agent),
    lead_source: cut(raw.lead_source, FIELD_LIMITS.lead_source),
    lives_in_sp: typeof raw.lives_in_sp === "boolean" ? raw.lives_in_sp : null,
    form_path: (FORM_PATHS as readonly string[]).includes(formPath ?? "") ? (formPath as FormPath) : null,
  };
}

function fmtDateBR(d: Date): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

function waLink(digits: string): string | null {
  return digits ? `https://wa.me/55${digits}` : null;
}

/**
 * Escapa texto do usuário para mrkdwn do Slack. Sem isso, um nome como
 * "<!channel>" notificava o canal inteiro e "<https://x|Proposta aprovada>"
 * virava um link com texto falso dentro de uma mensagem confiável.
 */
export function slackEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Slack recusa o bloco inteiro (invalid_blocks) acima de 3000 caracteres por
// texto de section e 2000 por field.
const SLACK_FIELD_MAX = 1900;
const SLACK_TEXT_MAX = 2900;

function formLabel(lead: CleanLead): string {
  return lead.form_path ? FORM_LABELS[lead.form_path] : "Site";
}

export function buildSlackMessage(lead: CleanLead, leadId: string | null) {
  const blocks: unknown[] = [];
  const title = `Novo lead · ${formLabel(lead)}`;

  blocks.push({
    type: "header",
    text: { type: "plain_text", text: title },
  });

  const wa = waLink(lead.whatsapp);
  const fields: { label: string; value: string }[] = [];
  const push = (label: string, value?: string | number | null) => {
    if (value === null || value === undefined) return;
    const s = String(value).trim();
    if (!s) return;
    fields.push({ label, value: slackEscape(s).slice(0, SLACK_FIELD_MAX) });
  };

  push("Nome", lead.name);
  // Rótulo só com dígitos: nada do usuário entra na sintaxe do link.
  if (wa) fields.push({ label: "WhatsApp", value: `<${wa}|${lead.whatsapp}>` });
  push("E-mail", lead.email);
  push("Local", lead.location);
  push("Metragem (m²)", lead.area_m2);
  push("Objetivo", lead.objetivo);
  push("Chaves", lead.chaves);
  push("Planta", lead.planta);
  push("Mora em SP capital", typeof lead.lives_in_sp === "boolean" ? (lead.lives_in_sp ? "Sim" : "Não") : null);
  push("Como conheceu", lead.lead_source);

  if (fields.length) {
    // Slack aceita no máximo 10 fields por section.
    for (let i = 0; i < fields.length; i += 10) {
      blocks.push({
        type: "section",
        fields: fields.slice(i, i + 10).map((f) => ({
          type: "mrkdwn",
          text: `*${f.label}*\n${f.value}`,
        })),
      });
    }
  }

  if (lead.message) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Mensagem*\n${slackEscape(lead.message).slice(0, SLACK_TEXT_MAX)}` },
    });
  }

  const origin: string[] = [];
  if (lead.form_path) origin.push(`formulário: ${lead.form_path}`);
  if (lead.utm_source) origin.push(`utm_source: ${lead.utm_source}`);
  if (lead.utm_medium) origin.push(`utm_medium: ${lead.utm_medium}`);
  if (lead.utm_campaign) origin.push(`utm_campaign: ${lead.utm_campaign}`);
  if (lead.referrer) origin.push(`referrer: ${lead.referrer}`);
  if (lead.landing_path) origin.push(`landing_path: ${lead.landing_path}`);
  if (origin.length) {
    blocks.push({ type: "divider" });
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Origem*\n${slackEscape(origin.join("\n")).slice(0, SLACK_TEXT_MAX)}` },
    });
  }

  if (wa) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Falar no WhatsApp" },
          url: wa,
          style: "primary",
        },
      ],
    });
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `Recebido em ${fmtDateBR(new Date())} (America/Sao_Paulo)${leadId ? ` · id: ${leadId}` : ""}`,
      },
    ],
  });

  return {
    // `text` é o fallback das notificações push — também escapado.
    text: slackEscape(`${title} · ${lead.name}`).slice(0, 300),
    blocks,
  };
}

export const BWILD_ENGINE_WEBHOOK_URL =
  "https://pieenhgjulsrjlioozsy.supabase.co/functions/v1/lead-webhook";

export function buildCrmPayload(lead: CleanLead, leadId: string | null) {
  const phone = lead.whatsapp ? `+55${lead.whatsapp}` : null;
  // O texto livre de "Detalhes" precisa aparecer no card do CRM, não só
  // dentro de `extra`. Enviamos nos campos de texto mais comuns do webhook.
  const detalhes = lead.message;

  return {
    source: "site_form",
    name: lead.name,
    email: lead.email,
    phone,
    message: detalhes,
    notes: detalhes,
    observacao: detalhes,
    utm_source: lead.utm_source,
    utm_medium: lead.utm_medium,
    utm_campaign: lead.utm_campaign,
    // Mantido fixo: o CRM já roteia por este nome. O formulário real vai em
    // `extra.form_path`.
    form_name: "Diagnóstico Bewild",
    bairro: lead.location,
    extra: {
      objetivo: lead.objetivo,
      chaves: lead.chaves,
      planta: lead.planta,
      area_m2: lead.area_m2,
      message: lead.message,
      location: lead.location,
      referrer: lead.referrer,
      landing_path: lead.landing_path,
      lead_source: lead.lead_source,
      lives_in_sp: lead.lives_in_sp,
      form_path: lead.form_path,
      lead_type: lead.form_path === "/parceiros" ? "parceiro" : "cliente",
      // Só o id gerado pelo banco; nunca um id vindo do cliente.
      lead_id: leadId,
    },
  };
}

