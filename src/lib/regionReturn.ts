import type { FormLeadRow } from "@/lib/formLeads";
import { criarAgrupadorBairros } from "@/lib/bairroAgrupado";
import type { ClosedContract } from "@/lib/closedContracts";

export type RegionReturnRow = { bairro: string; campaign: string; leads: number; contratos: number; semLeitura: number; valorReal?: number | null; semValor?: number; assinaturas?: Array<{ id: string; total: number | null; closed_at: string | null }> };

const NI = "Não informado";

/** Agrupa leads por bairro × campanha; contrato assinado = status "Contrato fechado" do CRM. Sem leitura do CRM nunca conta como zero. */
export function summarizeRegionReturn(rows: (Pick<FormLeadRow, "bairro" | "campaign" | "status"> & { id?: string })[], contracts: ClosedContract[] | null = null): RegionReturnRow[] {
  const map = new Map<string, RegionReturnRow>();
  const agrupar = criarAgrupadorBairros([...rows.map(r => r.bairro), ...(contracts ?? []).map(c => c.location)]);
  for (const row of rows) {
    const bairro = agrupar(row.bairro) ?? NI;
    const campaign = row.campaign?.trim() || "Sem campanha";
    const key = `${bairro.toLocaleLowerCase("pt-BR")}|${campaign}`;
    const entry = map.get(key) ?? { bairro, campaign, leads: 0, contratos: 0, semLeitura: 0 };
    entry.leads += 1;
    if (contracts === null && row.status === "Contrato fechado") entry.contratos += 1;
    if (row.status === "CRM indisponível") entry.semLeitura += 1;
    map.set(key, entry);
  }
  if (contracts !== null) {
    for (const entry of map.values()) { entry.valorReal = 0; entry.semValor = 0; entry.assinaturas = []; }
    const byLead = new Map(rows.filter(r => r.id).map(r => [r.id, r]));
    const seen = new Set<string>();
    for (const contract of contracts) {
      const lead = byLead.get(contract.lead_id);
      if (!lead || seen.has(contract.id)) continue;
      seen.add(contract.id);
      const bairro = agrupar(contract.location ?? lead.bairro) ?? NI;
      const campaign = lead.campaign?.trim() || "Sem campanha";
      const key = `${bairro.toLocaleLowerCase("pt-BR")}|${campaign}`;
      const entry = map.get(key) ?? { bairro, campaign, leads: 0, contratos: 0, semLeitura: 0, valorReal: 0, semValor: 0, assinaturas: [] };
      entry.contratos++;
      if (contract.total === null) entry.semValor = (entry.semValor ?? 0) + 1;
      else entry.valorReal = (entry.valorReal ?? 0) + contract.total;
      entry.assinaturas?.push({ id: contract.id, total: contract.total, closed_at: contract.closed_at });
      map.set(key, entry);
    }
  }
  return [...map.values()].sort((a, b) => b.contratos - a.contratos || b.leads - a.leads || a.bairro.localeCompare(b.bairro, "pt-BR"));
}
