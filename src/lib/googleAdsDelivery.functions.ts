import { createServerFn } from "@tanstack/react-start";
import { attachCrmAuth } from "@/lib/crmAuth";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getGoogleAdsDeliveryStatus = createServerFn({ method: "POST" }).middleware([attachCrmAuth, requireSupabaseAuth]).handler(async ({ context }) => {
  const role = await context.supabase.rpc("is_admin");
  if (role.error || role.data !== true) throw new Error("Acesso restrito.");
  const settings = await context.supabase.from("google_ads_delivery_settings").select("enabled,qualification_import_disabled").maybeSingle();
  if (settings.error) throw new Error("Não foi possível consultar o envio automático.");
  const counts: Record<string, number> = { pending: 0, processing: 0, accepted: 0, blocked: 0, failed: 0 };
  for (const state of Object.keys(counts)) {
    const result = await context.supabase.from("google_ads_delivery_queue").select("id", { count: "exact", head: true }).eq("state", state);
    if (result.error) throw new Error("Não foi possível consultar os resultados.");
    counts[state] = result.count ?? 0;
  }
  return { enabled: settings.data?.enabled === true && settings.data?.qualification_import_disabled === true, counts };
});