import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { attachCrmAuth } from "@/lib/crmAuth";
import { summarizeQuoteCrm, type QuoteLead } from "@/lib/quoteCrmReport";

const schema = z.object({
  from: z.string().datetime(),
  until: z.string().datetime(),
  segments: z.array(z.object({ dim: z.enum(["utm_source", "utm_medium", "utm_campaign", "landing_path"]), value: z.string().max(500) })).max(10),
}).refine(data => Date.parse(data.from) <= Date.parse(data.until), "Período inválido.");

export const getQuoteCrmReport = createServerFn({ method: "POST" })
  .middleware([attachCrmAuth, requireSupabaseAuth])
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data, context }) => {
    const role = await context.supabase.rpc("is_admin");
    if (role.error || role.data !== true) throw new Error("Acesso restrito a administradores.");
    const leads: QuoteLead[] = [];
    for (let offset = 0; ; offset += 1000) {
      let query = context.supabase.from("leads")
        .select("id,form_path,objetivo,utm_source,utm_medium,utm_campaign,utm_content,gclid")
        .eq("form_path", "/orcamento").gte("created_at", data.from).lte("created_at", data.until);
      for (const segment of data.segments) query = query.eq(segment.dim, segment.value);
      const result = await query.order("created_at").order("id").range(offset, offset + 999);
      if (result.error) throw new Error("Não foi possível carregar os pedidos.");
      leads.push(...(result.data ?? []));
      if (!result.data || result.data.length < 1000) break;
    }
    const checked = new Set<string>();
    const confirmed = new Set<string>();
    const { resolveEngineKey } = await import("@/lib/externalApi.server");
    const key = await resolveEngineKey(process.env["BWILD_ENGINE_INTEGRATION_KEY"], process.env["EXTERNAL_API_ENCRYPTION_KEY"]);
    if (key) {
      const { fetchEngineStages } = await import("@/lib/crmStageSync.server");
      for (let offset = 0; offset < leads.length; offset += 100) {
        const ids = leads.slice(offset, offset + 100).map(lead => lead.id);
        try {
          const result = await fetchEngineStages(key, { lead_ids: ids });
          for (const id of ids) checked.add(id);
          const allowed = new Set(ids);
          for (const item of result.leads) {
            if (allowed.has(item.lead_id) && typeof item.deal_count === "number" && item.deal_count > 0) confirmed.add(item.lead_id);
          }
        } catch { /* Leitura falhou: indisponível, nunca zero confirmado. */ }
      }
    }
    return { rows: summarizeQuoteCrm(leads, confirmed, checked), checkedAt: new Date().toISOString() };
  });