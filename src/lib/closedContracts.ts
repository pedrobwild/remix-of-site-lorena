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