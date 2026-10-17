import { z } from "zod";
import { ENGINE_STAGES_URL } from "@/lib/crmStageSync.server";

const contractSchema = z.object({
  lead_id: z.string().uuid(),
  budget_id: z.string().uuid(),
  version_group_id: z.string().uuid(),
  closed_at: z.string().datetime({ offset: true }).nullable(),
  total: z.number().finite().nonnegative().nullable(),
  neighborhood: z.string().nullable(),
});
const responseSchema = z.object({
  contracts: z.array(contractSchema),
  next_cursor: z.string().uuid().nullable(),
});
export type CrmContract = z.infer<typeof contractSchema>;

/** Somente contratos da integração protegida; nunca deriva valor ou data. */
export async function readCrmContracts(key: string, leadIds: string[], fetchImpl: typeof fetch = fetch): Promise<CrmContract[]> {
  const result: CrmContract[] = [];
  for (let offset = 0; offset < leadIds.length; offset += 500) {
    const ids = leadIds.slice(offset, offset + 500);
    let cursor: string | null = null;
    const cursors = new Set<string>();
    do {
      const response = await fetchImpl(ENGINE_STAGES_URL, {
        method: "POST", cache: "no-store",
        headers: { "Content-Type": "application/json", "x-integration-key": key },
        body: JSON.stringify({ mode: "contracts", lead_ids: ids, cursor }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!response.ok) throw new Error(`crm_contracts_http_${response.status}`);
      const parsed = responseSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error("crm_contracts_unavailable");
      if (parsed.data.contracts.some((row) => !ids.includes(row.lead_id))) throw new Error("crm_contracts_invalid_lead");
      result.push(...parsed.data.contracts);
      cursor = parsed.data.next_cursor;
      if (cursor && cursors.has(cursor)) throw new Error("crm_contracts_invalid_cursor");
      if (cursor) cursors.add(cursor);
    } while (cursor);
  }
  const groups = new Set<string>();
  for (const row of result) {
    if (groups.has(row.version_group_id)) throw new Error("crm_contracts_duplicate_deal");
    groups.add(row.version_group_id);
  }
  return result;
}