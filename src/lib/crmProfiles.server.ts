import { z } from "zod";
import { ENGINE_STAGES_URL } from "@/lib/crmStageSync.server";

const profile = z.object({ profile_key: z.string().min(1).max(100), profile_name: z.string().min(1).max(200) });
const responseSchema = z.object({
  summary: z.object({ total_conversations: z.number().int().nonnegative(), profiles: z.array(profile.extend({
    count: z.number().int().nonnegative(), percentage: z.number().int().min(0).max(100),
  })).max(100) }),
  leads: z.array(profile.extend({ lead_id: z.string().uuid(), analyzed_at: z.string().datetime({ offset: true }).nullable() })).max(500),
});

/** Leitura direta da projeção autorizada; não persiste nem expõe conversas. */
export async function readCrmProfiles(key: string, leadIds: string[] = [], fetcher: typeof fetch = fetch) {
  const ids = z.array(z.string().uuid()).max(500).parse(leadIds);
  const response = await fetcher(ENGINE_STAGES_URL.replace("site-lead-stages", "site-client-profiles"), {
    method: "POST", headers: { "Content-Type": "application/json", "x-integration-key": key },
    body: JSON.stringify(ids.length ? { lead_ids: ids } : {}), signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`engine_profiles_http_${response.status}`);
  const parsed = responseSchema.parse(await response.json());
  const seen = new Set<string>();
  for (const lead of parsed.leads) {
    if (!ids.includes(lead.lead_id) || seen.has(lead.lead_id)) throw new Error("engine_profiles_invalid_lead");
    seen.add(lead.lead_id);
  }
  return parsed;
}