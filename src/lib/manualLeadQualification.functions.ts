import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { attachCrmAuth } from "@/lib/crmAuth";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const setManualLeadQualification = createServerFn({ method: "POST" })
  .middleware([attachCrmAuth, requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ leadId: z.string().uuid(), status: z.enum(["qualificado", "descartado"]) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: status, error } = await context.supabase.rpc("set_manual_lead_qualification", { p_lead_id: data.leadId, p_status: data.status });
    if (error) throw new Error(error.message);
    if (status !== data.status) throw new Error("A qualificação não foi confirmada.");
    // Leva a marcação ao Bwild Engine na hora. Se falhar, fica na fila e a
    // sincronização de hora em hora tenta de novo; a marcação no site já vale.
    let engine: "enviado" | "pendente" = "pendente";
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { drainEngineQualityOutbox } = await import("@/lib/engineQualityOutbox.server");
      const r = await drainEngineQualityOutbox(supabaseAdmin, (n) => process.env[n], { leadId: data.leadId });
      if (!r.error && r.reenvio === 0 && r.falhas === 0 && r.lidos > 0) engine = "enviado";
    } catch {
      /* a fila segura a pendência */
    }
    // A Meta não recebe a marcação do painel: QualifiedLead/DisqualifiedLead
    // saem só da movimentação no funil do CRM, na sincronização de hora em
    // hora (Pedro, 18/11/2026) — mesma regra do Google Ads.
    const meta = "pipeline" as const;
    return { status: data.status, engine, meta };
  });