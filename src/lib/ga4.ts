/**
 * GA4 — carregamento gated por consentimento LGPD.
 *
 * - `initGa4()` injeta o gtag.js + `config` UMA única vez. Reentrante. Não
 *   envia page_view: quem envia é o Root (main.tsx), depois que a página
 *   exibida montou e aplicou o próprio título — antes, init + efeito de rota
 *   + remontagem do hook de rota davam 3 page_views na entrada, e o título
 *   enviado era o da página anterior.
 * - `trackPageView(path)` envia um `page_view` manual (necessário porque o
 *   site é uma SPA com router próprio), deduplicado por caminho+query:
 *   âncoras (#faq) e re-renders não viram visualização nova.
 * - `trackEvent(name, params)` repassa para `gtag('event', ...)`.
 *
 * Todas as funções são no-op se o consentimento não foi aceito (o que inclui
 * página dentro de iframe — ver `isConsentAccepted`), se o init ainda não
 * rodou ou se a rota é /admin. Nenhuma requisição ao GA4 sai antes
 * do "Aceitar".
 */
import { isConsentAccepted } from "@/lib/cookieConsent";
import { telemetryUrl, telemetryUrlWithCampaign, telemetryValue } from "@/../supabase/functions/_shared/telemetry-privacy";
import { ensureGoogleTagScript } from "@/lib/whenIdle";
import { googleAdsProfileVariables } from "@/lib/googleAdsProfileVariables";

export const GA4_MEASUREMENT_ID = "G-CE7GKKDG4L";

type GtagFn = (...args: unknown[]) => void;
type WindowWithGtag = Window & {
  dataLayer?: unknown[];
  gtag?: GtagFn;
  __bewildGa4Inited?: boolean;
};

function isAdminPath(): boolean {
  try {
    const p = window.location.pathname;
    return p === "/admin" || p.startsWith("/admin/");
  } catch {
    return false;
  }
}

/** Último page_view enviado (caminho+query) e a URL dele (page_referrer). */
let lastPageViewKey: string | null = null;
let lastPageLocation: string | null = null;

export function initGa4(): void {
  if (typeof window === "undefined") return;
  const w = window as WindowWithGtag;
  if (w.__bewildGa4Inited) return;
  if (!isConsentAccepted()) return;
  if (isAdminPath()) return;

  w.dataLayer = w.dataLayer || [];
  // Reaproveita um gtag já definido (ex.: GA4 extra injetado por useSeo).
  if (typeof w.gtag !== "function") {
    w.gtag = function gtag(..._args: unknown[]) {
      // IMPORTANTE: empurra o objeto `arguments` real (não um array via spread).
      // O gtag.js só reconhece comandos quando o item do dataLayer é um
      // [object Arguments]; um array puro é ignorado e nenhum /g/collect sai.
      // eslint-disable-next-line prefer-rest-params
      (w.dataLayer as unknown[]).push(arguments);
    } as GtagFn;
  }
  const gtag = w.gtag;

  gtag("js", new Date());
  // send_page_view:false — disparamos manualmente a cada página exibida,
  // para evitar duplicidade / falsos negativos.
  gtag("config", GA4_MEASUREMENT_ID, {
    send_page_view: false,
    page_location: telemetryUrlWithCampaign(window.location.href),
    page_referrer: document.referrer ? telemetryUrl(document.referrer, true) : "",
  });

  // gtag.js (~150 KB) entra depois do `load` e de um momento ocioso, como o
  // fbevents do Pixel (useSeo.ts): os comandos acima ficam na fila do
  // dataLayer e saem quando o script chega. Assim ele não disputa a rede e a
  // linha principal com a imagem do topo e com o primeiro toque (INP de
  // 212 ms no CrUX de out/2026).
  ensureGoogleTagScript("ga4-primary-loader", GA4_MEASUREMENT_ID);

  w.__bewildGa4Inited = true;
}

/**
 * `page_view` da página atual. `path` = pathname + search; repetido em
 * sequência (âncora, re-render, init + rota) é ignorado.
 */
export function trackPageView(path: string): void {
  if (typeof window === "undefined") return;
  const w = window as WindowWithGtag;
  if (!w.__bewildGa4Inited || !w.gtag) return;
  if (!isConsentAccepted()) return;
  if (isAdminPath()) return;
  if (path === lastPageViewKey) return;
  const location = telemetryUrlWithCampaign(window.location.href);
  w.gtag("event", "page_view", {
    page_path: telemetryUrl(path),
    page_location: location,
    page_title: document.title,
    // Numa SPA o document.referrer fica congelado no referrer externo da
    // entrada; a partir da 2ª página, o referrer real é a página anterior.
    page_referrer: lastPageLocation ?? (document.referrer ? telemetryUrl(document.referrer, true) : ""),
  });
  lastPageViewKey = path;
  lastPageLocation = telemetryUrl(window.location.href);
}

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const w = window as WindowWithGtag;
  if (!w.__bewildGa4Inited || !w.gtag) return;
  if (!isConsentAccepted()) return;
  if (isAdminPath()) return;
  // Busca por bairro aceita somente categorias conhecidas, nunca texto livre.
  const searchBairro = name === "search" && params?.search_type === "bairro"
    ? googleAdsProfileVariables({ bairro: typeof params.search_term === "string" ? params.search_term : null }).imovel_bairro
    : null;
  if (name === "search" && params?.search_type === "bairro" && !searchBairro) return;
  w.gtag("event", name, {
    ...(name === "cta_click" ? googleAdsProfileVariables({
      bairro: window.location.pathname.match(/^\/reforma\/([^/]+)$/)?.[1]?.replace(/-/g, " "),
    }) : {}),
    ...telemetryValue(params),
    ...(searchBairro ? { search_term: searchBairro, imovel_bairro: searchBairro } : {}),
    page_location: telemetryUrlWithCampaign(window.location.href),
    page_referrer: lastPageLocation ?? (document.referrer ? telemetryUrl(document.referrer, true) : ""),
  });
}

/** Só para testes: esquece o último page_view enviado. */
export function __resetGa4PageViewDedupe(): void {
  lastPageViewKey = null;
  lastPageLocation = null;
}
