import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { attachCrmAuth } from "@/lib/crmAuth";
import { formLeadRow, type FormLead } from "@/lib/formLeads";
import type { CrmLeadItem } from "@/lib/crmStage";

export const getFormLeads = createServerFn({ method: "POST" })
  .middleware([attachCrmAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const role = await context.supabase.rpc("is_admin");
    if (role.error || role.data !== true) throw new Error("Acesso restrito a administradores.");
    const leads: FormLead[] = [];
    for (let offset = 0; ; offset += 1000) {
      const result = await context.supabase.from("leads")
        .select("id,name,created_at,objetivo,gclid,fbclid,utm_source,utm_medium,utm_campaign,utm_content,first_utm_source,first_utm_medium,referrer,location,area_m2,chaves")
        .eq("form_path", "/orcamento")
        .order("created_at", { ascending: false }).order("id")
        .range(offset, offset + 999);
      if (result.error) throw new Error("Não foi possível carregar os leads do formulário.");
      leads.push(...(result.data ?? []));
      if (!result.data || result.data.length < 1000) break;
    }
    const checked = new Set<string>();
    const stages = new Map<string, CrmLeadItem>();
    const { resolveEngineKey } = await import("@/lib/externalApi.server");
    const key = await resolveEngineKey(process.env["BWILD_ENGINE_INTEGRATION_KEY"], process.env["EXTERNAL_API_ENCRYPTION_KEY"]);
    if (key) {
      const { fetchEngineStages } = await import("@/lib/crmStageSync.server");
      for (let offset = 0; offset < leads.length; offset += 100) {
        const ids = leads.slice(offset, offset + 100).map(lead => lead.id);
        try {
          const result = await fetchEngineStages(key, { lead_ids: ids });
          const allowed = new Set(ids);
          for (const id of ids) checked.add(id);
          for (const item of result.leads) if (allowed.has(item.lead_id)) stages.set(item.lead_id, item);
        } catch { /* Falha de consulta nunca significa falha de entrega. */ }
      }
    }
    return { rows: leads.map(lead => formLeadRow(lead, stages.get(lead.id), checked.has(lead.id))), checkedAt: new Date().toISOString() };
  });