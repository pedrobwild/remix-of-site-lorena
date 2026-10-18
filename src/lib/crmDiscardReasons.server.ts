import { z } from "zod";
import { fetchEngineStages } from "@/lib/crmStageSync.server";

const idsSchema = z.array(z.string().uuid()).max(500);
const reasonSchema = z.object({
  lead_id: z.string().uuid(),
  reason_category: z.string().trim().max(2000).nullish(),
  reason_detail: z.string().trim().max(10000).nullish(),
});

/** Leitura somente pela projeção autorizada já existente; nunca deduz motivos de etapas ou perfil. */
export async function readCrmDiscardReasons(key: string, leadIds: string[], fetchImpl: typeof fetch = fetch): Promise<Record<string, string>> {
  const ids = idsSchema.parse(leadIds);
  if (!ids.length) return {};
  const allowed = new Set(ids);
  const result = await fetchEngineStages(key, { lead_ids: ids }, fetchImpl);
  const reasons: Record<string, string> = {};
  for (const item of result.leads) {
    const parsed = reasonSchema.safeParse(item);
    if (!parsed.success || !allowed.has(parsed.data.lead_id)) continue;
    const { lead_id, reason_category, reason_detail } = parsed.data;
    const text = [reason_category, reason_detail].filter((value): value is string => !!value).join(" — ");
    if (text) reasons[lead_id] = text;
  }
  return reasons;
}