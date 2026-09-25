/**
 * Analytics tracker — fire-and-forget, marketing-grade.
 *
 * Recursos:
 * - visitor_id (localStorage, TTL 365d rolando)
 * - session_id (sessionStorage, renovada após 30 min de inatividade)
 * - Atribuição: 1ª pageview captura utm_*, referrer_host, landing_path
 *   (last-touch por sessão; first-touch persistido por visitante); gclid e
 *   fbclid da URL ficam 90 dias (`bewild_click`) para atribuir o lead
 * - Engagement time: timer baseado em document.visibilityState,
 *   enviado via sendBeacon no unload/troca de página
 * - Scroll depth: marcos 25/50/75/100 uma vez por página
 * - Outbound/contato: delegação no document — um evento por clique
 *   (WhatsApp → click_whatsapp, tel: → click_phone, mailto: → click_contact,
 *   resto → outbound_click). É a fonte ÚNICA desses eventos (trackCta.ts não
 *   os repete).
 * - Privacidade: só com aceite do banner; respeita DNT; ignora rotas /admin.
 *   Dentro de iframe (auditoria de SEO do admin) `isConsentAccepted()` é
 *   falso, então nada sai; a auditoria de consentimento checa `isFramed()`.
 *   Nada (nem ids no storage) é gravado sem aceite; recusar apaga o que existir.
 * - Resiliência: nunca lança exceção
 */
import { isConsentAccepted, isFramed, onConsentChange } from "@/lib/cookieConsent";
import { closestElementFrom } from "@/lib/useHashRoute";

type EventType =
  | "pageview"
  | "project_view"
  | "portfolio_view"
  | "blog_index_view"
  | "blog_post_view"
  | "blog_tags_view"
  | "blog_tag_view"
  | "blog_tag_click"
  | "blog_related_click"
  | "click_contact"
  | "click_whatsapp"
  | "click_phone"
  | "click_instagram"
  | "click_cta"
  | "outbound_click"
  | "scroll_depth"
  | "form_submit"
  | "engagement_time"
  | "faq_question_click"
  | "consent_accept"
  | "consent_decline";

type TrackPayload = {
  path?: string;
  project_slug?: string;
  scroll_depth?: number;
  duration_ms?: number;
  value?: Record<string, unknown>;
};

// ---------- storage keys ----------
const SID_KEY = "bewild_sid";
const SID_TS_KEY = "bewild_sid_ts";
const VID_KEY = "bewild_vid";
const VID_TS_KEY = "bewild_vid_ts";
const UTM_KEY = "bewild_utm"; // last-touch (sessão)
const FIRST_UTM_KEY = "bewild_first_utm"; // first-touch (visitante)
const LANDING_KEY = "bewild_landing";
const REFERRER_HOST_KEY = "bewild_ref_host";
/** Último gclid/fbclid visto (clique de anúncio) e quando — para atribuir o lead. */
const CLICK_KEY = "bewild_click";

const VID_MAX_AGE = 365 * 86_400_000; // 365 dias
const SID_IDLE = 30 * 60_000; // 30 min
/** Validade de um clique de anúncio para atribuição (padrão do Google Ads e do Meta). */
const CLICK_MAX_AGE = 90 * 86_400_000;

/** Campanha da sessão gravada por src/lib/utm.ts (links de orçamento). */
const LINK_UTM_KEY = "bwa_utm";

/** Chaves que o tracker grava. A chave do consentimento fica de fora. */
const LOCAL_KEYS = [VID_KEY, VID_TS_KEY, FIRST_UTM_KEY, CLICK_KEY] as const;
const SESSION_KEYS = [SID_KEY, SID_TS_KEY, UTM_KEY, LANDING_KEY, REFERRER_HOST_KEY, LINK_UTM_KEY] as const;

/**
 * Apaga ids e atribuição persistidos pelo tracker (LGPD: recusa/retirada do
 * consentimento). Remove as chaves dos dois storages, por garantia.
 */
export function purgeAnalyticsStorage(): void {
  for (const storage of [() => window.localStorage, () => window.sessionStorage]) {
    try {
      const s = storage();
      for (const k of [...LOCAL_KEYS, ...SESSION_KEYS]) s.removeItem(k);
    } catch {
      /* storage indisponível: não há o que apagar */
    }
  }
}

// ---------- helpers ----------
function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function ensureVisitorId(): string {
  try {
    const ts = Number(localStorage.getItem(VID_TS_KEY) || 0);
    const fresh = ts && Date.now() - ts < VID_MAX_AGE;
    let vid = localStorage.getItem(VID_KEY);
    if (!fresh || !vid) {
      vid = uuid();
      localStorage.setItem(VID_KEY, vid);
    }
    // Roll TTL on every access
    localStorage.setItem(VID_TS_KEY, String(Date.now()));
    return vid;
  } catch {
    return uuid();
  }
}

function getSessionId(): { id: string; isNew: boolean } {
  try {
    const now = Date.now();
    const lastTs = Number(sessionStorage.getItem(SID_TS_KEY) || 0);
    let sid = sessionStorage.getItem(SID_KEY);
    const expired = lastTs > 0 && now - lastTs > SID_IDLE;
    const isNew = !sid || expired;
    if (isNew) {
      sid = uuid();
      sessionStorage.setItem(SID_KEY, sid);
    }
    sessionStorage.setItem(SID_TS_KEY, String(now));
    return { id: sid as string, isNew };
  } catch {
    return { id: uuid(), isNew: true };
  }
}

function detectDevice(ua: string): "desktop" | "mobile" | "tablet" {
  const s = ua.toLowerCase();
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(s)) return "tablet";
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/.test(s))
    return "mobile";
  return "desktop";
}

function detectBrowser(ua: string): string {
  const s = ua.toLowerCase();
  if (s.includes("edg/")) return "Edge";
  if (s.includes("chrome/") && !s.includes("chromium/")) return "Chrome";
  if (s.includes("firefox/")) return "Firefox";
  if (s.includes("safari/") && !s.includes("chrome/")) return "Safari";
  if (s.includes("opera") || s.includes("opr/")) return "Opera";
  return "Other";
}

function detectOS(ua: string): string {
  const s = ua.toLowerCase();
  if (s.includes("windows")) return "Windows";
  if (s.includes("mac os")) return "macOS";
  if (s.includes("android")) return "Android";
  if (s.includes("iphone") || s.includes("ipad") || s.includes("ipod")) return "iOS";
  if (s.includes("linux")) return "Linux";
  return "Other";
}

type Utm = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
};

function captureUtmsFromUrl(): Utm {
  try {
    const params = new URLSearchParams(window.location.search);
    const utm: Utm = {};
    const keys: (keyof Utm)[] = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
    ];
    for (const k of keys) {
      const v = params.get(k);
      if (v) utm[k] = v;
    }
    return utm;
  } catch {
    return {};
  }
}

function getOrPersistUtms(isNewSession: boolean): Utm {
  try {
    const fromUrl = captureUtmsFromUrl();
    if (Object.keys(fromUrl).length) {
      sessionStorage.setItem(UTM_KEY, JSON.stringify(fromUrl));
      // first-touch só grava se ainda não existir
      if (!localStorage.getItem(FIRST_UTM_KEY)) {
        localStorage.setItem(FIRST_UTM_KEY, JSON.stringify(fromUrl));
      }
      return fromUrl;
    }
    if (isNewSession) {
      // sessão nova sem UTM → limpa atribuição da sessão anterior
      sessionStorage.removeItem(UTM_KEY);
      return {};
    }
    const stored = sessionStorage.getItem(UTM_KEY);
    if (stored) return JSON.parse(stored) as Utm;
  } catch {
    /* noop */
  }
  return {};
}

type StoredClick = { gclid?: string; gclid_ts?: number; fbclid?: string; fbclid_ts?: number };

const CLICK_ID_RE = /^[A-Za-z0-9_.-]{1,500}$/;

function readStoredClick(): StoredClick {
  try {
    const raw = localStorage.getItem(CLICK_KEY);
    const v = raw ? (JSON.parse(raw) as StoredClick) : null;
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

/**
 * Guarda gclid/fbclid da URL (clique de anúncio) com o instante em que foram
 * vistos. Só roda dentro de `buildRow`, ou seja, com aceite de cookies.
 */
function persistClickIds(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const now = Date.now();
    const stored = readStoredClick();
    let changed = false;
    for (const k of ["gclid", "fbclid"] as const) {
      const v = params.get(k);
      if (!v || !CLICK_ID_RE.test(v) || stored[k] === v) continue;
      stored[k] = v;
      stored[`${k}_ts`] = now;
      changed = true;
    }
    if (changed) localStorage.setItem(CLICK_KEY, JSON.stringify(stored));
  } catch {
    /* storage indisponível */
  }
}

function getReferrerHost(isNewSession: boolean): string | null {
  try {
    if (isNewSession) {
      const ref = typeof document !== "undefined" ? document.referrer : "";
      if (!ref) {
        sessionStorage.removeItem(REFERRER_HOST_KEY);
        return null;
      }
      const url = new URL(ref);
      if (url.host === window.location.host) {
        sessionStorage.removeItem(REFERRER_HOST_KEY);
        return null;
      }
      sessionStorage.setItem(REFERRER_HOST_KEY, url.host);
      return url.host;
    }
    return sessionStorage.getItem(REFERRER_HOST_KEY);
  } catch {
    return null;
  }
}

function getLandingPath(isNewSession: boolean, currentPath: string): string {
  try {
    if (isNewSession) {
      sessionStorage.setItem(LANDING_KEY, currentPath);
      return currentPath;
    }
    return sessionStorage.getItem(LANDING_KEY) || currentPath;
  } catch {
    return currentPath;
  }
}

function isAdminPath(path: string | null | undefined): boolean {
  return !!path && (path === "/admin" || path.startsWith("/admin/"));
}

function isAdminContext(): boolean {
  try {
    return isAdminPath(window.location.pathname);
  } catch {
    return false;
  }
}

function isDntEnabled(): boolean {
  try {
    const nav = navigator as unknown as Record<string, unknown>;
    const win = window as unknown as Record<string, unknown>;
    const dnt =
      (nav.doNotTrack as string | undefined) ||
      (win.doNotTrack as string | undefined) ||
      (nav.msDoNotTrack as string | undefined);
    return dnt === "1" || dnt === "yes";
  } catch {
    return false;
  }
}

function getScreen(): string | null {
  try {
    if (typeof window === "undefined" || !window.screen) return null;
    return `${window.screen.width}x${window.screen.height}`;
  } catch {
    return null;
  }
}

function getLanguage(): string | null {
  try {
    return navigator.language || null;
  } catch {
    return null;
  }
}

// ---------- pending duration tracking ----------
let lastPageviewAt: number | null = null;
let pendingDurationMs: number | null = null;
let lastPageviewPath: string | null = null;
let pageviewDebounceTimer: number | null = null;
let lastPageviewKey: string | null = null;

// ---------- engagement timer (visibility-aware) ----------
let engagementMs = 0;
let engagementTickStart: number | null = null;
let currentPageForEngagement: string | null = null;

function engagementStart() {
  if (typeof document === "undefined") return;
  if (document.visibilityState === "visible") {
    engagementTickStart = Date.now();
  }
}

function engagementPause() {
  if (engagementTickStart != null) {
    engagementMs += Date.now() - engagementTickStart;
    engagementTickStart = null;
  }
}

function engagementFlush(useBeacon: boolean) {
  engagementPause();
  try {
    // Mesmos gates de `track()`: sem eles o flush do `pagehide` enviava a
    // linha completa (ids, UA, UTMs) mesmo com DNT, sem aceite ou no /admin.
    if (
      engagementMs >= 1000 &&
      currentPageForEngagement &&
      !isAdminPath(currentPageForEngagement) &&
      !isDntEnabled() &&
      isConsentAccepted()
    ) {
      sendEvent(
        buildRow("engagement_time", {
          path: currentPageForEngagement,
          duration_ms: Math.round(engagementMs),
        }),
        useBeacon
      );
    }
  } catch {
    /* never throw */
  }
  engagementMs = 0;
}

function engagementResetForPage(path: string) {
  engagementMs = 0;
  engagementTickStart = null;
  currentPageForEngagement = path;
  engagementStart();
}

// ---------- core send ----------
function buildRow(eventType: EventType, payload?: TrackPayload) {
  const visitor_id = ensureVisitorId();
  const { id: session_id, isNew } = getSessionId();
  const path =
    payload?.path ??
    (typeof window !== "undefined" ? window.location.pathname || "/" : null);
  const utms = getOrPersistUtms(isNew);
  persistClickIds();
  const referrer_host = getReferrerHost(isNew);
  const landing_path = path ? getLandingPath(isNew, path) : null;
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";

  // anonimiza referrer (remove querystring)
  let referrer: string | null = null;
  try {
    if (typeof document !== "undefined" && document.referrer) {
      const u = new URL(document.referrer);
      referrer = `${u.origin}${u.pathname}`;
    }
  } catch {
    /* noop */
  }

  return {
    event_type: eventType,
    session_id,
    visitor_id,
    path,
    landing_path,
    referrer,
    referrer_host,
    user_agent: ua || null,
    device: detectDevice(ua),
    browser: detectBrowser(ua),
    os: detectOS(ua),
    screen: getScreen(),
    language: getLanguage(),
    project_slug: payload?.project_slug ?? null,
    scroll_depth: payload?.scroll_depth ?? null,
    duration_ms: payload?.duration_ms ?? null,
    value: payload?.value ?? null,
    utm_source: utms.utm_source ?? null,
    utm_medium: utms.utm_medium ?? null,
    utm_campaign: utms.utm_campaign ?? null,
    utm_term: utms.utm_term ?? null,
    utm_content: utms.utm_content ?? null,
  };
}

function sendEvent(row: Record<string, unknown>, preferBeacon: boolean) {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track`;
  const json = JSON.stringify(row);

  // Beacon path (somente para unload / página fechando). Usa text/plain pra
  // evitar preflight CORS — a edge function parseia o body como JSON
  // independente do Content-Type declarado.
  if (preferBeacon && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    try {
      const blob = new Blob([json], { type: "text/plain;charset=UTF-8" });
      const ok = navigator.sendBeacon(url, blob);
      if (ok) return;
    } catch {
      /* fallback abaixo */
    }
    // fallback fetch keepalive
    try {
      void fetch(url, {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: json,
      }).catch(() => undefined);
    } catch {
      /* noop */
    }
    return;
  }

  // Caminho normal: fetch JSON com retry único em falha de rede / 5xx.
  // Não bloqueia (fire-and-forget). Erros 4xx são engolidos de propósito —
  // significam payload inválido ou bot detectado, não vale retry.
  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: json,
  })
    .then((res) => {
      if (!res.ok && res.status >= 500) {
        void fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: json,
        }).catch(() => undefined);
      }
    })
    .catch(() => undefined);
}

// ---------- public API ----------
export function track(eventType: EventType, payload?: TrackPayload): void {
  try {
    if (isDntEnabled()) return;
    if (isAdminContext()) return;
    // LGPD: sem aceite explícito do banner, nenhum evento sai. Cobre tanto
    // o caso "usuário ainda não decidiu" quanto "recusou".
    if (!isConsentAccepted()) return;
    sendEvent(buildRow(eventType, payload), false);
  } catch {
    /* never throw */
  }
}

/**
 * Registra a escolha de consentimento (aceite ou recusa) para trilha de
 * auditoria LGPD. NÃO passa pelo gate `isConsentAccepted()` — o próprio
 * evento é o registro da decisão do titular (art. 8º §2º da LGPD: ônus
 * da prova do controlador).
 *
 * Payload mínimo de verdade: tipo, rota e `{action, source, ts}`. Nada de
 * visitor_id/session_id/UTM/referrer/tela — e nada gravado no storage (antes
 * um "Recusar" criava um visitor_id de 365 dias). Chamado só pela ação
 * explícita no banner, nunca pelo evento `storage` de outras abas (que
 * duplicava o registro por aba aberta). Vai por beacon: a retirada do
 * consentimento recarrega a página logo em seguida.
 */
export function logConsentAudit(
  action: "accepted" | "declined",
  source: string = "banner"
): void {
  try {
    if (isAdminContext() || isFramed()) return;
    const row = {
      event_type: (action === "accepted" ? "consent_accept" : "consent_decline") satisfies EventType,
      path: window.location.pathname || "/",
      value: { action, source, ts: new Date().toISOString() },
    };
    sendEvent(row, true);
  } catch {
    /* never throw */
  }
}

function emitPageview() {
  const now = Date.now();
  const path = window.location.pathname || "/";
  // Chave = caminho + query. Âncora (#faq) não é página nova: o hashchange
  // de um clique em "#secao" não gera pageview.
  const key = path + window.location.search;

  if (pageviewDebounceTimer) {
    window.clearTimeout(pageviewDebounceTimer);
  }
  pageviewDebounceTimer = window.setTimeout(() => {
    pageviewDebounceTimer = null;
    if (lastPageviewKey === key) return;
    pendingDurationMs = lastPageviewAt ? now - lastPageviewAt : null;

    // flush engagement da página anterior antes de mudar
    if (currentPageForEngagement && currentPageForEngagement !== path) {
      engagementFlush(false);
    }

    track("pageview", {
      path,
      duration_ms: pendingDurationMs ?? undefined,
      value: lastPageviewPath ? { from: lastPageviewPath } : undefined,
    });

    lastPageviewPath = path;
    lastPageviewKey = key;
    lastPageviewAt = now;
    pendingDurationMs = null;
    scrollDepthFired.clear();
    engagementResetForPage(path);
  }, 250);
}

const scrollDepthFired = new Set<number>();

function onScroll() {
  try {
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop;
    const docHeight = doc.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    const pct = Math.min(100, Math.round((scrollTop / docHeight) * 100));
    for (const milestone of [25, 50, 75, 100]) {
      if (pct >= milestone && !scrollDepthFired.has(milestone)) {
        scrollDepthFired.add(milestone);
        track("scroll_depth", { scroll_depth: milestone });
      }
    }
  } catch {
    /* noop */
  }
}

function parseDataValue(raw: string | undefined): Record<string, unknown> | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { raw };
  }
}

/**
 * Classifica um href de contato. WhatsApp (wa.me, api/web.whatsapp.com,
 * whatsapp:) → `click_whatsapp`; telefone → `click_phone` (antes `tel:` era
 * contado como WhatsApp); e-mail → `click_contact`. `null` = não é contato.
 */
export function contactEventForHref(
  href: string
): {
  type: "click_whatsapp" | "click_phone" | "click_contact";
  channel: "whatsapp" | "phone" | "email";
} | null {
  const h = (href || "").trim();
  if (
    /^whatsapp:/i.test(h) ||
    /^(?:https?:)?\/\/(?:wa\.me|(?:api|web)\.whatsapp\.com)(?:[/?#]|$)/i.test(h)
  ) {
    return { type: "click_whatsapp", channel: "whatsapp" };
  }
  if (/^tel:/i.test(h)) return { type: "click_phone", channel: "phone" };
  if (/^mailto:/i.test(h)) return { type: "click_contact", channel: "email" };
  return null;
}

function onClick(e: MouseEvent) {
  try {
    // `closestElementFrom`: o target pode ser o próprio `document` ou um nó
    // de texto (ver FE-01) — `closest` direto lançava.
    const link = closestElementFrom(e.target)?.closest<HTMLElement>("a, button");
    if (!link) return;

    const trackAttr = link.dataset.track;
    const valueAttr = link.dataset.value;
    const href = link.getAttribute("href") || "";
    const cta = link.dataset.cta || undefined;

    if (trackAttr) {
      const value = parseDataValue(valueAttr) ?? (href ? { href } : undefined);
      track(trackAttr as EventType, { value });
      return;
    }

    if (link.tagName !== "A" || !href) return;

    // Um evento por clique: contato tem precedência sobre "saída" (um clique
    // no WhatsApp é conversão, não abandono).
    const contact = contactEventForHref(href);
    if (contact) {
      track(contact.type, { value: { href, channel: contact.channel, ...(cta ? { cta } : {}) } });
      return;
    }

    // outbound (http/https para outro host)
    if (/^https?:\/\//i.test(href)) {
      try {
        const url = new URL(href);
        if (url.host !== window.location.host) {
          track("outbound_click", { value: { href } });
        }
      } catch {
        /* noop */
      }
    }
  } catch {
    /* noop */
  }
}

function onVisibilityChange() {
  if (document.visibilityState === "visible") {
    engagementStart();
  } else {
    engagementPause();
  }
}

function onPageHide() {
  engagementFlush(true);
}

let initialized = false;
let consentUnsub: (() => void) | null = null;

/** Zera o estado em memória do tracker (recusa / cleanup). */
function resetTrackerState() {
  if (pageviewDebounceTimer) window.clearTimeout(pageviewDebounceTimer);
  pageviewDebounceTimer = null;
  lastPageviewAt = null;
  pendingDurationMs = null;
  lastPageviewPath = null;
  lastPageviewKey = null;
  engagementMs = 0;
  engagementTickStart = null;
  currentPageForEngagement = null;
  scrollDepthFired.clear();
}

function attachListeners(): () => void {
  // pageview inicial — track() já gateia por consentimento, então emitir aqui
  // antes do aceite vira no-op em vez de vazar dados.
  emitPageview();

  const onRouteChange = () => emitPageview();
  window.addEventListener("popstate", onRouteChange);
  window.addEventListener("hashchange", onRouteChange);
  window.addEventListener("lovable:navigate", onRouteChange);
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("click", onClick, true);
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pagehide", onPageHide);

  return () => {
    window.removeEventListener("popstate", onRouteChange);
    window.removeEventListener("hashchange", onRouteChange);
    window.removeEventListener("lovable:navigate", onRouteChange);
    window.removeEventListener("scroll", onScroll);
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pagehide", onPageHide);
    if (pageviewDebounceTimer) window.clearTimeout(pageviewDebounceTimer);
  };
}

/**
 * Atribuição persistida pelo tracker (só existe quando o visitante aceitou
 * cookies e o tracker rodou). Usada como fallback pelo formulário de lead.
 */
export function readPersistedAttribution(now: number = Date.now()): {
  sessionUtm: Utm | null;
  firstUtm: Utm | null;
  referrerHost: string | null;
  landingPath: string | null;
  /** gclid/fbclid dos últimos 90 dias, com o instante em que foram vistos. */
  clickIds: { gclid: string | null; fbclid: string | null; fbclidSeenAt: number | null } | null;
} {
  const parse = (raw: string | null): Utm | null => {
    if (!raw) return null;
    try {
      const v = JSON.parse(raw) as Utm;
      return v && typeof v === "object" ? v : null;
    } catch {
      return null;
    }
  };
  const fresh = (ts: number | undefined) => typeof ts === "number" && now - ts >= 0 && now - ts < CLICK_MAX_AGE;
  try {
    const click = readStoredClick();
    const gclid = click.gclid && fresh(click.gclid_ts) ? click.gclid : null;
    const fbclid = click.fbclid && fresh(click.fbclid_ts) ? click.fbclid : null;
    return {
      sessionUtm: parse(sessionStorage.getItem(UTM_KEY)),
      firstUtm: parse(localStorage.getItem(FIRST_UTM_KEY)),
      referrerHost: sessionStorage.getItem(REFERRER_HOST_KEY),
      landingPath: sessionStorage.getItem(LANDING_KEY),
      clickIds:
        gclid || fbclid ? { gclid, fbclid, fbclidSeenAt: fbclid ? (click.fbclid_ts ?? null) : null } : null,
    };
  } catch {
    return { sessionUtm: null, firstUtm: null, referrerHost: null, landingPath: null, clickIds: null };
  }
}

export function initAnalytics(): () => void {
  if (typeof window === "undefined") return () => undefined;
  if (initialized) return () => undefined;
  initialized = true;

  // Gate LGPD: se o usuário já aceitou, anexa listeners agora; senão,
  // anexa só quando o consentimento mudar para "accepted". Recusa ou
  // ausência de decisão mantém o app totalmente silencioso. Recusar depois
  // de aceitar (nesta aba ou em outra) desliga tudo e apaga o storage.
  let detachListeners: (() => void) | null = isConsentAccepted() ? attachListeners() : null;

  consentUnsub = onConsentChange((v) => {
    if (v === "accepted") {
      if (!detachListeners) detachListeners = attachListeners();
      return;
    }
    detachListeners?.();
    detachListeners = null;
    resetTrackerState();
    purgeAnalyticsStorage();
  });

  return () => {
    detachListeners?.();
    detachListeners = null;
    consentUnsub?.();
    consentUnsub = null;
    resetTrackerState();
    initialized = false;
  };
}
