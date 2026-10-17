import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { attachCrmAuth } from "@/lib/crmAuth";

export const getCrmProfileSummary = createServerFn({ method: "POST" })
  .middleware([attachCrmAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error } = await context.supabase.rpc("is_admin");
    if (error || isAdmin !== true) throw new Error("Acesso restrito a administradores.");
    const { resolveEngineKey } = await import("@/lib/externalApi.server");
    const key = await resolveEngineKey(process.env["BWILD_ENGINE_INTEGRATION_KEY"], process.env["EXTERNAL_API_ENCRYPTION_KEY"]);
    if (!key) return { summary: null, available: false };
    try {
      const { readCrmProfiles } = await import("@/lib/crmProfiles.server");
      return { summary: (await readCrmProfiles(key)).summary, available: true };
    } catch { return { summary: null, available: false }; }
  });