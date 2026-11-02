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
 * o lead uma vez só. PageView e ViewContent seguem a mesma regra desde
 * 27/10/2026: `beginMetaPageView` gera um id por página vista, o servidor
 * recebe esse id primeiro (src/lib/metaCapiBeacon.ts, com ou sem aceite) e o
 * Pixel, quando há aceite, dispara o mesmo evento com o mesmo `eventID`
 * (`trackMetaPageEvent`). Sem aceite o evento do Pixel fica PENDENTE para a
 * página atual: se o aceite vier nesta mesma página, `flushMetaPixelQueue`
 * dispara só o lado do Pixel (o servidor já recebeu o seu).
 *
 * Correspondência avançada manual (`setMetaUserData`): no envio de um
 * formulário, o e-mail, o telefone e o nome que a própria pessoa digitou
 * voltam ao Pixel (`fbq('init', id, dados)`), que faz o hash SHA-256 no
 * navegador antes de mandar à Meta. Só com aceite, só dados de quem enviou o
 * formulário e com a mesma normalização da API de Conversões
 * (supabase/functions/_shared/meta-capi.ts).
 *
 * Nada de dado sensível em eventos, parâmetros ou nomes de evento (regras da
 * Meta sobre informações proibidas): sem valores, renda, CPF, saúde,
 * endereço ou texto livre digitado pela pessoa.
 */
import { isConsentAccepted, isFramed } from "@/lib/cookieConsent";
import { normalizeEmail, normalizeName, normalizePhone } from "../../supabase/functions/_shared/meta-capi";

type Fbq = (...args: unknown[]) => void;

export type MetaStandardEvent = "Lead" | "Contact" | "ViewContent" | "SubmitApplication";

/** Eventos próprios do site (`fbq('trackCustom')`) — nomes sem dado pessoal. */
export type MetaCustomEvent = "IniciouFormulario" | "VisitanteEngajado" | "CliqueProjeto";

/** Teto da fila de espera: eventos antigos demais não fazem sentido. */
const MAX_QUEUE = 20;
let queue: unknown[][] = [];

/** Eventos de página que o Pixel dispara com `eventID` compartilhado com o servidor. */
export type MetaPageEvent = "PageView" | "ViewContent";

type PageViewState = {
  /** caminho + query da página vista (âncora não é página nova). */
  key: string;
  /** `eventID` do PageView desta página (servidor e Pixel). */
  eventId: string;
  /**
   * Eventos de página (`PageView`/`ViewContent`) pedidos SEM aceite: saem no
   * `flushMetaPixelQueue` se o aceite vier ainda nesta página — com o mesmo
   * `eventID` já enviado ao servidor, para a Meta deduplicar.
   */
  pixelPending: unknown[][];
};
let pageView: PageViewState | null = null;
/** Id do Pixel injetado (useSeo) — a correspondência avançada reinicia o mesmo id. */
let pixelId: string | null = null;
/** Dados de correspondência pedidos antes de o Pixel existir: saem antes da fila. */
let pendingUserData: MetaUserData | null = null;

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
function send(args: unknown[]): "sent" | "queued" {
  const fbq = currentFbq();
  if (fbq) {
    fbq(...args);
    return "sent";
  }
  if (queue.length >= MAX_QUEUE) queue.shift();
  queue.push(args);
  return "queued";
}

export function trackMetaEvent(
  name: MetaStandardEvent,
  params: Record<string, unknown> = {},
  opts: { eventId?: string | null } = {},
): "sent" | "queued" | "blocked" {
  try {
    if (!allowed()) return "blocked";
    const args: unknown[] = ["track", name, params];
    if (opts.eventId) args.push({ eventID: opts.eventId });
    return send(args);
  } catch {
    return "blocked";
  }
}

/** Evento próprio do site (ex.: formulário iniciado), com as mesmas travas. */
export function trackMetaCustomEvent(
  name: MetaCustomEvent,
  params: Record<string, unknown> = {},
): "sent" | "queued" | "blocked" {
  try {
    if (!allowed()) return "blocked";
    return send(["trackCustom", name, params]);
  } catch {
    return "blocked";
  }
}

/** useSeo avisa qual Pixel injetou, antes de esvaziar a fila. */
export function registerMetaPixelId(id: string): void {
  pixelId = id;
}

/** Chamado logo depois de o Pixel ser injetado (useSeo). */
export function flushMetaPixelQueue(): void {
  try {
    const fbq = currentFbq();
    if (!fbq) return;
    const pending = queue;
    const userData = pendingUserData;
    queue = [];
    pendingUserData = null;
    if (!allowed()) return;
    // Os dados de correspondência valem para os eventos que estavam na fila.
    if (userData && pixelId) fbq("init", pixelId, userData);
    // Aceite dado nesta página: o PageView/ViewContent dela sai agora, com o
    // eventID que o servidor já recebeu (antes dos demais eventos da fila).
    if (pageView && pageView.key === currentPageKey() && pageView.pixelPending.length) {
      const page = pageView.pixelPending;
      pageView.pixelPending = [];
      for (const args of page) fbq(...args);
    }
    for (const args of pending) fbq(...args);
  } catch {
    /* nunca quebra a página */
  }
}

/** Só para testes. */
export function __resetMetaPixelQueue(): void {
  queue = [];
  pendingUserData = null;
  pixelId = null;
  pageView = null;
}

// ---------------------------------------------------------------------------
// Página vista: um eventID por página, compartilhado com o servidor
// ---------------------------------------------------------------------------

/** Página = caminho + query (âncora não é página nova), como em MetaPixel.tsx. */
export function currentPageKey(): string {
  try {
    return window.location.pathname + window.location.search;
  } catch {
    return "";
  }
}

/**
 * Começa a página vista atual (ou devolve a que já começou, para a mesma
 * chave): `fresh` diz se é a primeira vez — só então o servidor é avisado.
 * Trocar de página descarta o que ficou pendente da anterior: o Pixel nunca
 * dispara PageView de uma página que a pessoa já deixou.
 */
export function beginMetaPageView(key: string = currentPageKey()): { eventId: string; fresh: boolean } {
  if (pageView && pageView.key === key) return { eventId: pageView.eventId, fresh: false };
  pageView = { key, eventId: newEventId(), pixelPending: [] };
  return { eventId: pageView.eventId, fresh: true };
}

/** `eventID` do PageView da página atual (ou `null` antes de `beginMetaPageView`). */
export function currentMetaPageViewId(): string | null {
  return pageView && pageView.key === currentPageKey() ? pageView.eventId : null;
}

/**
 * PageView/ViewContent no Pixel com o `eventID` já enviado ao servidor.
 * Com aceite: sai (ou espera o Pixel na fila). Sem aceite: fica pendente
 * para a página atual e sai em `flushMetaPixelQueue` se o aceite vier nela
 * — nunca em outra página. No /admin ou em iframe: nada.
 */
export function trackMetaPageEvent(
  name: MetaPageEvent,
  params: Record<string, unknown>,
  eventId: string,
): "sent" | "queued" | "pending" | "blocked" {
  try {
    if (typeof window === "undefined" || !eventId || isAdminPath() || isFramed()) return "blocked";
    const args: unknown[] = ["track", name, params, { eventID: eventId }];
    if (isConsentAccepted()) return send(args);
    // Sem aceite: pendente só para a página atual (quem chama já passou por
    // `beginMetaPageView`; se não passou, a página começa aqui).
    const key = currentPageKey();
    if (!pageView || pageView.key !== key) {
      pageView = { key, eventId: name === "PageView" ? eventId : newEventId(), pixelPending: [] };
    }
    if (pageView.pixelPending.length >= MAX_QUEUE) pageView.pixelPending.shift();
    pageView.pixelPending.push(args);
    return "pending";
  } catch {
    return "blocked";
  }
}

// ---------------------------------------------------------------------------
// Correspondência avançada manual
// ---------------------------------------------------------------------------

/** Campos aceitos pelo Pixel; o próprio Pixel faz o hash antes de enviar. */
export type MetaUserData = { em?: string; ph?: string; fn?: string; ln?: string; country?: string };

/**
 * Dados de quem enviou o formulário, na mesma normalização da API de
 * Conversões. Sem e-mail nem telefone válidos, não há o que casar → null.
 */
export function metaUserDataFrom(input: {
  email?: string | null;
  phoneDigits?: string | null;
  name?: string | null;
}): MetaUserData | null {
  const em = normalizeEmail(input.email);
  const ph = normalizePhone(input.phoneDigits);
  if (!em && !ph) return null;
  const out: MetaUserData = {};
  if (em) out.em = em;
  if (ph) out.ph = ph;
  const parts = (normalizeName(input.name) ?? "").split(" ").filter(Boolean);
  if (parts.length) out.fn = parts[0];
  if (parts.length > 1) out.ln = parts[parts.length - 1];
  out.country = "br";
  return out;
}

/**
 * Reinicia o Pixel com os dados de quem enviou o formulário — chamar ANTES do
 * evento de envio. Sem aceite, no /admin ou sem dados: não faz nada. Antes de
 * o Pixel existir, os dados esperam e saem antes da fila.
 */
export function setMetaUserData(data: MetaUserData | null): "sent" | "queued" | "blocked" {
  try {
    if (!data || !allowed()) return "blocked";
    const fbq = currentFbq();
    if (fbq && pixelId) {
      fbq("init", pixelId, data);
      return "sent";
    }
    pendingUserData = data;
    return "queued";
  } catch {
    return "blocked";
  }
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
