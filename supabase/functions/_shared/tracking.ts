// Pixel próprio (1×1) e links rastreados — regras puras da edge function
// `px`. Sem Deno.* nem imports `npm:` — testado pelo Vitest
// (src/lib/__tests__/tracking.test.ts).
//
// Sem dados pessoais: cada acesso grava só a campanha (utm_*), o tipo
// (abertura, visualização ou clique), o destino do clique, a família do
// agente e o país informado pela borda. Nada de IP, e-mail, id de lead ou
// cookie — é contagem por campanha, não rastreio de pessoa.

/** GIF transparente de 1×1 (42 bytes). */
export const PIXEL_GIF = Uint8Array.from(atob("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"), (c) =>
  c.charCodeAt(0),
);

export type HitKind = "open" | "view" | "click";

export type TrackParams = {
  campaign: string | null;
  source: string | null;
  medium: string | null;
  content: string | null;
  term: string | null;
};

/** Letras (com acento), números, espaço e pontuação simples; até 100 caracteres. */
const PARAM_RE = /^[\p{L}\p{N} _.\-:/+|]{1,100}$/u;

export function cleanParam(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const v = value.replace(/\s+/g, " ").trim().slice(0, 100);
  return v && PARAM_RE.test(v) ? v : null;
}

/** Aceita os nomes curtos (c, s, m, n, t) e os utm_* completos. */
export function readTrackParams(url: URL): TrackParams {
  const q = url.searchParams;
  const pick = (short: string, utm: string) => cleanParam(q.get(short) ?? q.get(utm));
  return {
    campaign: pick("c", "utm_campaign"),
    source: pick("s", "utm_source"),
    medium: pick("m", "utm_medium"),
    content: pick("n", "utm_content"),
    term: pick("t", "utm_term"),
  };
}

/**
 * Pixel de abertura de um e-mail: a campanha vem dos utm_* do link principal
 * (ex.: o `postUrl` da nutrição). Sem `utm_campaign`, não há pixel — nada de
 * pixel "solto" sem campanha. Nunca leva dado de quem recebe o e-mail.
 */
export function openPixelUrl(functionsBase: string, linkWithUtms: string | null | undefined): string | null {
  if (!functionsBase || typeof linkWithUtms !== "string") return null;
  let src: URL;
  try {
    src = new URL(linkWithUtms);
  } catch {
    return null;
  }
  const out = new URLSearchParams();
  const pairs: [string, string][] = [
    ["c", "utm_campaign"],
    ["s", "utm_source"],
    ["m", "utm_medium"],
    ["n", "utm_content"],
    ["t", "utm_term"],
  ];
  for (const [short, utm] of pairs) {
    const v = cleanParam(src.searchParams.get(utm));
    if (v) out.set(short, v);
  }
  if (!out.has("c")) return null;
  return `${functionsBase.replace(/\/+$/, "")}/px?${out.toString()}`;
}

// ---------------------------------------------------------------------------
// Destinos permitidos do /px/go (sem isso, vira um redirecionador aberto)
// ---------------------------------------------------------------------------

export const REDIRECT_HOSTS: readonly string[] = [
  "bewild.com.br",
  "wa.me",
  "api.whatsapp.com",
  "instagram.com",
  "catalogobewild.com",
];

/** Para onde vai quem clica num link inválido ou fora da lista. */
export const FALLBACK_URL = "https://bewild.com.br/";

function hostAllowed(host: string): boolean {
  const h = host.toLowerCase().replace(/\.$/, "");
  return REDIRECT_HOSTS.some((allowed) => h === allowed || h.endsWith(`.${allowed}`));
}

/** Destino do clique: só https, sem usuário/senha na URL e só hosts da lista. */
export function safeDestination(raw: string | null | undefined): URL | null {
  if (typeof raw !== "string" || !raw.trim() || raw.length > 2000) return null;
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  return hostAllowed(url.hostname) ? url : null;
}

function isSiteHost(host: string): boolean {
  const h = host.toLowerCase();
  return h === "bewild.com.br" || h.endsWith(".bewild.com.br");
}

/**
 * Destino final. No site da Bwild, os parâmetros da campanha viram utm_* (sem
 * sobrescrever os que o link já tem) — a visita cai atribuída no Analytics.
 */
export function withUtms(dest: URL, p: TrackParams): URL {
  const out = new URL(dest.toString());
  if (!isSiteHost(out.hostname)) return out;
  const pairs: [string, string | null][] = [
    ["utm_source", p.source],
    ["utm_medium", p.medium],
    ["utm_campaign", p.campaign],
    ["utm_content", p.content],
    ["utm_term", p.term],
  ];
  for (const [k, v] of pairs) {
    if (v && !out.searchParams.has(k)) out.searchParams.set(k, v);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Agente
// ---------------------------------------------------------------------------

export type AgentFamily = "gmail_proxy" | "outlook" | "apple_mail" | "mobile" | "desktop" | "bot" | "other";

/** Robôs e prévias de link (o WhatsApp/Slack abrem o link para montar a prévia). */
const BOT_RE =
  /bot|crawler|spider|crawling|facebookexternalhit|whatsapp|telegrambot|slackbot|discordbot|linkedinbot|skypeuripreview|bingpreview|preview|monitor|curl|wget|python-requests|axios|go-http-client|headlesschrome|phantomjs|lighthouse/i;

export function classifyAgent(ua: string | null | undefined): { agent: AgentFamily; isBot: boolean } {
  const s = (ua ?? "").trim();
  if (!s) return { agent: "other", isBot: false };
  // O Gmail busca as imagens pelo proxy dele quando a pessoa abre o e-mail:
  // conta como abertura (não é robô).
  if (/GoogleImageProxy/i.test(s)) return { agent: "gmail_proxy", isBot: false };
  if (BOT_RE.test(s)) return { agent: "bot", isBot: true };
  if (/Microsoft Outlook|ms-office|Outlook-iOS|Outlook-Android|MSOffice/i.test(s)) return { agent: "outlook", isBot: false };
  // Apple Mail (Mac/iPhone): WebKit sem "Safari" nem "Chrome" no agente.
  if (/AppleWebKit/i.test(s) && /Macintosh|iPhone|iPad/i.test(s) && !/Safari|Chrome|CriOS|FxiOS/i.test(s)) {
    return { agent: "apple_mail", isBot: false };
  }
  if (/Mobi|Android|iPhone|iPad/i.test(s)) return { agent: "mobile", isBot: false };
  if (/Windows|Macintosh|X11|Linux|CrOS/i.test(s)) return { agent: "desktop", isBot: false };
  return { agent: "other", isBot: false };
}

// ---------------------------------------------------------------------------
// Linha gravada
// ---------------------------------------------------------------------------

export type HitRow = {
  kind: HitKind;
  campaign: string | null;
  source: string | null;
  medium: string | null;
  content: string | null;
  term: string | null;
  target_host: string | null;
  target_path: string | null;
  agent: AgentFamily;
  is_bot: boolean;
  country: string | null;
  referer_host: string | null;
};

function refererHost(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const h = new URL(raw).hostname.toLowerCase();
    return h ? h.slice(0, 100) : null;
  } catch {
    return null;
  }
}

export function hitRow(
  kind: HitKind,
  params: TrackParams,
  req: { userAgent?: string | null; country?: string | null; referer?: string | null; target?: URL | null },
): HitRow {
  const { agent, isBot } = classifyAgent(req.userAgent);
  const country = (req.country ?? "").trim().toUpperCase();
  return {
    kind,
    ...params,
    target_host: req.target ? req.target.hostname.toLowerCase().slice(0, 100) : null,
    // Só o caminho: a query do destino pode trazer dado de quem clicou.
    target_path: req.target ? req.target.pathname.slice(0, 300) : null,
    agent,
    is_bot: isBot,
    country: /^[A-Z]{2}$/.test(country) && country !== "XX" ? country : null,
    referer_host: refererHost(req.referer),
  };
}
