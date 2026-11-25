/**
 * Contador completo de visitas — Vercel Web Analytics (25/11/2026, pedido do
 * Pedro).
 *
 * Por quê: desde 08/11/2026 o site é servido pela Vercel e o contador da
 * hospedagem antiga zerou; o tracker próprio e o GA4 só medem quem aceita os
 * cookies (~3% das visitas). O Web Analytics da Vercel conta as páginas
 * vistas sem gravar cookie nem identificador no aparelho, então roda COM OU
 * SEM aceite — por isso está descrito nas políticas de privacidade e de
 * cookies (mudou o que ele envia? atualize as duas páginas).
 *
 * Sem dependência nova: é o mesmo carregamento do `inject()` de
 * `@vercel/analytics` 2.x (fila `window.va` + `<script defer>`), que para
 * React + Vite não lê a configuração do build sozinho. O caminho do script
 * vem de `VITE_VERCEL_OBSERVABILITY_CLIENT_CONFIG`, que a Vercel preenche no
 * build com um caminho único por projeto (menos bloqueado por extensões);
 * sem ela, vale o caminho fixo `/_vercel/insights/script.js`.
 *
 * Portões (os únicos): só no navegador, só em bewild.com.br (prévias da
 * Vercel, Lovable e localhost ficam de fora), fora do /admin, nunca em
 * aparelho do time (`bw:interno`), em automação (`navigator.webdriver`) nem
 * dentro de iframe. O aceite de cookies NÃO é portão — é o ponto.
 *
 * Antes de cada envio, `vercelAnalyticsBeforeSend` descarta o que for do
 * /admin ou de aparelho do time e reduz a URL ao caminho + `utm_*`: nada de
 * identificador de clique (gclid, fbclid), e-mail, telefone, token ou âncora.
 *
 * Falhas são engolidas: a medição nunca quebra a página. Tudo sai de funções
 * exportadas ("sideEffects": false — import só de efeito colateral some do
 * build).
 */
import { telemetryUrlWithCampaign } from "@/../supabase/functions/_shared/telemetry-privacy";
import { isFramed } from "@/lib/cookieConsent";
import { isInternalTraffic } from "@/lib/internalTraffic";

/** Único domínio contado. `www` responde 301 para a raiz e nunca renderiza. */
export const VERCEL_ANALYTICS_HOST = "bewild.com.br";
/** Caminho fixo, criado pela Vercel quando o Web Analytics é ligado no projeto. */
export const VERCEL_ANALYTICS_DEFAULT_SRC = "/_vercel/insights/script.js";

export type VercelAnalyticsEvent = { type: "pageview" | "event"; url: string };

export type VercelAnalyticsConfig = {
  scriptSrc: string;
  viewEndpoint?: string;
  eventEndpoint?: string;
  sessionEndpoint?: string;
};

type VaWindow = Window & { va?: (...args: unknown[]) => void; vaq?: unknown[][] };

const SCRIPT_MARK = "data-bw-contador";
const ENDPOINT_KEYS = ["viewEndpoint", "eventEndpoint", "sessionEndpoint"] as const;

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/**
 * Caminho do próprio site, sempre a partir da raiz. A Vercel entrega os
 * caminhos SEM barra inicial (`9ad84bcd3a88df0f/script.js`, visto no build de
 * 25/11/2026), e o `@vercel/analytics` põe a barra (`makeAbsolute`); aqui é
 * igual. Nunca outro domínio nem outro esquema: `https://…`, `//…`,
 * `javascript:…`, barra invertida ou espaço caem fora.
 */
function sameSitePath(value: unknown): string | null {
  if (typeof value !== "string" || !value || /[\s\\]/.test(value)) return null;
  if (value.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(value)) return null;
  return value.startsWith("/") ? value : `/${value}`;
}

/**
 * Lê a configuração que a Vercel entrega no build
 * (`{"analytics":{"scriptSrc":"<caminho único>/script.js",…}}`). Qualquer
 * coisa fora do formato — ausente, JSON quebrado, endereço de outro domínio —
 * cai no caminho fixo, sem destinos próprios.
 */
export function vercelAnalyticsConfig(
  confString: string | undefined = import.meta.env.VITE_VERCEL_OBSERVABILITY_CLIENT_CONFIG,
): VercelAnalyticsConfig {
  const padrao: VercelAnalyticsConfig = { scriptSrc: VERCEL_ANALYTICS_DEFAULT_SRC };
  if (!confString) return padrao;
  try {
    const analytics = (JSON.parse(confString) as { analytics?: Record<string, unknown> } | null)?.analytics;
    const scriptSrc = sameSitePath(analytics?.scriptSrc);
    if (!analytics || !scriptSrc) return padrao;
    const config: VercelAnalyticsConfig = { scriptSrc };
    for (const key of ENDPOINT_KEYS) {
      const endpoint = sameSitePath(analytics[key]);
      if (endpoint) config[key] = endpoint;
    }
    return config;
  } catch {
    return padrao;
  }
}

/**
 * Esta visita entra na contagem? Falso no SSR, fora de bewild.com.br, no
 * /admin, em aparelho do time, em automação e dentro de iframe.
 */
export function canCountVisit(hostname?: string): boolean {
  try {
    if (typeof window === "undefined" || typeof document === "undefined") return false;
    if ((hostname ?? window.location.hostname) !== VERCEL_ANALYTICS_HOST) return false;
    if (isAdminPath(window.location.pathname)) return false;
    if (typeof navigator !== "undefined" && navigator.webdriver) return false;
    if (isFramed()) return false;
    return !isInternalTraffic();
  } catch {
    return false;
  }
}

/**
 * Filtro que o script da Vercel chama antes de cada envio. `null` cancela o
 * envio. O script já está na página quando a pessoa navega para o /admin ou
 * marca o aparelho com `?bw_interno=1`, por isso a checagem se repete aqui.
 */
export function vercelAnalyticsBeforeSend(event: VercelAnalyticsEvent): VercelAnalyticsEvent | null {
  try {
    const limpa = telemetryUrlWithCampaign(event.url);
    if (!limpa) return null;
    const url = new URL(limpa, window.location.origin);
    if (!/^https?:$/.test(url.protocol)) return null;
    if (isAdminPath(url.pathname) || isInternalTraffic()) return null;
    for (const key of [...url.searchParams.keys()]) {
      if (!key.startsWith("utm_")) url.searchParams.delete(key);
    }
    return { ...event, url: url.toString() };
  } catch {
    return null;
  }
}

/**
 * Liga o contador: cria a fila `window.va`, registra o filtro de URL e põe o
 * script da Vercel no `<head>`. Idempotente. `installed` = script pedido
 * agora; `already` = já estava na página; `blocked` = portão fechado.
 * Nunca lança.
 */
export function installVercelAnalytics(
  opts: { hostname?: string; confString?: string } = {},
): "installed" | "already" | "blocked" {
  try {
    if (!canCountVisit(opts.hostname)) return "blocked";
    if (document.head.querySelector(`script[${SCRIPT_MARK}]`)) return "already";
    const w = window as VaWindow;
    if (!w.va) {
      w.va = (...params: unknown[]) => {
        (w.vaq = w.vaq || []).push(params);
      };
    }
    w.va("beforeSend", vercelAnalyticsBeforeSend);
    const config = opts.confString === undefined ? vercelAnalyticsConfig() : vercelAnalyticsConfig(opts.confString);
    const script = document.createElement("script");
    script.src = config.scriptSrc;
    script.defer = true;
    script.setAttribute(SCRIPT_MARK, "");
    for (const key of ENDPOINT_KEYS) {
      const endpoint = config[key];
      if (endpoint) script.dataset[key] = endpoint;
    }
    document.head.appendChild(script);
    return "installed";
  } catch {
    return "blocked";
  }
}
