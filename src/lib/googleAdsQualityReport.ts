import type { ServiceLead } from "@/lib/googleAdsServiceReport";

export type QualityLead = ServiceLead & { status: string; crm_synced_at: string | null; location: string | null; area_m2: number | null; chaves: string | null; property_age?: string | null; attributedToGoogleAds?: boolean; form_path?: string | null };
export type QualityDimension = "objetivo" | "bairro" | "metragem" | "chaves" | "idade";
export const QUALITY_DIMENSIONS: Record<QualityDimension, string> = { objetivo: "Finalidade", bairro: "Bairro/local", metragem: "Metragem", chaves: "Situação das chaves", idade: "Idade do imóvel" };
export type QualityRow = { dimension: QualityDimension; value: string; leads: number; disqualified: number; other: number; unavailable: number; rate: number | null };
const missing = "Não informado";
const text = (value: string | null | undefined) => value?.trim().replace(/\s+/g, " ") || missing;
const paid = /^(cpc|ppc|paid|paid_search|paidsearch)$/i;
export function isQualityAdsLead(lead: ServiceLead & { attributedToGoogleAds?: boolean }) {
  return lead.attributedToGoogleAds === true || !!lead.gclid || (lead.utm_source?.trim().toLowerCase() === "google" && paid.test(lead.utm_medium?.trim() ?? ""));
}

/** Coorte de pedidos atribuídos; sem associação com visitas anônimas. */
export function summarizeAdsQuality(leads: QualityLead[], campaign?: string): QualityRow[] {
  const groups = new Map<string, QualityRow>();
  const seen = new Set<string>();
  for (const lead of leads) {
    if (!isQualityAdsLead(lead) || seen.has(lead.id) || (campaign && (lead.utm_campaign || "Campanha não informada") !== campaign)) continue;
    seen.add(lead.id);
    const area = lead.area_m2;
    const values: Record<QualityDimension, string> = {
      objetivo: text(lead.objetivo), bairro: text(lead.location), chaves: text(lead.chaves), idade: text(lead.property_age),
      metragem: typeof area !== "number" || !Number.isFinite(area) || area <= 0 ? missing : area <= 35 ? "Até 35 m²" : area <= 60 ? "36–60 m²" : "Acima de 60 m²",
    };
    for (const dimension of Object.keys(values) as QualityDimension[]) {
      const value = values[dimension];
      const key = JSON.stringify([dimension, value.toLocaleLowerCase("pt-BR")]);
      let row = groups.get(key);
      if (!row) { row = { dimension, value, leads: 0, disqualified: 0, other: 0, unavailable: 0, rate: null }; groups.set(key, row); }
      row.leads++;
      if (!lead.crm_synced_at) row.unavailable++;
      else if (lead.status === "descartado") row.disqualified++;
      else row.other++;
    }
  }
  return [...groups.values()].map(row => ({ ...row, rate: row.leads > row.unavailable ? row.disqualified / (row.leads - row.unavailable) : null }))
    .sort((a, b) => b.leads - a.leads || a.value.localeCompare(b.value, "pt-BR"));
}