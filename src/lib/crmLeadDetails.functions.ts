import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { attachCrmAuth } from "@/lib/crmAuth";

export const getCrmLeadDetails = createServerFn({ method: "POST" })
  .middleware([attachCrmAuth, requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ leadId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("is_admin");
    if (roleError || isAdmin !== true) throw new Error("Acesso restrito a administradores.");
    const { data: lead, error } = await context.supabase.from("leads").select("id").eq("id", data.leadId).maybeSingle();
    if (error || !lead) throw new Error("Pedido não encontrado ou sem permissão.");
    const { resolveEngineKey } = await import("@/lib/externalApi.server");
    const key = await resolveEngineKey(process.env["BWILD_ENGINE_INTEGRATION_KEY"], process.env["EXTERNAL_API_ENCRYPTION_KEY"]);
    if (!key) throw new Error("Chave do BWild Engine não configurada.");
    const { fetchEngineStages } = await import("@/lib/crmStageSync.server");
    const { readCrmProposals } = await import("@/lib/crmProposals.server");
    const [stages, proposals] = await Promise.allSettled([
      fetchEngineStages(key, { lead_ids: [data.leadId] }),
      readCrmProposals(key, [data.leadId]),
    ]);
    const item = stages.status === "fulfilled" ? stages.value.leads.find((row) => row.lead_id === data.leadId) : null;
    return {
      stage: item?.current_stage_name ?? null,
      stagesAvailable: stages.status === "fulfilled",
      proposals: proposals.status === "fulfilled" ? proposals.value[data.leadId] ?? [] : [],
      proposalsAvailable: proposals.status === "fulfilled",
    };
  });