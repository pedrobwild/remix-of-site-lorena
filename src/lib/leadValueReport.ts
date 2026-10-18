import { leadCanal, LEAD_CANAL_LABEL, type LeadSourceInput } from "@/lib/leadSource";
import { topoVarianteDaBusca, type TopoVariante } from "@/lib/googleAdsVariant";

export type ValueLead = LeadSourceInput & { id: string; utm_campaign: string | null; utm_content: string | null };
export type ValueContract = { lead_id: string; total: number | null };
export type LeadValueRow = { variant: TopoVariante | "sem-atribuicao"; origin: string; leads: number; contracts: number; withValue: number; withoutValue: number; total: number };

/**
 * Valor real = soma do `total` de contratos devolvidos pelo CRM.
 * Contrato sem valor fica "sem valor informado" — nunca estimado nem trocado por peso de lance.
 */
export function summarizeLeadValues(leads: ValueLead[], contracts: ValueContract[]): LeadValueRow[] {
  const byLead = new Map<string, ValueContract[]>();
  for (const c of contracts) byLead.set(c.lead_id, [...(byLead.get(c.lead_id) ?? []), c]);
  const groups = new Map<string, LeadValueRow>();
  const seen = new Set<string>();
  for (const lead of leads) {
    if (seen.has(lead.id)) continue;
    seen.add(lead.id);
    const canal = leadCanal(lead);
    const variant = canal === "google_ads" ? topoVarianteDaBusca({ utm_campaign: lead.utm_campaign, utm_content: lead.utm_content }) : "sem-atribuicao" as const;
    const origin = LEAD_CANAL_LABEL[canal];
    const key = JSON.stringify([variant, origin]);
    const row = groups.get(key) ?? { variant, origin, leads: 0, contracts: 0, withValue: 0, withoutValue: 0, total: 0 };
    row.leads++;
    for (const c of byLead.get(lead.id) ?? []) {
      row.contracts++;
      if (typeof c.total === "number") { row.withValue++; row.total += c.total; } else row.withoutValue++;
    }
    groups.set(key, row);
  }
  return [...groups.values()].sort((a, b) => b.total - a.total || b.leads - a.leads || a.origin.localeCompare(b.origin));
}
