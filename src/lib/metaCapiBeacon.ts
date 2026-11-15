/**
 * PageView / ViewContent pelo servidor (API de Conversões da Meta) para TODA
 * visita humana, com ou sem aceite de cookies.
 *
 * Por quê: o Pixel só carrega após o aceite do banner, então o conjunto
 * "Dados bwild" recebia ~6% dos PageViews. Decisão de 27/10/2026: o
 * navegador avisa a edge function `meta-pageview` a cada página vista
 * (IP + user-agent como identificadores, nada gravado no banco), e o Pixel,
 * quando há aceite, dispara o mesmo evento com o MESMO `eventID` — a Meta
 * deduplica pelo par (nome, id) e conta uma vez.
 *
 * Portões deste módulo (os únicos): fora do /admin, só no navegador (nunca no
 * SSR), nunca com `navigator.webdriver` (automação) e nunca dentro de iframe
 * (auditoria de SEO do admin). O aceite de cookies NÃO é portão — é o ponto.
 * `_fbp`/`_fbc` só vão se os cookies já existirem (o Pixel os cria após o
 * aceite); este módulo nunca cria cookie.
 *
 * Falhas são engolidas: a medição nunca quebra a página. Tudo sai de funções
 * exportadas ("sideEffects": false — import só de efeito colateral some do
 * build).
 */
import { isFramed } from "@/lib/cookieConsent";
import { readMetaBrowserIds } from "@/lib/metaPixel";

export type MetaServerEvent = "PageView" | "ViewContent";

export type MetaServerEventOptions = {
  /** Mesmo id que o Pixel usa em `fbq('track', ..., { eventID })`. */
  eventId: string;
  contentName?: string | null;
  contentType?: string | null;
  contentCategory?: string | null;
  contentIds?: readonly string[] | null;
  /** URL da página; padrão `window.location.href`. */
  url?: string;
};

export const META_PAGEVIEW_FUNCTION = "meta-pageview";

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/** Endereço da edge function, ou `null` sem `VITE_SUPABASE_URL` (testes, build quebrado). */
export function metaPageviewEndpoint(supabaseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL): string | null {
  const base = (supabaseUrl ?? "").trim().replace(/\/+$/, "");
  return base ? `${base}/functions/v1/${META_PAGEVIEW_FUNCTION}` : null;
}

/**
 * A página atual pode mandar eventos ao servidor? Falso no SSR, no /admin,
 * em automação (`navigator.webdriver`) e dentro de iframe.
 */
export function canSendMetaServerEvent(): boolean {
  try {
    if (typeof window === "undefined" || typeof document === "undefined") return false;
    if (isAdminPath(window.location.pathname)) return false;
    if (typeof navigator !== "undefined" && navigator.webdriver) return false;
    if (isFramed()) return false;
    return true;
  } catch {
    return false;
  }
}

/** Corpo do POST (exportado para os testes; nada de dado pessoal). */
export function buildMetaServerPayload(event: MetaServerEvent, opts: MetaServerEventOptions): Record<string, unknown> {
  const body: Record<string, unknown> = {
    event,
    event_id: opts.eventId,
    url: opts.url ?? window.location.href,
  };
  const { fbp, fbc } = readMetaBrowserIds();
  if (fbp) body.fbp = fbp;
  if (fbc) body.fbc = fbc;
  if (opts.contentName) body.content_name = String(opts.contentName).slice(0, 200);
  if (opts.contentType) body.content_type = opts.contentType;
  if (opts.contentCategory) body.content_category = opts.contentCategory;
  if (opts.contentIds?.length) body.content_ids = opts.contentIds.slice(0, 10);
  return body;
}

/**
 * Manda o evento à edge function. `sent` = POST disparado (fire-and-forget);
 * `blocked` = portão fechado ou sem endereço. Nunca lança.
 */
export function sendMetaServerEvent(event: MetaServerEvent, opts: MetaServerEventOptions): "sent" | "blocked" {
  try {
    if (!opts.eventId || !canSendMetaServerEvent()) return "blocked";
    const url = metaPageviewEndpoint();
    if (!url || typeof fetch !== "function") return "blocked";
    const headers: Record<string, string> = { "content-type": "application/json" };
    const apikey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "").trim();
    if (apikey) headers.apikey = apikey;
    void fetch(url, {
      method: "POST",
      keepalive: true,
      headers,
      body: JSON.stringify(buildMetaServerPayload(event, opts)),
    }).catch(() => undefined);
    return "sent";
  } catch {
    return "blocked";
  }
}
