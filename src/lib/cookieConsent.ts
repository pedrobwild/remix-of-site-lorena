/**
 * Estado central de consentimento LGPD.
 *
 * O banner em `src/components/CookieBanner.tsx` é a UI; este módulo é o
 * single-source-of-truth lido por todo o resto do app (analytics, trackers,
 * scripts injetados por `useSeo`). Nada deve ler `localStorage` direto:
 * sempre passar por `isConsentAccepted()` ou `onConsentChange(...)`.
 *
 * Decisão arquitetural:
 *  - Cookies essenciais (auth do Supabase, preferência do banner) ficam fora
 *    do gate — eles são necessários para o site funcionar.
 *  - Tudo que é analytics/marketing (track(), GA4, GTM, Meta Pixel, Hotjar,
 *    Clarity) só roda depois que `setConsent("accepted")` é chamado.
 *  - Quando o usuário aceita após carregar a página, disparamos o
 *    `CustomEvent("cookie:consent-change")` para que os subsistemas que rodam
 *    uma única vez (initAnalytics, injectTrackers) possam se "engajar" sem
 *    exigir reload.
 *  - Retirada do consentimento (Aceitar → depois Recusar em "Preferências de
 *    cookies", nesta aba ou em outra): scripts de terceiros já carregados não
 *    têm como ser "descarregados". `installConsentWithdrawalGuard` avisa os
 *    SDKs (Consent Mode do Google, `fbq('consent','revoke')`), expira os
 *    cookies first-party dos trackers e recarrega a página — que volta limpa,
 *    porque os trackers só são injetados depois do aceite.
 */

const STORAGE_KEY = "lal_cookie_consent";
const CONSENT_EVENT = "cookie:consent-change";
export const OPEN_PREFERENCES_EVENT = "cookie:open-preferences";

/**
 * Reabre o banner de cookies para o usuário trocar a escolha.
 * Útil para LGPD (direito de retirar consentimento) e para testes.
 */
export function openCookiePreferences(): void {
  try {
    window.dispatchEvent(new CustomEvent(OPEN_PREFERENCES_EVENT));
  } catch {
    /* ambiente sem CustomEvent */
  }
}

export type Consent = "accepted" | "declined";

type ConsentChangeDetail = { value: Consent; previous: Consent | null };

const isConsent = (v: unknown): v is Consent => v === "accepted" || v === "declined";

export function readConsent(): Consent | null {
  try {
    if (typeof window === "undefined") return null;
    const v = window.localStorage.getItem(STORAGE_KEY);
    return isConsent(v) ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(value: Consent): void {
  const previous = readConsent();
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* modo privado / storage cheio — silencia */
  }
  try {
    window.dispatchEvent(
      new CustomEvent<ConsentChangeDetail>(CONSENT_EVENT, { detail: { value, previous } })
    );
  } catch {
    /* CustomEvent indisponível (testes muito antigos) */
  }
}

/**
 * A página está dentro de um frame? A auditoria de SEO do admin carrega as
 * páginas públicas num iframe oculto — esse carregamento não é visita. Tudo
 * que passa por `isConsentAccepted` (tracker interno, GA4, Meta Pixel,
 * trackers injetados, embeds) já fica bloqueado; só os caminhos fora desse
 * gate (auditoria de consentimento, log de 404) checam isto explicitamente.
 */
export function isFramed(): boolean {
  try {
    return typeof window !== "undefined" && window.self !== window.top;
  } catch {
    // Acesso a `top` bloqueado = frame de outra origem.
    return true;
  }
}

/**
 * Único portão de todos os trackers (GA4, Meta Pixel, tracker interno,
 * GTM/Clarity/Hotjar e embeds de terceiros). Dentro de um frame nada rastreia.
 */
export function isConsentAccepted(): boolean {
  return !isFramed() && readConsent() === "accepted";
}

/**
 * Assina mudanças de consentimento (mesma aba ou outras abas via `storage`).
 * O handler recebe o valor novo e o anterior (`null` = ainda não decidido),
 * o que permite distinguir "recusou de primeira" de "retirou o aceite".
 * Retorna função de cleanup.
 */
export function onConsentChange(
  handler: (value: Consent, previous: Consent | null) => void
): () => void {
  if (typeof window === "undefined") return () => undefined;

  const onCustom = (e: Event) => {
    const detail = (e as CustomEvent<ConsentChangeDetail>).detail;
    if (detail && isConsent(detail.value)) {
      handler(detail.value, isConsent(detail.previous) ? detail.previous : null);
    }
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    if (isConsent(e.newValue)) {
      handler(e.newValue, isConsent(e.oldValue) ? e.oldValue : null);
    }
  };

  window.addEventListener(CONSENT_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CONSENT_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

// ---------------------------------------------------------------------------
// Retirada do consentimento
// ---------------------------------------------------------------------------

/**
 * Prefixos dos cookies first-party gravados pelos trackers que o site injeta:
 * GA4/Google Ads (`_ga`, `_ga_<id>`, `_gat*`, `_gid`, `_gcl_*`), Meta Pixel
 * (`_fbp`, `_fbc`), Microsoft Clarity (`_clck`, `_clsk`) e Hotjar (`_hj*`).
 */
export const TRACKER_COOKIE_PREFIXES = [
  "_ga",
  "_gid",
  "_gcl",
  "_fbp",
  "_fbc",
  "_clck",
  "_clsk",
  "_hj",
] as const;

/**
 * Domínios em que um tracker pode ter gravado o cookie: o host atual e cada
 * domínio-pai (o GA grava em `.bewild.com.br` mesmo servido por `www.`).
 * Sufixos públicos (`com.br`) são recusados pelo navegador em silêncio.
 */
export function cookieDomainCandidates(hostname: string): string[] {
  const host = (hostname || "").toLowerCase();
  if (!host.includes(".") || /^[\d.]+$/.test(host) || host.includes(":")) return [];
  const labels = host.split(".");
  const out: string[] = [];
  for (let i = 0; i < labels.length - 1; i++) out.push(labels.slice(i).join("."));
  return out;
}

/** Expira os cookies dos trackers no host atual e nos domínios-pai. */
export function expireTrackerCookies(): void {
  if (typeof document === "undefined") return;
  let names: string[] = [];
  try {
    names = document.cookie
      .split(";")
      .map((c) => c.split("=")[0]?.trim() ?? "")
      .filter((n) => n && TRACKER_COOKIE_PREFIXES.some((p) => n.startsWith(p)));
  } catch {
    return;
  }
  if (names.length === 0) return;
  const domains = [undefined, ...cookieDomainCandidates(window.location.hostname)];
  for (const name of names) {
    for (const domain of domains) {
      try {
        document.cookie =
          `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; path=/` +
          (domain ? `; domain=${domain}` : "");
      } catch {
        /* cookie bloqueado pelo navegador — segue */
      }
    }
  }
}

type TrackerWindow = Window & {
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
};

/**
 * Avisa os SDKs já carregados de que o consentimento foi retirado e apaga os
 * cookies deles. Não recarrega — ver `installConsentWithdrawalGuard`.
 */
export function revokeTrackingConsent(): void {
  if (typeof window === "undefined") return;
  const w = window as TrackerWindow;
  try {
    if (typeof w.gtag === "function") {
      w.gtag("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    }
  } catch {
    /* SDK quebrado não pode impedir a retirada */
  }
  try {
    if (typeof w.fbq === "function") w.fbq("consent", "revoke");
  } catch {
    /* idem */
  }
  expireTrackerCookies();
}

/**
 * Instala (uma vez, no bootstrap) a reação à recusa:
 *  - qualquer "Recusar" expira os cookies de trackers que tenham sobrado;
 *  - "Aceitar → Recusar" (nesta aba ou em outra) também revoga o consentimento
 *    nos SDKs e recarrega a página, que volta sem nenhum tracker carregado.
 * `reload` é injetável para teste. Retorna o cleanup do listener.
 */
export function installConsentWithdrawalGuard(
  reload: () => void = () => window.location.reload()
): () => void {
  return onConsentChange((value, previous) => {
    if (value !== "declined") return;
    if (previous !== "accepted") {
      expireTrackerCookies();
      return;
    }
    revokeTrackingConsent();
    // Assíncrono: deixa os demais listeners do evento (ex.: limpeza do
    // storage do analytics) rodarem antes de a página ir embora.
    window.setTimeout(reload, 0);
  });
}
