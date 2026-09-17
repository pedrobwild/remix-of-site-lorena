/**
 * Preservação de parâmetros de campanha na navegação interna e na
 * atribuição do lead.
 *
 * Problema medido (16/09/2026): 22 de 38 leads sem UTM. O visitante chega em
 * `/?utm_source=x`, clica em "Solicitar orçamento" → `/diagnostico` (sem
 * query) → o formulário lia `window.location.search` no envio e mandava
 * `utm_* = null`.
 *
 * Duas camadas, sem cookie novo e sem depender de consentimento:
 *  1. `carryCampaignParams`: a navegação SPA interna carrega os parâmetros
 *     de campanha da URL atual para o destino (só quando o destino não tem
 *     os seus próprios). Mecanismo de URL, transparente para o usuário.
 *  2. `resolveLeadAttribution`: no envio, ordem de precedência
 *     URL atual → last-touch da sessão → first-touch do visitante (estes
 *     dois só existem quando o tracker interno rodou, i.e. com aceite).
 */

export const CAMPAIGN_PARAM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
] as const;

export type CampaignParamKey = (typeof CAMPAIGN_PARAM_KEYS)[number];

function pickCampaignParams(search: string): URLSearchParams {
  const out = new URLSearchParams();
  let src: URLSearchParams;
  try {
    src = new URLSearchParams(search);
  } catch {
    return out;
  }
  for (const k of CAMPAIGN_PARAM_KEYS) {
    const v = src.get(k);
    if (v) out.set(k, v);
  }
  return out;
}

/**
 * Devolve `target` com os parâmetros de campanha de `currentSearch`
 * anexados, quando fizer sentido. Não toca em: rotas `/admin`, destinos que
 * já trazem parâmetro de campanha, ou quando a URL atual não tem nenhum.
 */
export function carryCampaignParams(target: string, currentSearch: string): string {
  if (!target.startsWith("/")) return target;
  if (target === "/admin" || target.startsWith("/admin/")) return target;

  const carried = pickCampaignParams(currentSearch);
  if (![...carried.keys()].length) return target;

  const hashIdx = target.indexOf("#");
  const hash = hashIdx === -1 ? "" : target.slice(hashIdx);
  const beforeHash = hashIdx === -1 ? target : target.slice(0, hashIdx);
  const qIdx = beforeHash.indexOf("?");
  const path = qIdx === -1 ? beforeHash : beforeHash.slice(0, qIdx);
  const targetSearch = qIdx === -1 ? "" : beforeHash.slice(qIdx + 1);

  const merged = new URLSearchParams(targetSearch);
  if ([...pickCampaignParams(targetSearch).keys()].length) return target;
  carried.forEach((v, k) => merged.set(k, v));

  return `${path}?${merged.toString()}${hash}`;
}

export type Utm = {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
};

export type LeadAttributionInput = {
  /** `window.location.search` no momento do envio. */
  search: string;
  /** Last-touch da sessão (sessionStorage `bewild_utm`), se houver. */
  sessionUtm?: Utm | null;
  /** First-touch do visitante (localStorage `bewild_first_utm`), se houver. */
  firstUtm?: Utm | null;
  /** `document.referrer` no momento do envio. */
  referrer?: string | null;
  /** Host do referrer externo persistido na sessão (`bewild_ref_host`). */
  referrerHost?: string | null;
  /** Primeira página da sessão persistida (`bewild_landing`). */
  landingPath?: string | null;
  /** `window.location.pathname` no momento do envio (fallback). */
  currentPath: string;
};

export type LeadAttribution = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  landing_path: string | null;
};

const hasAnyUtm = (u: Utm | null | undefined): u is Utm =>
  !!u && !!(u.utm_source || u.utm_medium || u.utm_campaign);

export function resolveLeadAttribution(input: LeadAttributionInput): LeadAttribution {
  const fromUrl = pickCampaignParams(input.search);
  const urlUtm: Utm = {
    utm_source: fromUrl.get("utm_source"),
    utm_medium: fromUrl.get("utm_medium"),
    utm_campaign: fromUrl.get("utm_campaign"),
  };

  const utm = hasAnyUtm(urlUtm)
    ? urlUtm
    : hasAnyUtm(input.sessionUtm)
      ? input.sessionUtm
      : hasAnyUtm(input.firstUtm)
        ? input.firstUtm
        : {};

  // Referrer: o do documento (pode ser interno após navegação SPA); se
  // vazio, o host externo guardado na entrada da sessão.
  const referrer = (input.referrer || "").trim() || (input.referrerHost || "").trim() || null;

  return {
    utm_source: utm.utm_source ?? null,
    utm_medium: utm.utm_medium ?? null,
    utm_campaign: utm.utm_campaign ?? null,
    referrer,
    landing_path: (input.landingPath || "").trim() || input.currentPath || null,
  };
}
