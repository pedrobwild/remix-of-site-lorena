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
    return { status: data.status };
  });