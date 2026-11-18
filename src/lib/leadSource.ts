/**
 * leadSource.ts — regra única de canal de origem de um lead do site.
 * Função pura: usa só o que o lead já guarda (gclid, fbclid, UTM, referrer).
 * Ordem: clique de anúncio > UTM paga > busca orgânica > redes sociais > direto/indicação.
 */

export type LeadCanal = "google_ads" | "meta" | "organico" | "social" | "direto";

export const LEAD_CANAL_LABEL: Record<LeadCanal, string> = {
  google_ads: "Google Ads",
  meta: "Meta (anúncios)",
  organico: "Busca orgânica",
  social: "Redes sociais",
  direto: "Direto / indicação",
};

export const LEAD_CANAIS: LeadCanal[] = ["google_ads", "meta", "organico", "social", "direto"];

export type LeadSourceInput = {
  gclid?: string | null;
  fbclid?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  first_utm_source?: string | null;
  first_utm_medium?: string | null;
  referrer?: string | null;
};

const PAID_MEDIUM = /^(cpc|ppc|paid|paidsearch|paid_social|paidsocial|cpm|ads?)$/;
const META_SOURCE = /(facebook|instagram|fb|ig|meta)/;
const SEARCH_HOST = /(^|\.)(google|bing|yahoo|duckduckgo|ecosia|yandex)\./;
const SOCIAL_HOST = /(^|\.)(facebook|instagram|linkedin|pinterest|tiktok|youtube|t)\.(com|co)|lnkd\.in|l\.instagram\.com|wa\.me|whatsapp/;

function hostOf(ref: string | null | undefined): string {
  if (!ref) return "";
  try {
    return new URL(ref).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function leadCanal(lead: LeadSourceInput): LeadCanal {
  if (lead.gclid) return "google_ads";

  const src = (lead.utm_source || lead.first_utm_source || "").toLowerCase().trim();
  const med = (lead.utm_medium || lead.first_utm_medium || "").toLowerCase().trim();

  // fbclid sozinho não prova anúncio: o Facebook/Instagram também o põe em
  // link de post e de bio. Os anúncios da Meta da Bewild levam UTM paga
  // (fb/ig/an + paid_social/paid — conferido nos leads de 20/10 a 18/11/2026),
  // então fbclid sem nenhuma UTM é rede social orgânica.
  if (lead.fbclid) {
    if (!src && !med) return "social";
    if (PAID_MEDIUM.test(med)) return "meta";
  }

  if (src) {
    const paid = PAID_MEDIUM.test(med);
    if (/google|adwords/.test(src) && paid) return "google_ads";
    if (META_SOURCE.test(src)) return paid ? "meta" : "social";
    if (/google|bing/.test(src) && (med === "organic" || !med)) return "organico";
    if (/linkedin|tiktok|youtube|pinterest|whatsapp/.test(src)) return "social";
  }

  const host = hostOf(lead.referrer);
  if (host && !host.endsWith("bewild.com.br")) {
    if (SEARCH_HOST.test(host)) return "organico";
    if (SOCIAL_HOST.test(host)) return "social";
  }
  return "direto";
}

export type TestLeadInput = {
  name?: string | null;
  utm_source?: string | null;
  utm_campaign?: string | null;
  lead_source?: string | null;
};

/** "teste"/"test" como palavra inteira (separada por início, fim, espaço, - ou _). */
const TEST_TOKEN = /(^|[\s_-])(teste?s?|test)([\s_-]|$)/i;

/**
 * Lead de teste do time (ex.: campanha "teste-qualificacao" de 25/10/2026),
 * para ficar fora das contagens do painel. Regra conservadora: só a palavra
 * "teste"/"test" inteira na campanha, na origem ou no `lead_source`, ou o nome
 * exatamente "teste"/"test". Não apaga nada do banco.
 */
export function isTestLead(lead: TestLeadInput): boolean {
  if ([lead.utm_campaign, lead.utm_source, lead.lead_source].some((v) => !!v && TEST_TOKEN.test(v.trim()))) return true;
  const name = (lead.name ?? "").trim().toLowerCase();
  return name === "teste" || name === "test";
}
