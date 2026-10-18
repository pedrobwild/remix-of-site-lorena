import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { attachCrmAuth } from "@/lib/crmAuth";
import { awaitingContractRows, signedContractRows, type OpenContractLead } from "@/lib/openContracts";
import { mergeClosedContracts } from "@/lib/closedContracts";

export const getOpenContracts = createServerFn({ method: "POST" })
  .middleware([attachCrmAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const role = await context.supabase.rpc("is_admin");
    if (role.error || role.data !== true) throw new Error("Acesso restrito a administradores.");
    const leads: OpenContractLead[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await context.supabase.from("leads").select("id,name,location").order("created_at", { ascending: false }).order("id").range(from, from + 999);
      if (error) throw new Error("Não foi possível consultar os negócios.");
      leads.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    const { resolveEngineKey } = await import("@/lib/externalApi.server");
    const key = await resolveEngineKey(process.env["BWILD_ENGINE_INTEGRATION_KEY"], process.env["EXTERNAL_API_ENCRYPTION_KEY"]);
    const awaiting: ReturnType<typeof awaitingContractRows> = [];
    const signed: ReturnType<typeof signedContractRows> = [];
    let stagesAvailable = Boolean(key), proposalsAvailable = Boolean(key), contractsAvailable = Boolean(key);
    if (key) {
      const { fetchEngineStages } = await import("@/lib/crmStageSync.server");
      const { readCrmProposals } = await import("@/lib/crmProposals.server");
      const { readCrmContracts } = await import("@/lib/crmContracts.server");
      for (let from = 0; from < leads.length; from += 100) {
        const batch = leads.slice(from, from + 100);
        const ids = batch.map(l => l.id);
        const [stages, proposals, contracts] = await Promise.allSettled([
          fetchEngineStages(key, { lead_ids: ids }), readCrmProposals(key, ids), readCrmContracts(key, ids),
        ]);
        if (stages.status === "fulfilled") awaiting.push(...awaitingContractRows(batch, stages.value.leads, proposals.status === "fulfilled" ? proposals.value : {}));
        else stagesAvailable = false;
        if (proposals.status === "rejected") proposalsAvailable = false;
        if (contracts.status === "fulfilled") {
          const merged = mergeClosedContracts(batch.map(l => ({ ...l, created_at: "", crm_won: null, crm_stage_name: null })), contracts.value);
          signed.push(...signedContractRows(batch, merged));
        } else contractsAvailable = false;
      }
    }
    return { awaiting, signed, stagesAvailable, proposalsAvailable, contractsAvailable, checkedAt: new Date().toISOString() };
  });