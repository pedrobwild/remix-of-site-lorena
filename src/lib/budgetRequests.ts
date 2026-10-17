import { resolveLeadForm, type LeadFormSource, type LeadStatus } from "@/lib/adminLeads";

export type BudgetRequest = LeadFormSource & {
  id: string;
  name: string | null;
  location: string | null;
  status: LeadStatus;
  created_at: string;
  crm_stage_name: string | null;
  crm_won: boolean | null;
  crm_lost: boolean | null;
  crm_deal_count: number | null;
};

export function requestNeighborhood(location: string | null): string {
  return location?.trim().replace(/\s+/g, " ") || "Não informado";
}

export function neighborhoodKey(location: string | null): string {
  return requestNeighborhood(location).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

export function selectBudgetRequests<T extends LeadFormSource>(rows: T[]): T[] {
  return rows.filter((row) => resolveLeadForm(row).form === "/orcamento");
}

/** Qualificação não confirma contrato: apenas negócio ganho no CRM. */
export function selectConfirmedRequests<T extends { crm_won: boolean | null }>(rows: T[]): T[] {
  return rows.filter((row) => row.crm_won === true);
}

export function groupRequestsByNeighborhood(rows: BudgetRequest[]) {
  const groups = new Map<string, { key: string; name: string; total: number; novo: number; contatado: number; qualificado: number; descartado: number }>();
  for (const row of rows) {
    const key = neighborhoodKey(row.location);
    const group = groups.get(key) ?? { key, name: requestNeighborhood(row.location), total: 0, novo: 0, contatado: 0, qualificado: 0, descartado: 0 };
    group.total++;
    group[row.status]++;
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "pt-BR"));
}

/** Pagina até o fim, sem truncar os totais no limite do serviço. */
export async function collectRequestPages<T>(readPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const rows: T[] = [];
  const pageSize = 500;
  for (let from = 0; ; from += pageSize) {
    const result = await readPage(from, from + pageSize - 1);
    if (result.error) throw new Error(result.error.message);
    const page = result.data ?? [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}