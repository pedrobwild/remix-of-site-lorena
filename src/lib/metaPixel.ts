/**
 * Meta Pixel — eventos de conversão no browser.
 *
 * O carregador do Pixel é injetado por `injectMetaPixel` (src/lib/useSeo.ts)
 * só depois do aceite de cookies, e `PageView` sai de src/components/MetaPixel.tsx.
 * Este módulo cuida do resto:
 *
 *  - `newMetaEventId()`: id único por envio de formulário. O MESMO id vai no
 *    `fbq('track','Lead', …, { eventID })` e no `Lead` que a edge function
 *    `notify-lead` manda pela Conversions API; a Meta deduplica pelo par
 *    (event_name, event_id) e o lead conta uma vez só.
 *  - `captureFbclid()`: no bootstrap, guarda em `sessionStorage` o `fbclid`
 *    da URL de entrada já no formato `_fbc` (`fb.1.<unix ms>.<fbclid>`). É o
 *    que preserva a atribuição de quem chega pelo anúncio na home e só
 *    preenche o formulário em /orcamento — com ou sem cookies aceitos.
 *  - `readMetaBrowserIds()`: `_fbp` (id do browser) e `_fbc` (clique no
 *    anúncio). Sem cookie `_fbc` (aceite recusado, ou o fbevents ainda não
 *    gravou), usa o `fbclid` da URL atual ou o guardado na sessão.
 *  - `trackMetaLead()`: dispara o `Lead` no Pixel, só com consentimento aceito,
 *    fora do /admin e com o `fbq` carregado. Nunca lança.
 */
import { isConsentAccepted } from "@/lib/cookieConsent";

export type MetaBrowserIds = { fbp: string | null; fbc: string | null };

const FBC_RE = /^fb\.\d\.\d+\..+/;
const FBP_RE = /^fb\.\d\.\d+\.\d+$/;

export function newMetaEventId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* segue para o fallback */
  }
  return `lead-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function readCookie(name: string, cookieString?: string): string | null {
  const source = cookieString ?? (typeof document !== "undefined" ? document.cookie : "");
  if (!source) return null;
  for (const part of source.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) {
      const v = rest.join("=");
      try {
        return decodeURIComponent(v) || null;
      } catch {
        return v || null;
      }
    }
  }
  return null;
}

function fbclidFromSearch(search: string): string | null {
  try {
    const v = new URLSearchParams(search).get("fbclid");
    return v && v.length <= 512 ? v : null;
  } catch {
    return null;
  }
}

/** Monta `_fbc` a partir do fbclid. Exportado para os testes. */
export function fbcFromFbclid(fbclid: string, nowMs = Date.now()): string {
  return `fb.1.${Math.floor(nowMs)}.${fbclid}`;
}

/** Chave em `sessionStorage` do `_fbc` reconstruído (dura a aba/sessão). */
export const FBC_SESSION_KEY = "bw_fbc";

function readSessionFbc(): string | null {
  try {
    const v = typeof window !== "undefined" ? window.sessionStorage.getItem(FBC_SESSION_KEY) : null;
    return v && FBC_RE.test(v) ? v : null;
  } catch {
    return null;
  }
}

/**
 * Se a URL atual tem `fbclid`, guarda o `_fbc` correspondente na sessão
 * (sobrescreve: clique novo = atribuição nova). Chamar no bootstrap do app.
 * Devolve o valor guardado, ou null.
 */
export function captureFbclid(search?: string, nowMs?: number): string | null {
  const fbclid = fbclidFromSearch(search ?? (typeof window !== "undefined" ? window.location.search : ""));
  if (!fbclid) return null;
  const fbc = fbcFromFbclid(fbclid, nowMs);
  try {
    window.sessionStorage.setItem(FBC_SESSION_KEY, fbc);
  } catch {
    /* storage indisponível: o valor da URL ainda vale no readMetaBrowserIds */
  }
  return fbc;
}

/**
 * Identificadores do Pixel para casar o evento server-side com o browser.
 * `search`/`cookies` só para testes; em produção lê `window`/`document`.
 */
export function readMetaBrowserIds(opts: { search?: string; cookies?: string; nowMs?: number } = {}): MetaBrowserIds {
  const cookies = opts.cookies;
  const fbpRaw = readCookie("_fbp", cookies);
  const fbp = fbpRaw && FBP_RE.test(fbpRaw) ? fbpRaw : null;

  let fbc: string | null = readCookie("_fbc", cookies);
  if (fbc && !FBC_RE.test(fbc)) fbc = null;

  if (!fbc) {
    const search = opts.search ?? (typeof window !== "undefined" ? window.location.search : "");
    const fbclid = fbclidFromSearch(search);
    if (fbclid) fbc = fbcFromFbclid(fbclid, opts.nowMs);
  }
  if (!fbc) fbc = readSessionFbc();
  return { fbp, fbc };
}

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export type MetaLeadParams = {
  eventId: string;
  /** Formulário que gerou o lead (`/orcamento`, `/contato`…). */
  formPath: string | null | undefined;
  /** Objetivo declarado (short stay, morar…) — vira `content_category`. */
  objetivo?: string | null;
};

/**
 * `fbq('track','Lead')` com `eventID` para deduplicação com a CAPI.
 * Devolve `true` se o evento foi enfileirado no Pixel.
 */
export function trackMetaLead(params: MetaLeadParams): boolean {
  try {
    if (typeof window === "undefined") return false;
    if (!isConsentAccepted()) return false;
    if (isAdminPath(window.location.pathname)) return false;
    const fbq = window.fbq;
    if (typeof fbq !== "function") return false;
    const data: Record<string, string> = { content_name: params.formPath ?? "site" };
    if (params.objetivo) data.content_category = params.objetivo;
    fbq("track", "Lead", data, { eventID: params.eventId });
    return true;
  } catch {
    return false;
  }
}
