import type { CrmLeadItem } from "@/lib/crmStage";
import type { CrmProposal } from "@/lib/crmProposals.server";
import type { ClosedContract } from "@/lib/closedContracts";

export type OpenContractLead = { id: string; name: string; location: string | null };
export type OpenContractRow = { id: string; name: string; bairro: string | null; status: string; total: number | null; signedAt: string | null; valueType: "proposta" | "contrato"; progress: "Não informado pelo CRM" };

/** Negociação explícita não prova assinatura; proposta nunca vira contrato. */
export function awaitingContractRows(leads: OpenContractLead[], stages: CrmLeadItem[], proposals: Record<string, CrmProposal[]>): OpenContractRow[] {
  const byId = new Map(stages.map(s => [s.lead_id, s]));
  return leads.flatMap(lead => {
    const stage = byId.get(lead.id);
    if (!stage || stage.won === true || stage.all_closed_lost === true || !["negociacao", "minuta_solicitada"].includes(stage.current_stage_key ?? "")) return [];
    const offers = proposals[lead.id] ?? [];
    const latest = [...offers].sort((a, b) => (b.generated_at ?? "").localeCompare(a.generated_at ?? "") || b.version_number - a.version_number)[0];
    return [{ id: lead.id, name: lead.name, bairro: lead.location, status: stage.current_stage_name ?? "Etapa não informada", total: latest?.total ?? null, signedAt: null, valueType: "proposta" as const, progress: "Não informado pelo CRM" as const }];
  });
}

/** Apenas assinatura datada na exportação; andamento da obra não é inferido. */
export function signedContractRows(leads: OpenContractLead[], contracts: ClosedContract[]): OpenContractRow[] {
  const byId = new Map(leads.map(l => [l.id, l]));
  const seen = new Set<string>();
  return contracts.flatMap(c => {
    const lead = byId.get(c.lead_id);
    if (!lead || !c.closed_at || seen.has(c.id)) return [];
    seen.add(c.id);
    return [{ id: c.id, name: lead.name, bairro: c.location ?? lead.location, status: "Assinatura registrada", total: c.total, signedAt: c.closed_at, valueType: "contrato" as const, progress: "Não informado pelo CRM" as const }];
  });
}