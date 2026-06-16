/**
 * Classificação de canal de aquisição para leads — estilo GA4 "Default
 * Channel Grouping", adaptado ao que coletamos hoje em `leads`
 * (utm_source, utm_medium, referrer, landing_path).
 *
 * Regras avaliadas EM ORDEM (primeiro match vence). Tudo é
 * case-insensitive e tolerante a nulo/string vazia.
 */

export type LeadChannel =
  | "Tráfego pago (Meta)"
  | "Tráfego pago (Google)"
  | "Orgânico (busca)"
  | "Orgânico (social)"
  | "Indicação"
  | "Direto"
  | "Outros";

export const LEAD_CHANNELS: LeadChannel[] = [
  "Tráfego pago (Meta)",
  "Tráfego pago (Google)",
  "Orgânico (busca)",
  "Orgânico (social)",
  "Indicação",
  "Direto",
  "Outros",
];

export type LeadChannelInput = {
  utm_source?: string | null;
  utm_medium?: string | null;
  referrer?: string | null;
};

const PAID_MEDIUMS = new Set([
  "paid",
  "cpc",
  "ppc",
  "paid_social",
  "paidsocial",
  "paid-social",
  "cpm",
]);

const META_SOURCES = new Set(["facebook", "instagram", "meta", "fb", "ig"]);
const SEARCH_PAID_SOURCES = new Set(["google", "bing"]);
const SOCIAL_SOURCES = new Set([
  "facebook",
  "instagram",
  "meta",
  "fb",
  "ig",
  "linkedin",
  "youtube",
  "tiktok",
  "twitter",
  "x",
  "pinterest",
]);

const SEARCH_REFERRER_HOSTS = [
  "google.",
  "bing.",
  "yahoo.",
  "duckduckgo.",
  "ecosia.",
  "baidu.",
];
const SOCIAL_REFERRER_HOSTS = [
  "instagram.",
  "facebook.",
  "l.facebook.",
  "lm.facebook.",
  "linkedin.",
  "lnkd.in",
  "youtube.",
  "youtu.be",
  "t.co",
  "twitter.",
  "x.com",
  "tiktok.",
  "pinterest.",
];

// Domínios considerados "próprios" (referrer interno = Direto)
const OWN_HOSTS = ["bewild.com.br", "lovable.app", "lovable.dev", "localhost"];

function norm(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function referrerHost(referrer: string | null | undefined): string | null {
  const raw = (referrer ?? "").trim();
  if (!raw) return null;
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    // Pode vir um host puro ("instagram.com") em vez de URL — usa direto.
    return raw.toLowerCase().replace(/^https?:\/\//, "").split("/")[0] || null;
  }
}

function hostMatches(host: string, needles: string[]): boolean {
  return needles.some((n) => host === n || host.endsWith(`.${n}`) || host.includes(n));
}

export function classifyLeadChannel(lead: LeadChannelInput): LeadChannel {
  const source = norm(lead.utm_source);
  const medium = norm(lead.utm_medium);
  const host = referrerHost(lead.referrer);
  const isPaidMedium = PAID_MEDIUMS.has(medium);

  // 1. Pago Meta — medium pago + qualquer source de Meta, OU medium pago genérico de social
  if (
    (isPaidMedium && META_SOURCES.has(source)) ||
    medium === "paid_social" ||
    medium === "paidsocial" ||
    medium === "paid-social"
  ) {
    return "Tráfego pago (Meta)";
  }

  // 2. Pago Google/Bing — source de busca + medium pago
  if (isPaidMedium && SEARCH_PAID_SOURCES.has(source)) {
    return "Tráfego pago (Google)";
  }

  // 3. Orgânico busca — sem medium pago, utm organic OU referrer de buscador
  if (!isPaidMedium) {
    if (medium === "organic") return "Orgânico (busca)";
    if (host && hostMatches(host, SEARCH_REFERRER_HOSTS)) return "Orgânico (busca)";
  }

  // 4. Orgânico social — sem medium pago, source social OU referrer de rede social
  if (!isPaidMedium) {
    if (SOCIAL_SOURCES.has(source) && medium !== "cpc" && medium !== "ppc") {
      return "Orgânico (social)";
    }
    if (host && hostMatches(host, SOCIAL_REFERRER_HOSTS)) {
      return "Orgânico (social)";
    }
  }

  // 5. Indicação — referrer externo que não é busca nem social, sem UTM pago
  if (!isPaidMedium && host && !hostMatches(host, OWN_HOSTS)) {
    return "Indicação";
  }

  // 6. Direto — sem UTM e sem referrer (ou referrer do próprio domínio)
  if (!source && !medium && (!host || hostMatches(host, OWN_HOSTS))) {
    return "Direto";
  }

  // 7. Outros — UTM presente mas não encaixou (ex.: email, whatsapp, sms…)
  return "Outros";
}

export function aggregateLeadChannels(
  leads: LeadChannelInput[],
): { channel: LeadChannel; count: number }[] {
  const counts = new Map<LeadChannel, number>();
  for (const ch of LEAD_CHANNELS) counts.set(ch, 0);
  for (const l of leads) {
    const ch = classifyLeadChannel(l);
    counts.set(ch, (counts.get(ch) ?? 0) + 1);
  }
  return LEAD_CHANNELS.map((channel) => ({ channel, count: counts.get(channel) ?? 0 }));
}
