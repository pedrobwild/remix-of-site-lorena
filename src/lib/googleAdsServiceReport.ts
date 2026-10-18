import { googleAdsLeadValue } from "@/lib/googleAdsLeadValue";
import { topoVarianteDaBusca, type TopoVariante } from "@/lib/googleAdsVariant";
import { SERVICE_PAGES } from "@/lib/conversions";

export type AdsVariant = TopoVariante | "sem-atribuicao";
export type ServiceClickEvent = { path: string | null; event_type: string; session_id: string | null; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null; utm_content: string | null };
export type ServiceLead = { id: string; landing_path: string | null; objetivo: string | null; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null; utm_content: string | null; gclid: string | null };
export type ServiceAdsRow = { page: string; campaign: string; variant: AdsVariant; clicks: number; sessions: number; leads: number; confirmed: number; unavailable: number; leadWeight: number; confirmedWeight: number };

/** Pesos aprovados por finalidade, exibidos como tabela de referência. */
export const GOOGLE_ADS_WEIGHTS = ["Short stay", "Locação tradicional", "Uso misto", "Moradia", "Ainda avaliando", "Não informado"].map(objetivo => {
  const value = googleAdsLeadValue(objetivo === "Não informado" ? null : objetivo).value;
  return { objetivo, weight: typeof value === "number" ? value : null };
});

const PAID = /^(cpc|ppc|paid|paid_search|paidsearch)$/i;
function attribution(row: { utm_source: string | null; utm_medium: string | null; utm_campaign: string | null; utm_content: string | null }, gclid?: string | null) {
  const google = !!gclid || (row.utm_source?.trim().toLowerCase() === "google" && PAID.test(row.utm_medium?.trim() ?? ""));
  return google
    ? { campaign: row.utm_campaign || "Campanha não informada", variant: topoVarianteDaBusca({ utm_campaign: row.utm_campaign, utm_content: row.utm_content }) as AdsVariant }
    : { campaign: "Sem atribuição ao Google Ads", variant: "sem-atribuicao" as AdsVariant };
}
const cleanPath = (path: string | null) => (path ?? "").split(/[?#]/)[0].replace(/\/+$/, "") || "/";

/** Cliques em CTAs e pedidos que entraram pela página de serviço; um pedido conta uma vez. */
export function summarizeServiceAds(clicks: ServiceClickEvent[], leads: ServiceLead[], confirmedIds: ReadonlySet<string>, checkedIds: ReadonlySet<string>): ServiceAdsRow[] {
  const groups = new Map<string, { row: ServiceAdsRow; sessions: Set<string> }>();
  const get = (page: string, campaign: string, variant: AdsVariant) => {
    const key = JSON.stringify([page, campaign, variant]);
    let group = groups.get(key);
    if (!group) groups.set(key, group = { row: { page, campaign, variant, clicks: 0, sessions: 0, leads: 0, confirmed: 0, unavailable: 0, leadWeight: 0, confirmedWeight: 0 }, sessions: new Set() });
    return group;
  };
  for (const event of clicks) {
    const page = cleanPath(event.path);
    if (event.event_type !== "click_cta" || !SERVICE_PAGES[page]) continue;
    const { campaign, variant } = attribution(event);
    const group = get(page, campaign, variant);
    group.row.clicks++;
    if (event.session_id) group.sessions.add(event.session_id);
  }
  const seen = new Set<string>();
  for (const lead of leads) {
    const page = cleanPath(lead.landing_path);
    if (!SERVICE_PAGES[page] || seen.has(lead.id)) continue;
    seen.add(lead.id);
    const { campaign, variant } = attribution(lead, lead.gclid);
    const value = googleAdsLeadValue(lead.objetivo).value;
    const weight = typeof value === "number" ? value : 0;
    const { row } = get(page, campaign, variant);
    row.leads++;
    row.leadWeight += weight;
    if (!checkedIds.has(lead.id)) row.unavailable++;
    else if (confirmedIds.has(lead.id)) { row.confirmed++; row.confirmedWeight += weight; }
  }
  return [...groups.values()].map(({ row, sessions }) => ({ ...row, sessions: sessions.size }))
    .sort((a, b) => a.page.localeCompare(b.page) || b.clicks + b.leads - (a.clicks + a.leads) || a.campaign.localeCompare(b.campaign));
}
