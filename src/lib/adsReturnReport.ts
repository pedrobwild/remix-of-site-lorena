import { googleAdsLeadValue } from "@/lib/googleAdsLeadValue";

export type ReturnLead = { id: string; objetivo: string | null; gclid: string | null; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null };
export type ReturnContract = { lead_id: string; total: number | null };
export type AdsReturnRow = {
  campaign: string; leads: number; confirmed: number; unchecked: number;
  /** Peso médio dos leads confirmados que têm peso; null quando nenhum tem. */
  avgWeight: number | null;
  contracts: number; withValue: number; withoutValue: number;
  /** Soma do valor real do CRM; null quando os contratos não puderam ser lidos. */
  realValue: number | null;
};

const PAID = /^(cpc|ppc|paid|paid_search|paidsearch)$/i;
export const isGoogleAdsLead = (l: ReturnLead) =>
  !!l.gclid || (l.utm_source?.trim().toLowerCase() === "google" && PAID.test(l.utm_medium?.trim() ?? ""));

/**
 * Retorno por campanha do Google Ads. Confirmado = lead com negócio no CRM.
 * Peso médio usa só os pesos de lance aprovados (não é receita).
 * Valor real = só o `total` devolvido pelo CRM; nunca estimado nem trocado por peso.
 */
export function summarizeAdsReturn(
  leads: ReturnLead[], confirmedIds: ReadonlySet<string>, checkedIds: ReadonlySet<string>,
  contracts: ReturnContract[] | null,
): AdsReturnRow[] {
  const byLead = new Map<string, ReturnContract[]>();
  for (const c of contracts ?? []) byLead.set(c.lead_id, [...(byLead.get(c.lead_id) ?? []), c]);
  const groups = new Map<string, AdsReturnRow & { weightSum: number; weighted: number }>();
  const seen = new Set<string>();
  for (const lead of leads) {
    if (seen.has(lead.id) || !isGoogleAdsLead(lead)) continue;
    seen.add(lead.id);
    const campaign = lead.utm_campaign?.trim() || "Campanha não informada";
    const row = groups.get(campaign) ?? { campaign, leads: 0, confirmed: 0, unchecked: 0, avgWeight: null, contracts: 0, withValue: 0, withoutValue: 0, realValue: contracts ? 0 : null, weightSum: 0, weighted: 0 };
    row.leads++;
    if (!checkedIds.has(lead.id)) row.unchecked++;
    else if (confirmedIds.has(lead.id)) {
      row.confirmed++;
      const w = googleAdsLeadValue(lead.objetivo).value;
      if (typeof w === "number") { row.weightSum += w; row.weighted++; }
    }
    for (const c of byLead.get(lead.id) ?? []) {
      row.contracts++;
      if (typeof c.total === "number") { row.withValue++; row.realValue = (row.realValue ?? 0) + c.total; } else row.withoutValue++;
    }
    groups.set(campaign, row);
  }
  return [...groups.values()].map(({ weightSum, weighted, ...r }) => ({ ...r, avgWeight: weighted ? weightSum / weighted : null }))
    .sort((a, b) => (b.realValue ?? 0) - (a.realValue ?? 0) || b.confirmed - a.confirmed || a.campaign.localeCompare(b.campaign));
}
