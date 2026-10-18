import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { attachCrmAuth } from "@/lib/crmAuth";
import { isGoogleAdsLead, summarizeAdsReturn, type ReturnContract, type ReturnLead } from "@/lib/adsReturnReport";

export const getAdsReturnReport = createServerFn({ method: "POST" })
  .middleware([attachCrmAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const role = await context.supabase.rpc("is_admin");
    if (role.error || role.data !== true) throw new Error("Acesso restrito a administradores.");
    const all: ReturnLead[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await context.supabase.from("leads")
        .select("id,objetivo,gclid,utm_source,utm_medium,utm_campaign")
        .order("created_at").order("id").range(from, from + 999);
      if (error) throw new Error("Não foi possível consultar os leads.");
      all.push(...((data ?? []) as ReturnLead[]));
      if (!data || data.length < 1000) break;
    }
    const leads = all.filter(isGoogleAdsLead);
    const checked = new Set<string>();
    const confirmed = new Set<string>();
    let contracts: ReturnContract[] | null = null;
    const { resolveEngineKey } = await import("@/lib/externalApi.server");
    const key = await resolveEngineKey(process.env["BWILD_ENGINE_INTEGRATION_KEY"], process.env["EXTERNAL_API_ENCRYPTION_KEY"]);
    if (key) {
      const { fetchEngineStages } = await import("@/lib/crmStageSync.server");
      for (let i = 0; i < leads.length; i += 100) {
        const ids = leads.slice(i, i + 100).map(l => l.id);
        try {
          const result = await fetchEngineStages(key, { lead_ids: ids });
          ids.forEach(id => checked.add(id));
          const allowed = new Set(ids);
          for (const item of result.leads) if (allowed.has(item.lead_id) && typeof item.deal_count === "number" && item.deal_count > 0) confirmed.add(item.lead_id);
        } catch { /* sem leitura: fica "sem leitura", nunca zero confirmado */ }
      }
      try {
        const { readCrmContracts } = await import("@/lib/crmContracts.server");
        contracts = await readCrmContracts(key, leads.map(l => l.id));
      } catch (error) {
        console.error("ads-return: leitura de contratos falhou", error instanceof Error ? error.message : "erro");
      }
    }
    return { rows: summarizeAdsReturn(leads, confirmed, checked, contracts), contractsAvailable: contracts !== null, checkedAt: new Date().toISOString() };
  });
