/**
 * Regras puras da edge function `meta-pageview` (PageView/ViewContent do site
 * pela API de Conversões da Meta, para toda visita humana, com ou sem aceite
 * de cookies). Sem `Deno.env`, sem `npm:` — o Vitest roda isto em
 * src/lib/__tests__/metaPageview.test.ts.
 *
 * O que entra: o corpo JSON que `sendMetaServerEvent` (src/lib/metaCapiBeacon.ts)
 * manda do navegador. O que sai: o `MetaEventInput` pronto para `sendMetaEvents`
 * com `allowIpUaOnly`, ou o motivo da recusa. Validação estrita: só os dois
 * eventos, só URL do próprio site, campos com teto de tamanho; qualquer outra
 * coisa é 400 e nada vai à Meta.
 *
 * Privacidade: a URL enviada perde fragmento e qualquer parâmetro que não seja
 * de campanha (`telemetryUrlWithCampaign`); IP e user-agent vão só à Meta, nunca
 * ao banco. Bots (user-agent) recebem 204 e nada é enviado.
 */

import type { MetaEventInput } from "./meta-capi.ts";
import { telemetryUrlWithCampaign } from "./telemetry-privacy.ts";

export const PAGEVIEW_EVENTS = ["PageView", "ViewContent"] as const;
export type PageviewEventName = (typeof PAGEVIEW_EVENTS)[number];

/** Hosts aceitos em `url` (www redireciona para a raiz; aceito e normalizado). */
export const SITE_HOSTS: readonly string[] = ["bewild.com.br", "www.bewild.com.br"];
export const SITE_ORIGIN = "https://bewild.com.br";

/** Teto do corpo cru: o payload real tem ~300 bytes. */
export const MAX_BODY_BYTES = 4 * 1024;

const EVENT_ID_RE = /^[A-Za-z0-9_.:-]{1,64}$/;
const FBP_RE = /^fb\.\d\.\d{10,13}\.\d{1,20}$/;
const FBC_RE = /^fb\.\d\.\d{10,13}\.[A-Za-z0-9_.-]{1,500}$/;
const CONTENT_TYPE_RE = /^[a-z_]{1,50}$/;
const CONTENT_ID_RE = /^[A-Za-z0-9_.:/-]{1,100}$/;
const MAX_CONTENT_NAME = 200;
const MAX_CONTENT_CATEGORY = 100;
const MAX_CONTENT_IDS = 10;

/**
 * Mesma lista de `track` (supabase/functions/track/index.ts) + `headless`
 * genérico. Robô de preview de link (WhatsApp, Slack…) também não é visita.
 */
export const BOT_UA_RE =
  /bot|crawler|spider|crawling|facebookexternalhit|whatsapp|telegrambot|slackbot|discordbot|linkedinbot|skypeuripreview|bingpreview|preview|monitor|axios|curl|wget|python-requests|go-http-client|headless|phantomjs|lighthouse|pagespeed|gtmetrix|ptst|chrome-lighthouse/i;

export function isBotUserAgent(ua: string | null | undefined): boolean {
  const v = (ua ?? "").trim();
  if (!v) return true;
  return BOT_UA_RE.test(v);
}

/**
 * Chave de desligamento `META_CAPI_PAGEVIEW_ENABLED`: ausente, vazia, `true`,
 * `1`, `sim`, `yes` → ligado; `false`, `0`, `nao`, `não`, `no`, `off` →
 * desligado (a função responde 204 e não envia nada). Qualquer outro valor
 * conta como ligado, para um erro de digitação não apagar a medição.
 */
export function pageviewCapiEnabled(env: (name: string) => string | null | undefined): boolean {
  const v = (env("META_CAPI_PAGEVIEW_ENABLED") ?? "").trim().toLowerCase();
  if (!v) return true;
  return !["false", "0", "nao", "não", "no", "off"].includes(v);
}

/**
 * Origens que podem chamar a função pelo navegador: o site, o site antigo,
 * localhost e os previews (Lovable/Vercel). Resposta sem `Access-Control-
 * Allow-Origin` para o resto — o preflight falha e o POST nem sai.
 */
const ALLOWED_ORIGIN_RE =
  /^https:\/\/(www\.)?(bewild|bwild)\.com\.br$|^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$|^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.(lovable\.app|lovableproject\.com|vercel\.app)$/i;

export function isAllowedOrigin(origin: string | null | undefined): boolean {
  return !!origin && ALLOWED_ORIGIN_RE.test(origin.trim());
}

export function corsHeadersFor(origin: string | null | undefined): Record<string, string> {
  const base: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (isAllowedOrigin(origin)) base["Access-Control-Allow-Origin"] = origin!.trim();
  return base;
}

/**
 * IP do visitante: cabeçalhos definidos pela borda primeiro (o primeiro item
 * de X-Forwarded-For pode ser forjado). Mesma ordem de `notify-lead`.
 */
export function clientIpFrom(headers: { get(name: string): string | null }): string | null {
  const edge = headers.get("cf-connecting-ip") ?? headers.get("x-real-ip");
  if (edge?.trim()) return edge.trim();
  const forwarded = (headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  return forwarded || null;
}

/** País do visitante pela borda (ISO-2), se houver; vai com hash em `user_data.country`. */
export function clientCountryFrom(headers: { get(name: string): string | null }): string | null {
  const raw = headers.get("cf-ipcountry") ?? headers.get("x-vercel-ip-country") ?? headers.get("x-country") ?? "";
  const v = raw.trim().toLowerCase();
  return /^[a-z]{2}$/.test(v) ? v : null;
}

export type PageviewRequest = {
  event: PageviewEventName;
  eventId: string;
  /** Já normalizada: `https://bewild.com.br/<caminho>?<só utm/gclid/fbclid>`. */
  url: string;
  /** Caminho da página (para a regra do /admin e para o log de erro). */
  path: string;
  fbp: string | null;
  fbc: string | null;
  contentName: string | null;
  contentType: string | null;
  contentCategory: string | null;
  contentIds: string[] | null;
};

export type PageviewParse =
  | { ok: true; value: PageviewRequest }
  | {
      ok: false;
      error: "invalid_body" | "invalid_event" | "invalid_event_id" | "invalid_url" | "invalid_content";
    };

function optionalString(v: unknown, max: number): string | null | undefined {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  if (!t) return null;
  return t.length <= max ? t : undefined;
}

/**
 * URL do site: só https, só `bewild.com.br`/`www.bewild.com.br`, caminho sem
 * fragmento e sem parâmetros privados. `null` = não é URL do site.
 */
export function normalizeSiteUrl(raw: unknown): { url: string; path: string } | null {
  if (typeof raw !== "string" || !raw || raw.length > 2048) return null;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  if (!SITE_HOSTS.includes(parsed.hostname.toLowerCase())) return null;
  const canonical = `${SITE_ORIGIN}${parsed.pathname}${parsed.search}`;
  const clean = telemetryUrlWithCampaign(canonical);
  if (!clean || !clean.startsWith(SITE_ORIGIN)) return null;
  return { url: clean.slice(0, 2048), path: parsed.pathname || "/" };
}

export function parsePageviewRequest(body: unknown): PageviewParse {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, error: "invalid_body" };
  const b = body as Record<string, unknown>;

  const event = b.event;
  if (typeof event !== "string" || !(PAGEVIEW_EVENTS as readonly string[]).includes(event)) {
    return { ok: false, error: "invalid_event" };
  }
  const eventId = typeof b.event_id === "string" ? b.event_id.trim() : "";
  if (!EVENT_ID_RE.test(eventId)) return { ok: false, error: "invalid_event_id" };

  const site = normalizeSiteUrl(b.url);
  if (!site) return { ok: false, error: "invalid_url" };

  // fbp/fbc fora do formato não invalidam a visita: só são ignorados.
  const fbp = typeof b.fbp === "string" && FBP_RE.test(b.fbp.trim()) ? b.fbp.trim() : null;
  const fbc = typeof b.fbc === "string" && FBC_RE.test(b.fbc.trim()) ? b.fbc.trim() : null;

  const contentName = optionalString(b.content_name, MAX_CONTENT_NAME);
  const contentCategory = optionalString(b.content_category, MAX_CONTENT_CATEGORY);
  const contentTypeRaw = optionalString(b.content_type, 50);
  if (contentName === undefined || contentCategory === undefined || contentTypeRaw === undefined) {
    return { ok: false, error: "invalid_content" };
  }
  if (contentTypeRaw && !CONTENT_TYPE_RE.test(contentTypeRaw)) return { ok: false, error: "invalid_content" };

  let contentIds: string[] | null = null;
  if (b.content_ids !== undefined && b.content_ids !== null) {
    if (!Array.isArray(b.content_ids) || b.content_ids.length > MAX_CONTENT_IDS) {
      return { ok: false, error: "invalid_content" };
    }
    const ids: string[] = [];
    for (const id of b.content_ids) {
      if (typeof id !== "string" || !CONTENT_ID_RE.test(id)) return { ok: false, error: "invalid_content" };
      ids.push(id);
    }
    contentIds = ids.length ? ids : null;
  }

  return {
    ok: true,
    value: {
      event: event as PageviewEventName,
      eventId,
      url: site.url,
      path: site.path,
      fbp,
      fbc,
      contentName,
      contentType: contentTypeRaw,
      contentCategory,
      contentIds,
    },
  };
}

/** Página do painel: nunca vira evento (o navegador também não manda). */
export function isAdminPath(path: string): boolean {
  return path === "/admin" || path.startsWith("/admin/");
}

export type PageviewVisitor = {
  ip: string | null;
  userAgent: string;
  country?: string | null;
};

/**
 * Evento pronto para `sendMetaEvents(config, [ev], { allowIpUaOnly: true })`.
 * `event_id` é o que o navegador gerou — o mesmo que o Pixel usa quando há
 * aceite, para a Meta deduplicar. `custom_data` só com o que veio e passou.
 */
export function buildPageviewEvent(req: PageviewRequest, visitor: PageviewVisitor, now: Date = new Date()): MetaEventInput {
  const input: MetaEventInput = {
    eventName: req.event,
    eventId: req.eventId,
    eventTime: Math.floor(now.getTime() / 1000),
    actionSource: "website",
    eventSourceUrl: req.url,
    user: {
      fbp: req.fbp,
      fbc: req.fbc,
      clientIp: visitor.ip,
      clientUserAgent: visitor.userAgent,
      // Sem país da borda não se presume Brasil: `""` faz `buildUserData` pular.
      countryCode: visitor.country ?? "",
    },
    customData: {
      content_name: req.contentName ?? undefined,
      content_type: req.contentType ?? undefined,
      content_category: req.contentCategory ?? undefined,
      content_ids: req.contentIds ?? undefined,
    },
  };
  return input;
}
