import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { attachCrmAuth } from "@/lib/crmAuth";
import { SERVICE_PAGES } from "@/lib/conversions";
import { summarizeServiceAds, type ServiceClickEvent, type ServiceLead } from "@/lib/googleAdsServiceReport";
import { isQualityAdsLead, type QualityLead } from "@/lib/googleAdsQualityReport";

const schema = z.object({ from: z.string().datetime(), until: z.string().datetime() })
  .refine(data => Date.parse(data.from) <= Date.parse(data.until), "Período inválido.");

export const getGoogleAdsServiceReport = createServerFn({ method: "POST" })
  .middleware([attachCrmAuth, requireSupabaseAuth])
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data, context }) => {
    const role = await context.supabase.rpc("is_admin");
    if (role.error || role.data !== true) throw new Error("Acesso restrito a administradores.");
    const paths = Object.keys(SERVICE_PAGES);
    const clicks: ServiceClickEvent[] = [];
    for (let offset = 0; ; offset += 1000) {
      const result = await context.supabase.from("analytics_events")
        .select("id,path,event_type,session_id,utm_source,utm_medium,utm_campaign,utm_content")
        .eq("event_type", "click_cta").in("path", paths)
        .gte("created_at", data.from).lte("created_at", data.until)
        .order("created_at").order("id").range(offset, offset + 999);
      if (result.error) throw new Error("Não foi possível carregar os cliques.");
      clicks.push(...((result.data ?? []) as ServiceClickEvent[]));
      if (!result.data || result.data.length < 1000) break;
    }
    const qualityLeads: QualityLead[] = [];
    for (let offset = 0; ; offset += 1000) {
      const result = await context.supabase.from("leads")
        .select("id,form_path,landing_path,objetivo,utm_source,utm_medium,utm_campaign,utm_content,gclid,status,crm_synced_at,location,area_m2,chaves")
        .gte("created_at", data.from).lte("created_at", data.until)
        .order("created_at").order("id").range(offset, offset + 999);
      if (result.error) throw new Error("Não foi possível carregar os pedidos.");
      qualityLeads.push(...(result.data ?? []));
      if (!result.data || result.data.length < 1000) break;
    }
    const leads: ServiceLead[] = qualityLeads.filter(lead => paths.includes((lead.landing_path ?? "").split(/[?#]/)[0]));
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
          for (const item of result.leads) if (allowed.has(item.lead_id) && typeof item.deal_count === "number" && item.deal_count > 0) confirmed.add(item.lead_id);
        } catch { /* Leitura falhou: indisponível, nunca zero confirmado. */ }
      }
    }
    const adsLeads = qualityLeads.filter(lead => lead.form_path === "/orcamento" && isQualityAdsLead(lead));
    const discarded = adsLeads.filter(lead => lead.status === "descartado");
    const reasons: Record<string, string> = {};
    const reasonChecked = new Set<string>();
    if (key && discarded.length) {
      const { readCrmDiscardReasons } = await import("@/lib/crmDiscardReasons.server");
      for (let offset = 0; offset < discarded.length; offset += 100) {
        const ids = discarded.slice(offset, offset + 100).map(lead => lead.id);
        try {
          Object.assign(reasons, await readCrmDiscardReasons(key, ids));
          for (const id of ids) reasonChecked.add(id);
        } catch { /* Falha da origem é distinta de campo não exportado. */ }
      }
    }
    return { rows: summarizeServiceAds(clicks, leads, confirmed, checked), qualityLeads: adsLeads.map(lead => ({ ...lead, gclid: null, attributedToGoogleAds: true, discard_reason: reasons[lead.id] ?? null, discard_reason_unavailable: lead.status === "descartado" && !reasonChecked.has(lead.id) })), checkedAt: new Date().toISOString() };
  });
