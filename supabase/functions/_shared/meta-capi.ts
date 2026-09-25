/**
 * Meta Conversions API (CAPI) — envio server-to-server de eventos de lead.
 *
 * Módulo puro: sem `Deno.env`, sem imports `npm:`. Recebe a configuração por
 * parâmetro e usa só `fetch` + Web Crypto, que existem tanto no Deno das edge
 * functions quanto no Node/jsdom do Vitest (os testes ficam em
 * src/lib/__tests__/metaCapi.test.ts).
 *
 * Por que existe: o Pixel só carrega depois do aceite de cookies e dispara só
 * `PageView`; a Meta nunca recebia `Lead`. Sem isso a campanha otimiza para
 * clique, e desde abril/2026 o objetivo "conversion leads" exige CAPI. Aqui
 * saem dois eventos:
 *   - `Lead` (notify-lead), com o MESMO `event_id` que o Pixel usa no browser
 *     — a Meta deduplica pelo par (event_name, event_id);
 *   - `QualifiedLead` (meta-lead-quality), quando o time marca o lead como
 *     qualificado no painel — o evento de qualidade que alimenta o algoritmo.
 *
 * Privacidade: e-mail, telefone, nome e external_id vão SEMPRE com SHA-256,
 * conforme exige a Meta. Nada em texto claro além de fbp/fbc/IP/user-agent,
 * que são identificadores do próprio Pixel.
 */

export const META_GRAPH_VERSION = "v22.0";

export type MetaCapiConfig = {
  pixelId: string;
  accessToken: string;
  /** Código de "Test events" do Events Manager; só em homologação. */
  testEventCode?: string | null;
  /** Para os testes; padrão `globalThis.fetch`. */
  fetchImpl?: typeof fetch;
  graphVersion?: string;
};

export type MetaEventName = "Lead" | "QualifiedLead" | "DisqualifiedLead" | "Schedule" | "Purchase";

export type MetaActionSource = "website" | "system_generated";

export type MetaUserInput = {
  email?: string | null;
  phone?: string | null;
  /** Nome completo; é dividido em fn/ln antes do hash. */
  fullName?: string | null;
  /** Identificador estável do lead (id da linha em `leads`). */
  externalId?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  clientIp?: string | null;
  clientUserAgent?: string | null;
  /** Cidade/estado declarados no formulário (campo `location`). */
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
  | { status: "sent"; eventsReceived: number; traceId: string | null }
  | { status: "skipped"; reason: "no_config" | "no_user_data" }
  | { status: "error"; reason: string };

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
 * (DDD + número) ganham o 55; quem já veio com 55 ou com outro DDI fica como
 * está. Menos de 10 dígitos não identifica ninguém → null.
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

/** Nome próprio: minúsculo, sem acentos, sem pontuação. */
export function normalizeName(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const v = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, "")
    .trim();
  return v || null;
}

/** "Vila Olímpia, São Paulo-SP" → { city: "saopaulo", state: "sp" } quando dá. */
export function splitLocation(raw: string | null | undefined): { city: string | null; state: string | null } {
  if (!raw) return { city: null, state: null };
  // Separa ANTES de normalizar: `normalizeName` remove a vírgula.
  const parts = raw
    .split(/[,\-\/]/)
    .map((p) => normalizeName(p))
    .filter((p): p is string => Boolean(p));
  if (!parts.length) return { city: null, state: null };
  const last = parts[parts.length - 1];
  const state = /^[a-z]{2}$/.test(last) ? last : null;
  const cityRaw = state ? parts[parts.length - 2] ?? parts[0] : parts[parts.length - 1];
  const city = cityRaw ? cityRaw.replace(/\s+/g, "") : null;
  return { city: city || null, state };
}

type HashedUserData = {
  em?: string[];
  ph?: string[];
  fn?: string[];
  ln?: string[];
  ct?: string[];
  st?: string[];
  country?: string[];
  external_id?: string[];
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
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length) out.fn = [await sha256Hex(parts[0])];
    if (parts.length > 1) out.ln = [await sha256Hex(parts[parts.length - 1])];
  }

  const { city, state } = splitLocation(user.city);
  if (city) out.ct = [await sha256Hex(city)];
  if (state) out.st = [await sha256Hex(state)];

  const country = (user.countryCode ?? "br").trim().toLowerCase();
  if (country) out.country = [await sha256Hex(country)];

  if (user.externalId) out.external_id = [await sha256Hex(user.externalId.trim())];
  if (user.fbp && /^fb\.\d\.\d+\.\d+$/.test(user.fbp)) out.fbp = user.fbp;
  if (user.fbc && /^fb\.\d\.\d+\..+/.test(user.fbc)) out.fbc = user.fbc;
  if (user.clientIp && user.clientIp !== "unknown") out.client_ip_address = user.clientIp;
  if (user.clientUserAgent) out.client_user_agent = user.clientUserAgent.slice(0, 500);
  return out;
}

/** Há pelo menos um identificador que permite à Meta casar o evento? */
export function hasMatchKeys(data: HashedUserData): boolean {
  return Boolean(data.em || data.ph || data.fbp || data.fbc || data.external_id);
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

/**
 * Envia um ou mais eventos. Nunca lança: devolve o resultado para o chamador
 * decidir o que logar. O token não aparece em nenhum log.
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
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8_000),
    });
    const text = await res.text().catch(() => "");
    let json: { events_received?: number; fbtrace_id?: string; error?: { message?: string; code?: number } } = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      /* corpo não-JSON: tratado abaixo pelo status */
    }
    if (!res.ok) {
      const msg = json.error?.message ?? `HTTP ${res.status}`;
      const code = json.error?.code != null ? ` (code ${json.error.code})` : "";
      return { status: "error", reason: `${msg}${code}`.slice(0, 200) };
    }
    return {
      status: "sent",
      eventsReceived: typeof json.events_received === "number" ? json.events_received : data.length,
      traceId: json.fbtrace_id ?? null,
    };
  } catch (err) {
    return { status: "error", reason: err instanceof Error ? err.name : "fetch_failed" };
  }
}

/** `event_id` determinístico para eventos de status: um por (lead, evento). */
export function statusEventId(leadId: string, eventName: MetaEventName): string {
  return `${leadId}:${eventName.toLowerCase()}`;
}
