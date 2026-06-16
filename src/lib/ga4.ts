/**
 * GA4 — carregamento gated por consentimento LGPD.
 *
 * - `initGa4()` injeta o gtag.js + `config` UMA única vez. Reentrante.
 * - `trackPageView(path)` envia um `page_view` manual (necessário porque o
 *   site usa um router hash custom — o enhanced measurement do GA4 não
 *   detecta de forma confiável).
 * - `trackEvent(name, params)` repassa para `gtag('event', ...)`.
 *
 * Todas as funções são no-op se o consentimento não foi aceito OU se o
 * init ainda não rodou. Nenhuma requisição ao GA4 sai antes do "Aceitar".
 */
import { isConsentAccepted } from "@/lib/cookieConsent";

export const GA4_MEASUREMENT_ID = "G-CE7GKKDG4L";

type GtagFn = (...args: unknown[]) => void;
type WindowWithGtag = Window & {
  dataLayer?: unknown[];
  gtag?: GtagFn;
  __bewildGa4Inited?: boolean;
};

function isAdminPath(): boolean {
  try {
    return window.location.pathname.startsWith("/admin");
  } catch {
    return false;
  }
}

export function initGa4(): void {
  if (typeof window === "undefined") return;
  const w = window as WindowWithGtag;
  if (w.__bewildGa4Inited) return;
  if (!isConsentAccepted()) return;
  if (isAdminPath()) return;

  w.dataLayer = w.dataLayer || [];
  function gtag(..._args: unknown[]) {
    // IMPORTANTE: empurra o objeto `arguments` real (não um array via spread).
    // O gtag.js só reconhece comandos quando o item do dataLayer é um
    // [object Arguments]; um array puro é ignorado e nenhum /g/collect sai.
    // eslint-disable-next-line prefer-rest-params
    (w.dataLayer as unknown[]).push(arguments);
  }
  w.gtag = gtag as unknown as GtagFn;

  gtag("js", new Date());
  // send_page_view:false — disparamos manualmente em cada troca de rota
  // do router hash, para evitar duplicidade / falsos negativos.
  gtag("config", GA4_MEASUREMENT_ID, { send_page_view: false });

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
  document.head.appendChild(s);

  w.__bewildGa4Inited = true;

  // Primeiro page_view após init.
  trackPageView(window.location.pathname + window.location.search);
}

export function trackPageView(path: string): void {
  if (typeof window === "undefined") return;
  const w = window as WindowWithGtag;
  if (!w.__bewildGa4Inited || !w.gtag) return;
  if (!isConsentAccepted()) return;
  w.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const w = window as WindowWithGtag;
  if (!w.__bewildGa4Inited || !w.gtag) return;
  if (!isConsentAccepted()) return;
  w.gtag("event", name, params || {});
}
