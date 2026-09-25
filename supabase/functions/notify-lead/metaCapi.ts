// API de Conversões do Meta (servidor → Meta) para o evento Lead.
// Lógica pura, sem rede e sem dependências — testada em metaCapi.test.ts. O
// envio (fetch + registro em integration_log) fica em index.ts.
//
// Regras do Meta para `user_data`
// (developers.facebook.com/docs/marketing-api/conversions-api/parameters):
//  - em, ph, fn, ln, country e external_id: normalizados e com SHA-256 (hex);
//  - client_ip_address, client_user_agent, fbp e fbc: SEM hash;
//  - evento de site exige client_user_agent e event_source_url.
// O `event_id` é o mesmo `eventID` do Lead do Pixel no navegador: o Meta junta
// os dois e conta o lead uma vez só.

export const META_GRAPH_VERSION = "v25.0";

/** Formulários de cliente que viram Lead (mesma lista de src/lib/conversions.ts). */
export const AD_LEAD_FORMS: readonly string[] = ["/diagnostico", "/orcamento", "/contato", "/o", "/p"];

export const SITE_URL = "https://bewild.com.br";

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function normalizeEmail(email: string | null | undefined): string | null {
  const e = (email ?? "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}

/** Telefone BR sem DDI (como gravado em `leads.whatsapp`) → "55" + dígitos. */
export function normalizePhone(digits: string | null | undefined): string | null {
  const d = (digits ?? "").replace(/\D/g, "").replace(/^0+/, "");
  if (d.length < 10 || d.length > 11) return null;
  return `55${d}`;
}

/** Parte do nome: minúsculas, só letras (acentos mantidos, em UTF-8). */
export function normalizeNamePart(part: string): string | null {
  const s = part.normalize("NFC").toLowerCase().replace(/[^\p{L}]/gu, "");
  return s || null;
}

/** Primeiro nome e último sobrenome, normalizados. */
export function splitName(full: string | null | undefined): { fn: string | null; ln: string | null } {
  const parts = (full ?? "")
    .trim()
    .split(/\s+/)
    .map(normalizeNamePart)
    .filter((p): p is string => !!p);
  if (!parts.length) return { fn: null, ln: null };
  return { fn: parts[0], ln: parts.length > 1 ? parts[parts.length - 1] : null };
}

const IPV4_RE = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const IPV6_RE = /^[0-9a-f:.]+$/i;

/** IP do visitante como o Meta aceita (v4 ou v6); qualquer outra coisa = null. */
export function validIp(ip: string | null | undefined): string | null {
  const v = (ip ?? "").trim();
  if (!v) return null;
  if (IPV4_RE.test(v)) return v;
  if (v.includes(":") && IPV6_RE.test(v) && v.length <= 45) return v;
  return null;
}

export function isValidPixelId(id: string | null | undefined): id is string {
  return /^\d{5,20}$/.test((id ?? "").trim());
}

/** Código da ferramenta "Testar eventos" (ex.: TEST12345); fora do padrão = ignorado. */
export function sanitizeTestEventCode(code: string | null | undefined): string | null {
  const v = (code ?? "").trim();
  return /^[A-Za-z0-9_-]{4,40}$/.test(v) ? v : null;
}

export type CapiLeadInput = {
  eventId: string;
  eventTimeS: number;
  formPath: string;
  formLabel: string;
  email: string | null;
  phoneDigits: string | null;
  name: string | null;
  externalId: string | null;
  clientIp: string | null;
  userAgent: string | null;
  fbp: string | null;
  fbc: string | null;
};

export type CapiEvent = {
  event_name: "Lead";
  event_time: number;
  event_id: string;
  action_source: "website";
  event_source_url: string;
  user_data: Record<string, string | string[]>;
  custom_data: Record<string, string>;
};

export async function buildLeadEvent(input: CapiLeadInput): Promise<CapiEvent> {
  const userData: Record<string, string | string[]> = {};
  const hashed = async (key: string, value: string | null) => {
    if (value) userData[key] = [await sha256Hex(value)];
  };
  await hashed("em", normalizeEmail(input.email));
  await hashed("ph", normalizePhone(input.phoneDigits));
  const { fn, ln } = splitName(input.name);
  await hashed("fn", fn);
  await hashed("ln", ln);
  await hashed("country", "br");
  await hashed("external_id", input.externalId);
  const ip = validIp(input.clientIp);
  if (ip) userData.client_ip_address = ip;
  if (input.userAgent) userData.client_user_agent = input.userAgent;
  if (input.fbp) userData.fbp = input.fbp;
  if (input.fbc) userData.fbc = input.fbc;

  return {
    event_name: "Lead",
    event_time: input.eventTimeS,
    event_id: input.eventId,
    action_source: "website",
    event_source_url: `${SITE_URL}${input.formPath}`,
    user_data: userData,
    custom_data: { content_name: input.formLabel, content_category: input.formPath },
  };
}

/** Corpo do POST /{pixel}/events (o token vai junto, só no envio). */
export function buildCapiBody(event: CapiEvent, testEventCode: string | null): Record<string, unknown> {
  return { data: [event], ...(testEventCode ? { test_event_code: testEventCode } : {}) };
}

/** Tira do texto qualquer coisa com cara de token antes de registrar. */
export function redactSecrets(text: string): string {
  return text
    .replace(/EAA[A-Za-z0-9]{10,}/g, "EAA…")
    .replace(/access_token=[^&\s"]+/gi, "access_token=…");
}

export type CapiSummary = { status: "sent" | "error"; detail: Record<string, unknown> };

/** Resume a resposta do Graph API para o `integration_log` (sem dados pessoais). */
export function summarizeCapiResponse(httpStatus: number, body: unknown): CapiSummary {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const received = typeof b.events_received === "number" ? b.events_received : null;
  if (httpStatus >= 200 && httpStatus < 300 && (received ?? 0) >= 1) {
    return {
      status: "sent",
      detail: {
        events_received: received,
        ...(typeof b.fbtrace_id === "string" ? { fbtrace_id: b.fbtrace_id } : {}),
      },
    };
  }
  const err = (b.error && typeof b.error === "object" ? b.error : {}) as Record<string, unknown>;
  const message = typeof err.message === "string" ? redactSecrets(err.message).slice(0, 200) : null;
  return {
    status: "error",
    detail: {
      ...(received !== null ? { events_received: received } : {}),
      ...(typeof err.code === "number" ? { error_code: err.code } : {}),
      ...(typeof err.error_subcode === "number" ? { error_subcode: err.error_subcode } : {}),
      ...(typeof err.type === "string" ? { error_type: err.type } : {}),
      ...(message ? { error_message: message } : {}),
      ...(typeof err.fbtrace_id === "string"
        ? { fbtrace_id: err.fbtrace_id }
        : typeof b.fbtrace_id === "string"
          ? { fbtrace_id: b.fbtrace_id }
          : {}),
    },
  };
}
