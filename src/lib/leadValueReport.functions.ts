import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { attachCrmAuth } from "@/lib/crmAuth";
import { summarizeLeadValues, type ValueLead } from "@/lib/leadValueReport";

export const getLeadValueReport = createServerFn({ method: "POST" })
  .middleware([attachCrmAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const role = await context.supabase.rpc("is_admin");
    if (role.error || role.data !== true) throw new Error("Acesso restrito a administradores.");
    const leads: ValueLead[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await context.supabase.from("leads")
        .select("id,gclid,fbclid,utm_source,utm_medium,utm_campaign,utm_content,first_utm_source,first_utm_medium,referrer")
        .order("created_at").order("id").range(from, from + 999);
      if (error) throw new Error("Não foi possível consultar os leads.");
      leads.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    try {
      const { resolveEngineKey } = await import("@/lib/externalApi.server");
      const key = await resolveEngineKey(process.env["BWILD_ENGINE_INTEGRATION_KEY"], process.env["EXTERNAL_API_ENCRYPTION_KEY"]);
      if (!key) return { available: false as const, rows: [], checkedAt: new Date().toISOString() };
      const { readCrmContracts } = await import("@/lib/crmContracts.server");
      const contracts = await readCrmContracts(key, leads.map(l => l.id));
      return { available: true as const, rows: summarizeLeadValues(leads, contracts), checkedAt: new Date().toISOString() };
    } catch {
      return { available: false as const, rows: [], checkedAt: new Date().toISOString() };
    }
  });
