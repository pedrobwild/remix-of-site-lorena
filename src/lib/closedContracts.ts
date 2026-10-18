export type ContractLead = {
  id: string;
  location: string | null;
  created_at: string;
  crm_won: boolean | null;
  crm_stage_name: string | null;
};

/** Um pedido ganho não fornece data de fechamento, valor ou recebimento. */
export function selectClosedContracts(leads: ContractLead[], neighborhood = "") {
  return leads.filter((lead) => lead.crm_won === true && (!neighborhood || lead.location === neighborhood));
}

export type ClosedContract = ContractLead & {
  lead_id: string;
  budget_id: string | null;
  closed_at: string | null;
  total: number | null;
};

/** Uma linha por negócio, não por cliente; null representa integração indisponível. */
export function mergeClosedContracts(leads: ContractLead[], contracts: Array<{
  lead_id: string; budget_id: string; version_group_id: string;
  closed_at: string | null; total: number | null; neighborhood: string | null;
}> | null): ClosedContract[] {
  if (contracts === null) return selectClosedContracts(leads).map((lead) => ({
    ...lead, lead_id: lead.id, budget_id: null, closed_at: null, total: null,
  }));
  const byId = new Map(leads.map((lead) => [lead.id, lead]));
  return contracts.flatMap((contract) => {
    const lead = byId.get(contract.lead_id);
    if (!lead) return [];
    return [{ ...lead, lead_id: lead.id, id: contract.version_group_id, crm_won: true,
      location: contract.neighborhood ?? lead.location,
      budget_id: contract.budget_id, closed_at: contract.closed_at, total: contract.total }];
  });
}