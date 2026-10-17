import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { attachCrmAuth } from "@/lib/crmAuth";
import { mergeClosedContracts, type ContractLead } from "@/lib/closedContracts";

export const getClosedContracts = createServerFn({ method: "POST" })
  .middleware([attachCrmAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("is_admin");
    if (roleError || isAdmin !== true) throw new Error("Acesso restrito a administradores.");
    const leads: ContractLead[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await context.supabase.from("leads")
        .select("id,location,created_at,crm_won,crm_stage_name")
        .order("created_at", { ascending: false }).order("id")
        .range(from, from + 999);
      if (error) throw new Error("Não foi possível consultar os pedidos.");
      leads.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    try {
      const { resolveEngineKey } = await import("@/lib/externalApi.server");
      const key = await resolveEngineKey(process.env["BWILD_ENGINE_INTEGRATION_KEY"], process.env["EXTERNAL_API_ENCRYPTION_KEY"]);
      if (!key) return { contracts: mergeClosedContracts(leads, null), available: false };
      const { readCrmContracts } = await import("@/lib/crmContracts.server");
      const contracts = await readCrmContracts(key, leads.map((lead) => lead.id));
      return { contracts: mergeClosedContracts(leads, contracts), available: true };
    } catch {
      return { contracts: mergeClosedContracts(leads, null), available: false };
    }
  });