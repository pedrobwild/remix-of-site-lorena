import { googleAdsLeadValue } from "@/lib/googleAdsLeadValue";
import { topoVarianteDaBusca, type TopoVariante } from "@/lib/googleAdsVariant";

export type QuoteLead = {
  id: string;
  form_path: string | null;
  objetivo: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  gclid: string | null;
};
export type QuoteCrmRow = {
  campaign: string;
  variant: TopoVariante | "sem-atribuicao";
  objetivo: string;
  weight: number | null;
  requests: number;
  confirmed: number;
  notConfirmed: number;
  unavailable: number;
  confirmedWeight: number;
};

/** Uma linha por pedido, nunca por visita, webhook ou negócio duplicado. */
export function summarizeQuoteCrm(
  leads: QuoteLead[],
  confirmedIds: ReadonlySet<string>,
  checkedIds: ReadonlySet<string>,
): QuoteCrmRow[] {
  const groups = new Map<string, QuoteCrmRow>();
  const seen = new Set<string>();
  for (const lead of leads) {
    if (lead.form_path !== "/orcamento" || seen.has(lead.id)) continue;
    seen.add(lead.id);
    const google = !!lead.gclid || (lead.utm_source?.toLowerCase() === "google" && /^(cpc|ppc|paid|paid_search|paidsearch)$/i.test(lead.utm_medium ?? ""));
    const variant = google ? topoVarianteDaBusca({ utm_campaign: lead.utm_campaign, utm_content: lead.utm_content }) : "sem-atribuicao";
    const campaign = google ? lead.utm_campaign || "Campanha não informada" : "Sem atribuição ao Google Ads";
    const objetivo = lead.objetivo || "Não informado";
    const value = googleAdsLeadValue(lead.objetivo).value;
    const weight = typeof value === "number" ? value : null;
    const key = JSON.stringify([campaign, variant, objetivo]);
    const row = groups.get(key) ?? { campaign, variant, objetivo, weight, requests: 0, confirmed: 0, notConfirmed: 0, unavailable: 0, confirmedWeight: 0 };
    row.requests++;
    if (confirmedIds.has(lead.id) && checkedIds.has(lead.id)) {
      row.confirmed++;
      row.confirmedWeight += weight ?? 0;
    } else if (checkedIds.has(lead.id)) row.notConfirmed++;
    else row.unavailable++;
    groups.set(key, row);
  }
  return [...groups.values()].sort((a, b) => b.requests - a.requests || a.campaign.localeCompare(b.campaign));
}