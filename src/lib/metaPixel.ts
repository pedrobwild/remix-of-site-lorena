/**
 * Meta Pixel — eventos além do PageView, com os mesmos portões do resto:
 * aceite de cookies (LGPD), fora do /admin e só com o `fbq` do Pixel no ar.
 *
 * Quem injeta o Pixel (`fbq('init')` + primeiro PageView) é `injectMetaPixel`
 * em src/lib/useSeo.ts, a partir de `site_settings.meta_pixel_id`, e só
 * depois do aceite. Um evento pedido antes disso (ex.: ViewContent na
 * entrada direta numa página de projeto, antes de as configurações chegarem)
 * fica numa fila curta e sai assim que o Pixel é injetado.
 *
 * `eventID`: o Lead do navegador leva o mesmo id que a edge function
 * `notify-lead` manda pela API de Conversões — o Meta junta os dois e conta
 * o lead uma vez só.
 */
import { isConsentAccepted } from "@/lib/cookieConsent";

type Fbq = (...args: unknown[]) => void;

export type MetaStandardEvent = "Lead" | "Contact" | "ViewContent";

/** Teto da fila de espera: eventos antigos demais não fazem sentido. */
const MAX_QUEUE = 20;
let queue: unknown[][] = [];

function isAdminPath(): boolean {
  try {
    const p = window.location.pathname;
    return p === "/admin" || p.startsWith("/admin/");
  } catch {
    return false;
  }
}

function currentFbq(): Fbq | null {
  const fbq = (window as Window & { fbq?: unknown }).fbq;
  return typeof fbq === "function" ? (fbq as Fbq) : null;
}

function allowed(): boolean {
  return typeof window !== "undefined" && isConsentAccepted() && !isAdminPath();
}

/**
 * Dispara um evento padrão do Pixel. `sent` = entregue ao `fbq`; `queued` =
 * aguardando o Pixel ser injetado; `blocked` = sem aceite, no /admin etc.
 */
export function trackMetaEvent(
  name: MetaStandardEvent,
  params: Record<string, unknown> = {},
  opts: { eventId?: string | null } = {},
): "sent" | "queued" | "blocked" {
  try {
    if (!allowed()) return "blocked";
    const args: unknown[] = ["track", name, params];
    if (opts.eventId) args.push({ eventID: opts.eventId });
    const fbq = currentFbq();
    if (fbq) {
      fbq(...args);
      return "sent";
    }
    if (queue.length >= MAX_QUEUE) queue.shift();
    queue.push(args);
    return "queued";
  } catch {
    return "blocked";
  }
}

/** Chamado logo depois de o Pixel ser injetado (useSeo). */
export function flushMetaPixelQueue(): void {
  try {
    const fbq = currentFbq();
    if (!fbq) return;
    const pending = queue;
    queue = [];
    if (!allowed()) return;
    for (const args of pending) fbq(...args);
  } catch {
    /* nunca quebra a página */
  }
}

/** Só para testes. */
export function __resetMetaPixelQueue(): void {
  queue = [];
}

// ---------------------------------------------------------------------------
// Identificadores do navegador para a API de Conversões
// ---------------------------------------------------------------------------

/** `_fbp`: fb.<subdomínio>.<criação em ms>.<aleatório>. */
const FBP_RE = /^fb\.\d\.\d{10,13}\.\d{1,20}$/;
/** `_fbc`: fb.<subdomínio>.<criação em ms>.<fbclid>. */
const FBC_RE = /^fb\.\d\.\d{10,13}\.[A-Za-z0-9_.-]{1,500}$/;
const FBCLID_RE = /^[A-Za-z0-9_.-]{1,500}$/;

export function readCookie(name: string): string | null {
  try {
    if (typeof document === "undefined") return null;
    for (const part of document.cookie.split(";")) {
      const eq = part.indexOf("=");
      if (eq === -1) continue;
      if (part.slice(0, eq).trim() !== name) continue;
      const raw = part.slice(eq + 1).trim();
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
  } catch {
    /* cookie bloqueado */
  }
  return null;
}

/**
 * `_fbp` e `_fbc` do Pixel. Sem o cookie `_fbc` (ex.: o aceite veio depois
 * da entrada pelo anúncio), monta o valor a partir do `fbclid` no formato do
 * Meta, com o instante em que o clique foi visto. Chamar só com aceite.
 */
export function readMetaBrowserIds(
  opts: { fbclid?: string | null; fbclidSeenAt?: number | null; now?: number } = {},
): { fbp: string | null; fbc: string | null } {
  const fbpRaw = readCookie("_fbp");
  const fbcRaw = readCookie("_fbc");
  const fbp = fbpRaw && FBP_RE.test(fbpRaw) ? fbpRaw : null;
  let fbc = fbcRaw && FBC_RE.test(fbcRaw) ? fbcRaw : null;
  const fbclid = (opts.fbclid ?? "").trim();
  if (!fbc && fbclid && FBCLID_RE.test(fbclid)) {
    const seen = opts.fbclidSeenAt && Number.isFinite(opts.fbclidSeenAt) ? opts.fbclidSeenAt : (opts.now ?? Date.now());
    fbc = `fb.1.${Math.round(seen)}.${fbclid}`;
  }
  return { fbp, fbc };
}

/** Id de evento para deduplicar Pixel × API de Conversões. */
export function newEventId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {
    /* segue para o fallback */
  }
  return `ev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
