import type { FormLeadRow } from "@/lib/formLeads";
import { criarAgrupadorBairros } from "@/lib/bairroAgrupado";

export type RegionReturnRow = { bairro: string; campaign: string; leads: number; contratos: number; semLeitura: number };

const NI = "Não informado";

/** Agrupa leads por bairro × campanha; contrato assinado = status "Contrato fechado" do CRM. Sem leitura do CRM nunca conta como zero. */
export function summarizeRegionReturn(rows: Pick<FormLeadRow, "bairro" | "campaign" | "status">[]): RegionReturnRow[] {
  const map = new Map<string, RegionReturnRow>();
  const agrupar = criarAgrupadorBairros(rows.map(r => r.bairro));
  for (const row of rows) {
    const bairro = agrupar(row.bairro) ?? NI;
    const campaign = row.campaign?.trim() || "Sem campanha";
    const key = `${bairro.toLocaleLowerCase("pt-BR")}|${campaign}`;
    const entry = map.get(key) ?? { bairro, campaign, leads: 0, contratos: 0, semLeitura: 0 };
    entry.leads += 1;
    if (row.status === "Contrato fechado") entry.contratos += 1;
    if (row.status === "CRM indisponível") entry.semLeitura += 1;
    map.set(key, entry);
  }
  return [...map.values()].sort((a, b) => b.contratos - a.contratos || b.leads - a.leads || a.bairro.localeCompare(b.bairro, "pt-BR"));
}
