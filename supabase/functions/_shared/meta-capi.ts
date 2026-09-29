/**
 * Meta Conversions API (CAPI) — envio server-to-server dos eventos de lead.
 *
 * Módulo puro: sem `Deno.env`, sem imports `npm:`. Recebe a configuração por
 * parâmetro e usa só `fetch` + Web Crypto, que existem tanto no Deno das edge
 * functions quanto no Node/jsdom do Vitest (os testes ficam em
 * src/lib/__tests__/metaCapi.test.ts).
 *
 * Eventos que saem daqui:
 *   - `Lead` (notify-lead), com o MESMO `event_id` do Lead que o Pixel manda
 *     no navegador — a Meta deduplica pelo par (event_name, event_id);
 *   - `QualifiedLead` / `DisqualifiedLead` (meta-lead-quality), quando o time
 *     muda o status de um lead DO SITE no painel — o sinal de qualidade que
 *     alimenta o algoritmo;
 *   - estágios do CRM (`initial_lead`, `contacted`, `qualified`,
 *     `disqualified`) para leads dos FORMULÁRIOS INSTANTÂNEOS da Meta, com
 *     `user_data.lead_id` = id do lead na Meta — é a "API de Conversões para
 *     CRM" (otimização Conversion Leads). Ver `crmStageEvent` e docs/META-CRM.md.
 * Quem chama confere antes a regra de negócio: só formulários de cliente
 * (`AD_LEAD_FORMS`). O aceite de cookies (`leads.consent_marketing`) só é
 * exigido quando o segredo `META_CAPI_REQUIRE_CONSENT` está em `true`
 * (`capiRequiresConsent`); o padrão é enviar o Lead de todo formulário de
 * cliente, com os dados pessoais sempre em hash.
 *
 * Privacidade: e-mail, telefone, nome, cidade/UF e external_id vão SEMPRE com
 * SHA-256, como a Meta exige. Em claro só fbp/fbc/IP/user-agent, que são
 * identificadores do próprio Pixel. O token vai no cabeçalho e nunca em log.
 */

/** Versão da Marketing API (a v22.0 expirou em 02/2026). */
export const META_GRAPH_VERSION = "v25.0";

/** Formulários de cliente que viram Lead (mesma lista de src/lib/conversions.ts). */
export const AD_LEAD_FORMS: readonly string[] = ["/diagnostico", "/orcamento", "/contato", "/o", "/p"];

export const SITE_URL = "https://bewild.com.br";

export type MetaCapiConfig = {
  pixelId: string;
  accessToken: string;
  /** Código de "Test events" do Events Manager; só em homologação. */
  testEventCode?: string | null;
  /** Para os testes; padrão `globalThis.fetch`. */
  fetchImpl?: typeof fetch;
  graphVersion?: string;
};

/**
 * Estágios do CRM enviados para leads dos formulários instantâneos (Lead Ads).
 * `initial_lead` é o nome que a própria Meta usa para o primeiro estágio (é o
 * que o funil em Events Manager já espera); os demais seguem a mesma
 * convenção. São distintos dos eventos do site (`Lead`, `QualifiedLead`, sem
 * `lead_id`) de propósito: no funil do Events Manager só entram eventos com
 * `lead_id`. Espelham 1:1 os status do painel (`meta_leads.status`).
 */
export type MetaCrmStage = "initial_lead" | "contacted" | "qualified" | "disqualified";

export const META_CRM_STAGES: readonly MetaCrmStage[] = [
  "initial_lead",
  "contacted",
  "qualified",
  "disqualified",
];

/** Status do painel → estágio do CRM na Meta. `novo` é o lead recém-recebido. */
export const CRM_STAGE_BY_STATUS: Record<string, MetaCrmStage> = {
  novo: "initial_lead",
  contatado: "contacted",
  qualificado: "qualified",
  descartado: "disqualified",
};

/** Estágio → status do painel (vai em `custom_data.lead_status`). */
export const CRM_STATUS_BY_STAGE: Record<MetaCrmStage, string> = {
  initial_lead: "novo",
  contacted: "contatado",
  qualified: "qualificado",
  disqualified: "descartado",
};

/** Nome do CRM que aparece em `custom_data.lead_event_source` (Events Manager). */
export const LEAD_EVENT_SOURCE = "Bewild Admin";

export type MetaEventName = "Lead" | "QualifiedLead" | "DisqualifiedLead" | MetaCrmStage;

export type MetaActionSource = "website" | "system_generated";

export type MetaUserInput = {
  email?: string | null;
  phone?: string | null;
  /** Nome completo; é dividido em fn/ln antes do hash. */
  fullName?: string | null;
  /** Identificador estável do lead (id da linha em `leads`). */
  externalId?: string | null;
  /**
   * Id do lead na Meta (`leadgen_id`, 15–17 dígitos) — só para leads dos
   * formulários instantâneos. Vai em claro como inteiro em `user_data.lead_id`
   * e é a chave da API de Conversões para CRM.
   */
  leadId?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  clientIp?: string | null;
  clientUserAgent?: string | null;
  /** Local declarado no formulário (campo `location`); só vira ct/st com UF. */
  city?: string | null;
  countryCode?: string | null;
};

export type MetaEventInput = {
  eventName: MetaEventName;
  eventId: string;
  /** Unix time em SEGUNDOS. Padrão: agora. */
  eventTime?: number;
  actionSource: MetaActionSource;
  eventSourceUrl?: string | null;
  user: MetaUserInput;
  customData?: Record<string, string | number | boolean | null | undefined>;
};

export type MetaCapiOutcome =
  | { status: "sent"; eventsReceived: number; traceId: string | null; httpStatus: number }
  | { status: "skipped"; reason: "no_config" | "no_user_data" | "no_consent" }
  | { status: "error"; reason: string; httpStatus: number | null; detail: Record<string, unknown> };

// ---------------------------------------------------------------------------
// Normalização (regras da Meta para "customer information parameters")
// ---------------------------------------------------------------------------

const encoder = new TextEncoder();

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** E-mail: minúsculo e sem espaços. Devolve null se não parecer e-mail. */
export function normalizeEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : null;
}

/**
 * Telefone: só dígitos, com DDI. Números brasileiros de 10–11 dígitos
 * (DDD + número, como `leads.whatsapp` guarda) ganham o 55; quem já veio com
 * 55 ou com outro DDI fica como está. Menos de 10 dígitos não identifica
 * ninguém → null.
 */
export function normalizePhone(raw: string | null | undefined, defaultCountry = "55"): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D+/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length < 10) return null;
  // 10–11 dígitos = DDD + número brasileiro sem DDI.
  if (digits.length <= 11) return `${defaultCountry}${digits}`;
  if (digits.startsWith(defaultCountry)) {
    // "55 0xx" (DDD digitado com o zero do tronco) → remove o zero.
    const rest = digits.slice(defaultCountry.length).replace(/^0+/, "");
    return rest.length >= 10 ? `${defaultCountry}${rest}` : null;
  }
  return digits;
}

/** Nome: minúsculo, sem acentos, só letras a-z e espaços (a Meta pede sem pontuação). */
export function normalizeName(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const v = raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return v || null;
}

/** "Vila Olímpia, São Paulo-SP" → { city: "saopaulo", state: "sp" } quando dá. */
export function splitLocation(raw: string | null | undefined): { city: string | null; state: string | null } {
  if (!raw) return { city: null, state: null };
  // Separa ANTES de normalizar: `normalizeName` remove a vírgula.
  const parts = raw
    .split(/[,\-/]/)
    .map((p) => normalizeName(p))
    .filter((p): p is string => Boolean(p));
  if (!parts.length) return { city: null, state: null };
  const last = parts[parts.length - 1];
  const state = /^[a-z]{2}$/.test(last) ? last : null;
  const cityRaw = state ? parts[parts.length - 2] ?? parts[0] : parts[parts.length - 1];
  const city = cityRaw ? cityRaw.replace(/\s+/g, "") : null;
  return { city: city || null, state };
}

const IPV4_RE = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const IPV6_RE = /^[0-9a-f:.]+$/i;

/** IP do visitante como a Meta aceita (v4 ou v6); qualquer outra coisa = null. */
export function validIp(ip: string | null | undefined): string | null {
  const v = (ip ?? "").trim();
  if (!v) return null;
  if (IPV4_RE.test(v)) return v;
  if (v.includes(":") && IPV6_RE.test(v) && v.length <= 45) return v;
  return null;
}

/** Mesmo formato que o front aceita em `site_settings.meta_pixel_id`. */
export function isValidPixelId(id: string | null | undefined): id is string {
  return /^\d{5,20}$/.test((id ?? "").trim());
}

/** Id de lead da Meta (leadgen_id): 15–17 dígitos. */
export function isMetaLeadId(id: string | null | undefined): id is string {
  return /^\d{15,17}$/.test((id ?? "").trim());
}

/**
 * Marcador para serializar `lead_id` como INTEIRO no JSON sem perder precisão:
 * ids de 16–17 dígitos passam de 2^53 e `JSON.stringify(Number)` arredondaria.
 * `serializeMetaBody` troca `"__int__123"` por `123`.
 */
const INT_MARK = "__int__";

export function serializeMetaBody(body: unknown): string {
  return JSON.stringify(body).replace(/"__int__(\d{1,20})"/g, "$1");
}

/**
 * `META_CAPI_REQUIRE_CONSENT`: `true`/`1`/`sim` → só envia Lead/qualidade de
 * quem aceitou os cookies de marketing. Padrão (ausente/`false`): envia para
 * todo formulário de cliente — decisão de 25/09/2026 para melhorar a
 * atribuição; a `/privacidade` e o aviso dos formulários descrevem isso.
 */
export function capiRequiresConsent(env: (name: string) => string | null | undefined): boolean {
  const v = (env("META_CAPI_REQUIRE_CONSENT") ?? "").trim().toLowerCase();
  return v === "true" || v === "1" || v === "sim" || v === "yes";
}

/** Código da ferramenta "Testar eventos" (ex.: TEST12345); fora do padrão = ignorado. */
export function sanitizeTestEventCode(code: string | null | undefined): string | null {
  const v = (code ?? "").trim();
  return /^[A-Za-z0-9_-]{4,40}$/.test(v) ? v : null;
}

/** Tira do texto qualquer coisa com cara de token antes de registrar. */
export function redactSecrets(text: string): string {
  return text
    .replace(/EAA[A-Za-z0-9]{10,}/g, "EAA…")
    .replace(/access_token=[^&\s"]+/gi, "access_token=…");
}

const FBP_RE = /^fb\.\d\.\d{10,13}\.\d{1,20}$/;
const FBC_RE = /^fb\.\d\.\d{10,13}\.[A-Za-z0-9_.-]+$/;

type HashedUserData = {
  em?: string[];
  ph?: string[];
  fn?: string[];
  ln?: string[];
  ct?: string[];
  st?: string[];
  country?: string[];
  external_id?: string[];
  /** Marcador `__int__<dígitos>`; vira inteiro em `serializeMetaBody`. */
  lead_id?: string;
  fbp?: string;
  fbc?: string;
  client_ip_address?: string;
  client_user_agent?: string;
};

/** Monta `user_data` já com hash. Exportado para os testes. */
export async function buildUserData(user: MetaUserInput): Promise<HashedUserData> {
  const out: HashedUserData = {};
  const email = normalizeEmail(user.email);
  if (email) out.em = [await sha256Hex(email)];
  const phone = normalizePhone(user.phone);
  if (phone) out.ph = [await sha256Hex(phone)];

  const name = normalizeName(user.fullName);
  if (name) {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length) out.fn = [await sha256Hex(parts[0])];
    if (parts.length > 1) out.ln = [await sha256Hex(parts[parts.length - 1])];
  }

  // Cidade só com UF junto: nos formulários o campo costuma ser o bairro
  // ("Pinheiros"), e mandar bairro como cidade atrapalharia o casamento.
  const { city, state } = splitLocation(user.city);
  if (state) {
    if (city) out.ct = [await sha256Hex(city)];
    out.st = [await sha256Hex(state)];
  }

  const country = (user.countryCode ?? "br").trim().toLowerCase();
  if (country) out.country = [await sha256Hex(country)];

  if (user.externalId) out.external_id = [await sha256Hex(user.externalId.trim())];
  if (isMetaLeadId(user.leadId)) out.lead_id = `${INT_MARK}${user.leadId.trim()}`;
  if (user.fbp && FBP_RE.test(user.fbp)) out.fbp = user.fbp;
  if (user.fbc && FBC_RE.test(user.fbc)) out.fbc = user.fbc;
  const ip = validIp(user.clientIp);
  if (ip) out.client_ip_address = ip;
  if (user.clientUserAgent) out.client_user_agent = user.clientUserAgent.slice(0, 500);
  return out;
}

/** Há pelo menos um identificador que permite à Meta casar o evento? */
export function hasMatchKeys(data: HashedUserData): boolean {
  return Boolean(data.em || data.ph || data.fbp || data.fbc || data.external_id || data.lead_id);
}

// ---------------------------------------------------------------------------
// Envio
// ---------------------------------------------------------------------------

export type MetaEventPayload = {
  event_name: string;
  event_time: number;
  event_id: string;
  action_source: MetaActionSource;
  event_source_url?: string;
  user_data: HashedUserData;
  custom_data?: Record<string, string | number | boolean>;
};

export async function buildEventPayload(input: MetaEventInput): Promise<MetaEventPayload> {
  const user_data = await buildUserData(input.user);
  const payload: MetaEventPayload = {
    event_name: input.eventName,
    event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
    event_id: input.eventId,
    action_source: input.actionSource,
    user_data,
  };
  if (input.eventSourceUrl) payload.event_source_url = input.eventSourceUrl.slice(0, 2048);
  if (input.customData) {
    const custom: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(input.customData)) {
      if (v === null || v === undefined || v === "") continue;
      custom[k] = v;
    }
    if (Object.keys(custom).length) payload.custom_data = custom;
  }
  return payload;
}

type GraphError = { message?: unknown; type?: unknown; code?: unknown; error_subcode?: unknown; fbtrace_id?: unknown };

/** Detalhe do erro da Graph API para o `integration_log` (sem dados pessoais nem token). */
function errorDetail(json: { error?: GraphError; fbtrace_id?: unknown } | null): Record<string, unknown> {
  const err = json?.error ?? {};
  const message = typeof err.message === "string" ? redactSecrets(err.message).slice(0, 200) : null;
  return {
    ...(typeof err.code === "number" ? { error_code: err.code } : {}),
    ...(typeof err.error_subcode === "number" ? { error_subcode: err.error_subcode } : {}),
    ...(typeof err.type === "string" ? { error_type: err.type } : {}),
    ...(message ? { error_message: message } : {}),
    ...(typeof err.fbtrace_id === "string"
      ? { fbtrace_id: err.fbtrace_id }
      : typeof json?.fbtrace_id === "string"
        ? { fbtrace_id: json.fbtrace_id }
        : {}),
  };
}

/**
 * Envia um ou mais eventos. Nunca lança: devolve o resultado para o chamador
 * decidir o que registrar. O token vai no cabeçalho `Authorization` e não
 * aparece em nenhum log.
 */
export async function sendMetaEvents(
  config: MetaCapiConfig | null | undefined,
  events: MetaEventInput[],
): Promise<MetaCapiOutcome> {
  if (!config?.pixelId || !config.accessToken) return { status: "skipped", reason: "no_config" };

  const data: MetaEventPayload[] = [];
  for (const ev of events) {
    const payload = await buildEventPayload(ev);
    if (hasMatchKeys(payload.user_data)) data.push(payload);
  }
  if (!data.length) return { status: "skipped", reason: "no_user_data" };

  const body: Record<string, unknown> = { data };
  if (config.testEventCode) body.test_event_code = config.testEventCode;

  const version = config.graphVersion ?? META_GRAPH_VERSION;
  const url = `https://graph.facebook.com/${version}/${encodeURIComponent(config.pixelId)}/events`;
  const doFetch = config.fetchImpl ?? fetch;

  try {
    const res = await doFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.accessToken}`,
      },
      body: serializeMetaBody(body),
      signal: AbortSignal.timeout(8_000),
    });
    const text = await res.text().catch(() => "");
    let json: { events_received?: unknown; fbtrace_id?: unknown; error?: GraphError } | null = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      /* corpo não-JSON: tratado abaixo pelo status */
    }
    const received = typeof json?.events_received === "number" ? json.events_received : null;
    if (!res.ok || received === 0) {
      const msg = typeof json?.error?.message === "string" ? json.error.message : `HTTP ${res.status}`;
      const code = typeof json?.error?.code === "number" ? ` (code ${json.error.code})` : "";
      return {
        status: "error",
        reason: redactSecrets(`${msg}${code}`).slice(0, 200),
        httpStatus: res.status,
        detail: errorDetail(json),
      };
    }
    return {
      status: "sent",
      eventsReceived: received ?? data.length,
      traceId: typeof json?.fbtrace_id === "string" ? json.fbtrace_id : null,
      httpStatus: res.status,
    };
  } catch (err) {
    const name = err instanceof Error ? err.name : "fetch_failed";
    return {
      status: "error",
      reason: name,
      httpStatus: null,
      detail: { reason: name === "TimeoutError" ? "timeout" : "network" },
    };
  }
}

/** `event_id` determinístico para eventos de status: um por (lead, evento). */
export function statusEventId(leadId: string, eventName: MetaEventName): string {
  return `${leadId}:${eventName.toLowerCase()}`;
}

export type CrmStageLead = {
  /** Id da linha em `meta_leads` (uuid) — base do `event_id`. */
  rowId: string;
  /** Id do lead na Meta (`meta_leads.meta_lead_id`). */
  metaLeadId: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  formName?: string | null;
  campaignName?: string | null;
  platform?: string | null;
  isTest?: boolean | null;
  /** `meta_leads.created_time` (ISO) — o `event_time` nunca pode ser anterior a ele. */
  createdTime?: string | null;
};

/**
 * Evento de estágio do CRM para um lead de formulário instantâneo, no formato
 * que a Meta exige para a otimização Conversion Leads:
 * `action_source = system_generated`, `user_data.lead_id` = id do lead na Meta,
 * `custom_data.event_source = "crm"` e `lead_event_source` = nome do CRM.
 * Sem esses três a Meta não registra o evento como Conversion Leads.
 * `event_time` = agora (ou `at`), nunca antes de `createdTime`.
 */
export function crmStageEvent(lead: CrmStageLead, stage: MetaCrmStage, at: Date = new Date()): MetaEventInput {
  let eventTime = Math.floor(at.getTime() / 1000);
  if (lead.createdTime) {
    const created = Math.floor(new Date(lead.createdTime).getTime() / 1000);
    if (Number.isFinite(created) && eventTime <= created) eventTime = created + 1;
  }
  return {
    eventName: stage,
    eventId: statusEventId(lead.rowId, stage),
    eventTime,
    actionSource: "system_generated",
    user: {
      leadId: lead.metaLeadId,
      email: lead.email,
      phone: lead.phone,
      fullName: lead.name,
      city: lead.city,
      externalId: lead.rowId,
    },
    customData: {
      event_source: "crm",
      lead_event_source: LEAD_EVENT_SOURCE,
      lead_status: CRM_STATUS_BY_STAGE[stage],
      content_name: lead.formName,
      content_category: "meta_lead_ads",
      campaign_name: lead.campaignName,
      platform: lead.platform,
      ...(lead.isTest ? { is_test: true } : {}),
    },
  };
}

// ---------------------------------------------------------------------------
// Configuração e registro
// ---------------------------------------------------------------------------

/**
 * Configuração da CAPI a partir dos segredos e de `site_settings`:
 *  - token: `META_CAPI_ACCESS_TOKEN` ou, na falta, o `META_ADS_ACCESS_TOKEN`
 *    de `meta-insights` (se ele tiver acesso ao Pixel);
 *  - Pixel: `META_PIXEL_ID` ou o `site_settings.meta_pixel_id` que o site usa;
 *  - código de teste: o do admin (`site_settings.meta_capi_test_event_code`)
 *    ou o segredo `META_CAPI_TEST_EVENT_CODE`.
 * `env` é injetado (Deno.env.get nas funções) para o módulo seguir puro.
 */
export function resolveMetaCapiConfig(
  env: (name: string) => string | null | undefined,
  settings: Record<string, unknown> | null | undefined,
): { config: MetaCapiConfig; reason: null } | { config: null; reason: "no_token" | "no_pixel" } {
  const accessToken = (env("META_CAPI_ACCESS_TOKEN") || env("META_ADS_ACCESS_TOKEN") || "").trim();
  if (!accessToken) return { config: null, reason: "no_token" };
  const fromSettings = typeof settings?.meta_pixel_id === "string" ? settings.meta_pixel_id.trim() : "";
  const pixelId = (env("META_PIXEL_ID") || "").trim() || fromSettings;
  if (!isValidPixelId(pixelId)) return { config: null, reason: "no_pixel" };
  const adminCode =
    typeof settings?.meta_capi_test_event_code === "string" ? settings.meta_capi_test_event_code : null;
  const testEventCode = sanitizeTestEventCode(adminCode) ?? sanitizeTestEventCode(env("META_CAPI_TEST_EVENT_CODE"));
  return { config: { pixelId, accessToken, testEventCode }, reason: null };
}

/** Linha do `integration_log` para um resultado de envio (sem dados pessoais). */
export function capiLogEntry(
  outcome: MetaCapiOutcome,
  opts: { test?: boolean } = {},
): { status: "sent" | "skipped" | "error"; http_status: number | null; detail: Record<string, unknown> } {
  const test = opts.test ? { test: true } : {};
  if (outcome.status === "sent") {
    return {
      status: "sent",
      http_status: outcome.httpStatus,
      detail: {
        events_received: outcome.eventsReceived,
        ...(outcome.traceId ? { fbtrace_id: outcome.traceId } : {}),
        ...test,
      },
    };
  }
  if (outcome.status === "skipped") {
    return { status: "skipped", http_status: null, detail: { reason: outcome.reason } };
  }
  return { status: "error", http_status: outcome.httpStatus, detail: { ...outcome.detail, ...test } };
}
