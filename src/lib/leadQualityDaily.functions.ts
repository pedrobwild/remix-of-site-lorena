import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { attachCrmAuth } from "@/lib/crmAuth";
import { qualityDaily, type QualityEvent } from "@/lib/leadQualityDaily";

export const getLeadQualityDaily = createServerFn({ method: "POST" })
  .middleware([attachCrmAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const role = await context.supabase.rpc("is_admin");
    if (role.error || role.data !== true) throw new Error("Acesso restrito a administradores.");
    const now = new Date();
    const since = new Date(now.getTime() - 31 * 86400000).toISOString();
    const events: QualityEvent[] = [];
    for (let offset = 0; ; offset += 1000) {
      const result = await context.supabase.from("lead_qualification_log")
        .select("id,lead_id,to_status,created_at").in("to_status", ["qualificado", "descartado"])
        .gte("created_at", since).order("created_at").order("id").range(offset, offset + 999);
      if (result.error) throw new Error("Não foi possível carregar as marcações diárias.");
      events.push(...(result.data ?? []));
      if ((result.data?.length ?? 0) < 1000) break;
    }
    const delivery = await context.supabase.from("integration_log")
      .select("created_at,status,detail").eq("integration", "google_ads_disqualified_list")
      .order("created_at", { ascending: false }).order("id").limit(1).maybeSingle();
    const detail = delivery.data?.detail;
    const count = detail && typeof detail === "object" && !Array.isArray(detail) && typeof detail.enviados === "number" ? detail.enviados : null;
    return { daily: qualityDaily(events, now), checkedAt: now.toISOString(), delivery: delivery.error ? null : {
      at: delivery.data?.created_at ?? null, status: delivery.data?.status ?? null, count,
    } };
  });