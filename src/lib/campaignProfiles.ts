import type { FormLeadRow } from "@/lib/formLeads";

export type ProfileDimension = "bairro" | "metragem" | "finalidade";
export const PROFILE_DIMENSIONS: Record<ProfileDimension, string> = { bairro: "Bairro", metragem: "Metragem", finalidade: "Finalidade" };
export type CampaignProfileRow = { campaign: string; perfil: string; leads: number; desqualificados: number; semLeitura: number };

const NI = "Não informado";
export function faixaMetragem(area: number | null): string {
  if (area == null || !Number.isFinite(area) || area <= 0) return NI;
  return area <= 35 ? "Até 35 m²" : area <= 60 ? "36–60 m²" : "Acima de 60 m²";
}

/** Desqualificado = status "Perdido" no CRM. Sem leitura do CRM fica separado, nunca conta como zero. */
export function summarizeCampaignProfiles(rows: Pick<FormLeadRow, "bairro" | "areaM2" | "objetivo" | "campaign" | "status">[], dim: ProfileDimension): CampaignProfileRow[] {
  const map = new Map<string, CampaignProfileRow>();
  for (const row of rows) {
    const perfil = dim === "bairro" ? (row.bairro?.trim() || NI) : dim === "metragem" ? faixaMetragem(row.areaM2) : (row.objetivo?.trim() || NI);
    const campaign = row.campaign?.trim() || "Sem campanha";
    const key = `${campaign}|${perfil.toLocaleLowerCase("pt-BR")}`;
    const e = map.get(key) ?? { campaign, perfil, leads: 0, desqualificados: 0, semLeitura: 0 };
    e.leads += 1;
    if (row.status === "Perdido") e.desqualificados += 1;
    if (row.status === "CRM indisponível") e.semLeitura += 1;
    map.set(key, e);
  }
  return [...map.values()].sort((a, b) => a.campaign.localeCompare(b.campaign, "pt-BR") || b.leads - a.leads);
}
