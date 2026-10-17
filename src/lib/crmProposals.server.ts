import { z } from "zod";
import { ENGINE_STAGES_URL } from "@/lib/crmStageSync.server";

const proposalSchema = z.object({
  public_id: z.string().min(1).max(200),
  url: z.string().url().max(2048).refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  }),
  total: z.number().finite().nonnegative().nullable(),
  generated_at: z.string().datetime({ offset: true }).nullable(),
  prazo_dias_uteis: z.number().int().nonnegative().nullable(),
  version_number: z.number().int().positive(),
});
export type CrmProposal = z.infer<typeof proposalSchema>;
const responseSchema = z.object({ leads: z.array(z.object({
  lead_id: z.string().uuid(), budgets: z.array(proposalSchema).max(500),
})).max(500) });

/** Propostas publicadas: somente leitura, vinculadas aos IDs autorizados. */
export async function readCrmProposals(key: string, leadIds: string[], fetcher: typeof fetch = fetch): Promise<Record<string, CrmProposal[]>> {
  const ids = z.array(z.string().uuid()).max(500).parse(leadIds);
  if (!ids.length) return {};
  const response = await fetcher(ENGINE_STAGES_URL.replace("site-lead-stages", "site-lead-budgets"), {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-integration-key": key },
    body: JSON.stringify({ lead_ids: ids }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`engine_budgets_http_${response.status}`);
  const parsed = responseSchema.parse(await response.json());
  const out: Record<string, CrmProposal[]> = {};
  for (const lead of parsed.leads) {
    if (!ids.includes(lead.lead_id) || Object.hasOwn(out, lead.lead_id)) throw new Error("engine_budgets_invalid_lead");
    out[lead.lead_id] = lead.budgets;
  }
  return out;
}