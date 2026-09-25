// Regras puras do `meta-sync`: configuração, janelas de sincronização,
// conversão das linhas da Graph API (insights e leads dos formulários
// instantâneos) e os avisos de lead novo (Slack, e-mail e CRM), no mesmo
// formato dos leads do site. Sem Deno.* e sem imports `npm:` — testado pelo
// Vitest (src/lib/__tests__/metaSync.test.ts).

import { SITE_URL } from "./meta-capi.ts";

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

/** Conta de anúncios da Bwild (a mesma de `meta-insights`). */
export const DEFAULT_AD_ACCOUNT_ID = "1274618770498233";

export type MetaSyncConfig = {
  /** Token com `ads_read` na conta de anúncios (métricas). */
  adsToken: string | null;
  /** Token com `leads_retrieval` e acesso à Página (formulários). */
  leadsToken: string | null;
  accountId: string;
  /** Páginas a ler; vazio = todas as que o token enxerga (`/me/accounts`). */
  pageIds: string[];
  appSecret: string | null;
};

/**
 * Segredos (todos opcionais, exceto um token):
 *  - `META_ADS_ACCESS_TOKEN` — token de usuário do sistema; vale para as duas
 *    leituras quando tem as permissões das duas;
 *  - `META_LEADS_ACCESS_TOKEN` — token só para os formulários, se for outro;
 *  - `META_ADS_ACCOUNT_ID` — conta de anúncios (padrão: a da Bwild);
 *  - `META_PAGE_ID` — Página(s) dos formulários, separadas por vírgula;
 *  - `META_APP_SECRET` — liga o `appsecret_proof`.
 */
export function resolveMetaSyncConfig(
  env: (name: string) => string | null | undefined,
): { config: MetaSyncConfig; reason: null } | { config: null; reason: "no_token" } {
  const adsToken = (env("META_ADS_ACCESS_TOKEN") || "").trim() || null;
  const leadsToken = (env("META_LEADS_ACCESS_TOKEN") || "").trim() || adsToken;
  if (!adsToken && !leadsToken) return { config: null, reason: "no_token" };
  const account = (env("META_ADS_ACCOUNT_ID") || "").trim().replace(/^act_/i, "");
  const pageIds = (env("META_PAGE_ID") || "")
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter((s) => /^\d{5,25}$/.test(s));
  return {
    config: {
      adsToken,
      leadsToken,
      accountId: /^\d{5,25}$/.test(account) ? account : DEFAULT_AD_ACCOUNT_ID,
      pageIds: [...new Set(pageIds)],
      appSecret: (env("META_APP_SECRET") || "").trim() || null,
    },
    reason: null,
  };
}

// ---------------------------------------------------------------------------
// Janelas
// ---------------------------------------------------------------------------

/** Fuso das datas (o mesmo da conta de anúncios e do painel). */
export const SYNC_TZ = "America/Sao_Paulo";
/** Primeira carga das métricas: 90 dias (hoje + 89). */
export const ADS_BACKFILL_DAYS = 90;
/** Nas seguintes, os últimos 8 dias: a Meta revisa números de dias recentes. */
export const ADS_REFRESH_DAYS = 8;
/** A Meta guarda os leads por 90 dias; a primeira carga pega 89 (margem). */
export const LEADS_BACKFILL_DAYS = 89;
/** Sobreposição entre rodadas: lead que aparece com atraso não se perde. */
export const LEADS_OVERLAP_S = 6 * 3600;
/** Lead mais velho que isso entra no painel sem aviso (ex.: rodada atrasada). */
export const NOTIFY_MAX_AGE_H = 72;
/** Teto de avisos por rodada — protege o Slack/CRM de uma enxurrada. */
export const NOTIFY_MAX_PER_RUN = 25;

/** Data local (YYYY-MM-DD) no fuso dado. */
export function localDay(d: Date, tz = SYNC_TZ): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** Soma dias a uma data YYYY-MM-DD (aritmética de calendário, sem fuso). */
export function shiftDay(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

export function adsWindow(now: Date, backfilled: boolean): { since: string; until: string; backfill: boolean } {
  const until = localDay(now);
  const days = backfilled ? ADS_REFRESH_DAYS : ADS_BACKFILL_DAYS;
  return { since: shiftDay(until, -(days - 1)), until, backfill: !backfilled };
}

/**
 * Desde quando pedir leads (unix, segundos). Sem cursor é a primeira carga:
 * importa o que a Meta ainda guarda, SEM avisar ninguém.
 */
export function leadsWindow(nowMs: number, cursorSince: unknown): { since: number; backfill: boolean } {
  const nowS = Math.floor(nowMs / 1000);
  const floor = nowS - LEADS_BACKFILL_DAYS * 86_400;
  if (typeof cursorSince === "number" && Number.isFinite(cursorSince) && cursorSince > 0) {
    return { since: Math.max(Math.floor(cursorSince) - LEADS_OVERLAP_S, floor), backfill: false };
  }
  return { since: floor, backfill: true };
}

// ---------------------------------------------------------------------------
// Métricas diárias (insights por campanha)
// ---------------------------------------------------------------------------

export const INSIGHTS_FIELDS = [
  "campaign_id",
  "campaign_name",
  "objective",
  "account_currency",
  "spend",
  "impressions",
  "clicks",
  "inline_link_clicks",
  "actions",
].join(",");

export type GraphAction = { action_type?: unknown; value?: unknown };

export type InsightsApiRow = {
  date_start?: unknown;
  campaign_id?: unknown;
  campaign_name?: unknown;
  objective?: unknown;
  account_currency?: unknown;
  spend?: unknown;
  impressions?: unknown;
  clicks?: unknown;
  inline_link_clicks?: unknown;
  actions?: GraphAction[] | null;
};

export type AdsDailyRow = {
  account_id: string;
  date: string;
  campaign_id: string;
  campaign_name: string | null;
  objective: string | null;
  currency: string | null;
  spend: number;
  impressions: number;
  clicks: number;
  link_clicks: number;
  leads: number;
  form_leads: number;
  site_leads: number;
  conversations: number;
  synced_at: string;
};

function num(v: unknown): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : Number.NaN;
  return Number.isFinite(n) ? n : 0;
}

function text(v: unknown, max: number): string | null {
  if (typeof v !== "string" && typeof v !== "number") return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
}

export function actionValue(actions: GraphAction[] | null | undefined, type: string): number {
  const hit = (actions ?? []).find((a) => a?.action_type === type);
  return hit ? Math.round(num(hit.value)) : 0;
}

/**
 * Leads a partir de `actions`. `lead` já é o TOTAL (formulário + site);
 * somar os três contava em dobro — era o que `meta-insights` fazia ao somar
 * toda ação com "lead" no nome.
 *  - formulário instantâneo: `onsite_conversion.lead_grouped`;
 *  - site (Pixel/CAPI): `offsite_conversion.fb_pixel_lead`;
 *  - conversas no WhatsApp/Messenger: `onsite_conversion.messaging_conversation_started_7d`.
 */
export function leadsFromActions(actions: GraphAction[] | null | undefined): {
  leads: number;
  form_leads: number;
  site_leads: number;
  conversations: number;
} {
  const form_leads = actionValue(actions, "onsite_conversion.lead_grouped") || actionValue(actions, "leadgen_grouped");
  const site_leads = actionValue(actions, "offsite_conversion.fb_pixel_lead");
  const total = actionValue(actions, "lead");
  return {
    leads: total || form_leads + site_leads,
    form_leads,
    site_leads,
    conversations: actionValue(actions, "onsite_conversion.messaging_conversation_started_7d"),
  };
}

export function adsDailyRowFromApi(row: InsightsApiRow, accountId: string, syncedAt: string): AdsDailyRow | null {
  const date = typeof row.date_start === "string" && /^\d{4}-\d{2}-\d{2}$/.test(row.date_start) ? row.date_start : null;
  const campaignId = text(row.campaign_id, 40);
  if (!date || !campaignId || !/^\d+$/.test(campaignId)) return null;
  return {
    account_id: accountId,
    date,
    campaign_id: campaignId,
    campaign_name: text(row.campaign_name, 300),
    objective: text(row.objective, 60),
    currency: text(row.account_currency, 8),
    spend: Math.round(num(row.spend) * 100) / 100,
    impressions: Math.round(num(row.impressions)),
    clicks: Math.round(num(row.clicks)),
    link_clicks: Math.round(num(row.inline_link_clicks)),
    ...leadsFromActions(row.actions),
    synced_at: syncedAt,
  };
}

// ---------------------------------------------------------------------------
// Leads dos formulários instantâneos
// ---------------------------------------------------------------------------

export const LEAD_FIELDS = [
  "id",
  "created_time",
  "ad_id",
  "ad_name",
  "adset_id",
  "adset_name",
  "campaign_id",
  "campaign_name",
  "form_id",
  "field_data",
  "is_organic",
  "platform",
].join(",");

/** Sem os nomes de anúncio/campanha (exigem acesso à conta de anúncios). */
export const LEAD_FIELDS_MINIMAL = ["id", "created_time", "ad_id", "form_id", "field_data", "is_organic", "platform"].join(",");

export const FORM_FIELDS = "id,name,status,questions{key,label,options{key,value}}";

export type MetaFieldData = { name?: unknown; values?: unknown }[];

export type MetaLeadApi = {
  id?: unknown;
  created_time?: unknown;
  ad_id?: unknown;
  ad_name?: unknown;
  adset_id?: unknown;
  adset_name?: unknown;
  campaign_id?: unknown;
  campaign_name?: unknown;
  form_id?: unknown;
  field_data?: MetaFieldData | null;
  is_organic?: unknown;
  platform?: unknown;
};

export type MetaFormApi = {
  id?: unknown;
  name?: unknown;
  status?: unknown;
  questions?: { key?: unknown; label?: unknown; options?: { key?: unknown; value?: unknown }[] | null }[] | null;
};

export type MetaFormInfo = {
  id: string;
  name: string | null;
  pageId: string | null;
  /** chave da pergunta → texto da pergunta */
  labels: Record<string, string>;
  /** chave da pergunta → (chave da opção → texto da opção) */
  options: Record<string, Record<string, string>>;
};

export function formInfoFromApi(form: MetaFormApi, pageId: string | null): MetaFormInfo | null {
  const id = text(form.id, 40);
  if (!id) return null;
  const labels: Record<string, string> = {};
  const options: Record<string, Record<string, string>> = {};
  for (const q of form.questions ?? []) {
    const key = text(q?.key, 200);
    if (!key) continue;
    const label = text(q?.label, 300);
    if (label) labels[key] = label;
    for (const o of q?.options ?? []) {
      const ok = text(o?.key, 200);
      const ov = text(o?.value, 300);
      if (ok && ov) (options[key] ??= {})[ok] = ov;
    }
  }
  return { id, name: text(form.name, 300), pageId, labels, options };
}

export type MetaLeadAnswer = { key: string; label: string; value: string };

export type MetaLeadRow = {
  meta_lead_id: string;
  created_time: string;
  page_id: string | null;
  form_id: string | null;
  form_name: string | null;
  ad_id: string | null;
  ad_name: string | null;
  adset_id: string | null;
  adset_name: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  platform: string | null;
  is_organic: boolean | null;
  is_test: boolean;
  name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  answers: MetaLeadAnswer[];
};

/** Perguntas padrão da Meta que viram colunas próprias (não se repetem nas respostas). */
const MAPPED_KEYS = new Set(["full_name", "first_name", "last_name", "email", "phone_number", "city"]);

const STANDARD_LABELS: Record<string, string> = {
  full_name: "Nome",
  first_name: "Nome",
  last_name: "Sobrenome",
  email: "E-mail",
  phone_number: "Telefone",
  city: "Cidade",
  state: "Estado",
  province: "Estado",
  country: "País",
  zip_code: "CEP",
  post_code: "CEP",
  street_address: "Endereço",
  date_of_birth: "Data de nascimento",
  gender: "Gênero",
  marital_status: "Estado civil",
  relationship_status: "Estado civil",
  job_title: "Cargo",
  company_name: "Empresa",
  work_email: "E-mail comercial",
  work_phone_number: "Telefone comercial",
};

/** "qual_o_objetivo_do_imóvel?" → "Qual o objetivo do imóvel?" */
export function prettifyKey(key: string): string {
  const s = key.replace(/_+/g, " ").replace(/\s+/g, " ").trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : key;
}

/** Os valores de teste da Ferramenta de Teste de Leads ("<test lead: dummy data for …>"). */
const TEST_LEAD_RE = /<\s*test lead|dummy data for/i;

// Mesma regra de e-mail do notify-lead (zod 3).
const EMAIL_RE = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9-]*\.)+[A-Z]{2,}$/i;

/**
 * Telefone em E.164. Brasil: "+55" + DDD + número (10 ou 11 dígitos);
 * número estrangeiro com "+" fica como veio (8–15 dígitos). Sem jeito de
 * saber o número certo, devolve null (o valor original continua nas respostas
 * só quando não é uma pergunta padrão).
 */
export function normalizeLeadPhone(raw: unknown): string | null {
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  const s = String(raw).trim();
  const d = s.replace(/\D/g, "");
  if (!d) return null;
  if (s.startsWith("+") || d.length >= 12) {
    if (d.startsWith("55") && (d.length === 12 || d.length === 13)) return `+${d}`;
    if (!d.startsWith("55") && s.startsWith("+") && d.length >= 8 && d.length <= 15) return `+${d}`;
  }
  const national = d.replace(/^0+/, "");
  if (national.length === 10 || national.length === 11) return `+55${national}`;
  return null;
}

/** "+5511912345678" → "(11) 91234-5678"; estrangeiro fica em E.164. */
export function displayPhone(e164: string | null | undefined): string | null {
  if (!e164) return null;
  const d = e164.replace(/\D/g, "");
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) {
    const n = d.slice(2);
    return n.length === 11
      ? `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
      : `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  }
  return e164;
}

/** Link do WhatsApp para um telefone em E.164. */
export function whatsappLink(e164: string | null | undefined): string | null {
  const d = (e164 ?? "").replace(/\D/g, "");
  return d.length >= 10 && d.length <= 15 ? `https://wa.me/${d}` : null;
}

function firstValue(values: unknown): string | null {
  if (!Array.isArray(values)) return null;
  const parts = values
    .map((v) => (typeof v === "string" || typeof v === "number" || typeof v === "boolean" ? String(v).trim() : ""))
    .filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

/** Converte um lead da Graph API na linha de `meta_leads`. Null = sem id/data. */
export function leadRowFromApi(lead: MetaLeadApi, form: MetaFormInfo | null): MetaLeadRow | null {
  const id = text(lead.id, 40);
  const created = typeof lead.created_time === "string" ? new Date(lead.created_time) : null;
  if (!id || !/^\d+$/.test(id) || !created || Number.isNaN(created.getTime())) return null;

  const fields = new Map<string, string>();
  const answers: MetaLeadAnswer[] = [];
  let isTest = false;
  for (const f of lead.field_data ?? []) {
    const key = text(f?.name, 200);
    const raw = firstValue(f?.values);
    if (!key || !raw) continue;
    if (TEST_LEAD_RE.test(raw)) isTest = true;
    const value = (form?.options[key]?.[raw] ?? raw).slice(0, 1000);
    if (!fields.has(key)) fields.set(key, value);
    if (!MAPPED_KEYS.has(key) && answers.length < 50) {
      answers.push({ key, label: form?.labels[key] ?? STANDARD_LABELS[key] ?? prettifyKey(key), value });
    }
  }

  const first = fields.get("first_name");
  const last = fields.get("last_name");
  const name = (fields.get("full_name") ?? [first, last].filter(Boolean).join(" ")).trim() || null;
  const rawEmail = (fields.get("email") ?? fields.get("work_email") ?? "").trim().toLowerCase();
  const phone = normalizeLeadPhone(fields.get("phone_number") ?? fields.get("work_phone_number"));
  const rawPhone = fields.get("phone_number");
  if (rawPhone && !phone) answers.unshift({ key: "phone_number", label: "Telefone (como digitado)", value: rawPhone });

  return {
    meta_lead_id: id,
    created_time: created.toISOString(),
    page_id: form?.pageId ?? null,
    form_id: text(lead.form_id, 40) ?? form?.id ?? null,
    form_name: form?.name ?? null,
    ad_id: text(lead.ad_id, 40),
    ad_name: text(lead.ad_name, 300),
    adset_id: text(lead.adset_id, 40),
    adset_name: text(lead.adset_name, 300),
    campaign_id: text(lead.campaign_id, 40),
    campaign_name: text(lead.campaign_name, 300),
    platform: text(lead.platform, 20)?.toLowerCase() ?? null,
    is_organic: typeof lead.is_organic === "boolean" ? lead.is_organic : null,
    is_test: isTest,
    name: name ? name.slice(0, 120) : null,
    email: rawEmail && EMAIL_RE.test(rawEmail) ? rawEmail.slice(0, 254) : null,
    phone,
    city: fields.get("city")?.slice(0, 200) ?? null,
    answers,
  };
}

export type NotifyDecision = "notify" | "backfill" | "old";

/** Avisar o time? Só lead novo de verdade: nem a primeira carga, nem lead antigo. */
export function notifyDecision(createdTime: string, nowMs: number, backfill: boolean): NotifyDecision {
  if (backfill) return "backfill";
  const age = nowMs - new Date(createdTime).getTime();
  return age > NOTIFY_MAX_AGE_H * 3_600_000 ? "old" : "notify";
}

// ---------------------------------------------------------------------------
// Avisos (mesmos canais dos leads do site)
// ---------------------------------------------------------------------------

export const META_PLATFORM_LABEL: Record<string, string> = {
  fb: "Facebook",
  ig: "Instagram",
  msg: "Messenger",
  an: "Audience Network",
  wa: "WhatsApp",
};

export function platformLabel(p: string | null | undefined): string | null {
  if (!p) return null;
  return META_PLATFORM_LABEL[p.toLowerCase()] ?? p;
}

/** Mesmo endpoint de `BWILD_ENGINE_WEBHOOK_URL` (notify-lead/lead.ts). */
export const CRM_WEBHOOK_URL = "https://pieenhgjulsrjlioozsy.supabase.co/functions/v1/lead-webhook";
/** Link do painel direto na aba dos formulários. */
export const ADMIN_META_LEADS_URL = `${SITE_URL}/admin/leads?aba=meta`;

/** Escapa texto para mrkdwn do Slack (mesma regra de notify-lead/lead.ts). */
export function slackEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fmtDateBR(d: Date): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", { timeZone: SYNC_TZ, dateStyle: "short", timeStyle: "short" }).format(d);
  } catch {
    return d.toISOString();
  }
}

export function metaLeadTitle(row: Pick<MetaLeadRow, "is_test">): string {
  return row.is_test ? "Lead de teste · Formulário Meta" : "Novo lead · Formulário Meta";
}

/** Origem do lead, uma linha por item — Slack e e-mail. */
export function metaLeadOriginLines(row: MetaLeadRow): string[] {
  const out: string[] = [];
  if (row.form_name) out.push(`formulário: ${row.form_name}`);
  if (row.campaign_name) out.push(`campanha: ${row.campaign_name}`);
  if (row.adset_name) out.push(`conjunto: ${row.adset_name}`);
  if (row.ad_name) out.push(`anúncio: ${row.ad_name}`);
  const platform = platformLabel(row.platform);
  if (platform) out.push(`plataforma: ${platform}`);
  if (row.is_organic) out.push("orgânico (sem anúncio)");
  return out;
}

function answerLines(row: MetaLeadRow): string[] {
  return row.answers.map((a) => `${a.label}: ${a.value}`);
}

const SLACK_FIELD_MAX = 1900;
const SLACK_TEXT_MAX = 2900;

export function buildMetaLeadSlackMessage(row: MetaLeadRow, id: string | null) {
  const title = metaLeadTitle(row);
  const name = row.name ?? "Lead sem nome";
  const blocks: unknown[] = [{ type: "header", text: { type: "plain_text", text: title } }];

  const fields: { label: string; value: string }[] = [];
  const push = (label: string, value: string | null | undefined) => {
    const s = (value ?? "").trim();
    if (s) fields.push({ label, value: slackEscape(s).slice(0, SLACK_FIELD_MAX) });
  };
  push("Nome", name);
  const wa = whatsappLink(row.phone);
  const shown = displayPhone(row.phone);
  // Rótulo só com dígitos e pontuação nossa: nada do lead entra na sintaxe do link.
  if (wa && shown) fields.push({ label: "WhatsApp", value: `<${wa}|${shown}>` });
  push("E-mail", row.email);
  push("Cidade", row.city);
  push("Formulário", row.form_name);
  push("Plataforma", platformLabel(row.platform));
  for (let i = 0; i < fields.length; i += 10) {
    blocks.push({
      type: "section",
      fields: fields.slice(i, i + 10).map((f) => ({ type: "mrkdwn", text: `*${f.label}*\n${f.value}` })),
    });
  }

  const answers = answerLines(row);
  if (answers.length) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Respostas*\n${slackEscape(answers.join("\n")).slice(0, SLACK_TEXT_MAX)}` },
    });
  }

  const origin = metaLeadOriginLines(row).filter((l) => !l.startsWith("formulário:") && !l.startsWith("plataforma:"));
  if (origin.length) {
    blocks.push({ type: "divider" });
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Origem*\n${slackEscape(origin.join("\n")).slice(0, SLACK_TEXT_MAX)}` },
    });
  }

  const buttons: unknown[] = [];
  if (wa) buttons.push({ type: "button", text: { type: "plain_text", text: "Falar no WhatsApp" }, url: wa, style: "primary" });
  buttons.push({ type: "button", text: { type: "plain_text", text: "Ver no painel" }, url: ADMIN_META_LEADS_URL });
  blocks.push({ type: "actions", elements: buttons });

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `Enviado em ${fmtDateBR(new Date(row.created_time))} (America/Sao_Paulo) · lead Meta ${row.meta_lead_id}${id ? ` · id: ${id}` : ""}`,
      },
    ],
  });

  return { text: slackEscape(`${title} · ${name}`).slice(0, 300), blocks };
}

/**
 * Dados do e-mail de aviso — o mesmo modelo `novo-lead-site` dos leads do
 * site; `channel: "meta"` troca o assunto para "Novo lead do Meta".
 */
export function buildMetaLeadEmail(row: MetaLeadRow) {
  const origin = metaLeadOriginLines(row);
  const answers = answerLines(row);
  return {
    idempotencyKey: `meta-lead-email-${row.meta_lead_id}`,
    templateData: {
      channel: "meta",
      formLabel: row.form_name ? `${metaLeadTitle(row)} — ${row.form_name}` : metaLeadTitle(row),
      name: row.name ?? "Lead sem nome",
      whatsapp: displayPhone(row.phone),
      email: row.email,
      location: row.city,
      message: answers.length ? answers.join("\n") : null,
      origin: origin.length ? origin.join("\n") : null,
      waLink: whatsappLink(row.phone),
      receivedAt: fmtDateBR(new Date(row.created_time)),
    },
  };
}

/**
 * Card no CRM (Bwild Engine, `lead-webhook`). `source: "meta_ads"` +
 * `external_id` = id do lead na Meta é a mesma chave que o webhook de Lead Ads
 * do próprio CRM usa: se ele também receber este lead, vira "duplicate" lá,
 * nunca dois cards.
 */
export function buildMetaLeadCrmPayload(row: MetaLeadRow, id: string | null) {
  const answers = answerLines(row);
  const notes = answers.length ? answers.join("\n") : null;
  return {
    source: "meta_ads",
    external_id: row.meta_lead_id,
    name: row.name ?? "Lead Meta",
    email: row.email,
    phone: row.phone,
    message: notes,
    notes,
    observacao: notes,
    campaign_id: row.campaign_id,
    campaign_name: row.campaign_name,
    adset_id: row.adset_id,
    adset_name: row.adset_name,
    ad_id: row.ad_id,
    ad_name: row.ad_name,
    form_id: row.form_id,
    form_name: row.form_name,
    utm_source: "meta",
    utm_medium: row.is_organic ? "organic_social" : "paid_social",
    utm_campaign: row.campaign_name ?? row.campaign_id,
    city: row.city,
    extra: {
      lead_type: "cliente",
      channel: "meta_lead_form",
      platform: row.platform,
      is_organic: row.is_organic,
      created_time: row.created_time,
      answers: row.answers,
      // Só o id gerado pelo nosso banco.
      site_meta_lead_id: id,
    },
  };
}
