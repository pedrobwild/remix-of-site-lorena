import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { attachCrmAuth } from "@/lib/crmAuth";
import { qualifiedObjectivesReport } from "@/lib/qualifiedObjectives";
import { GOOGLE_ADS_OFFLINE_SELECT, pickQualifiedAt, toCsv, type ExportRecord } from "../../supabase/functions/_shared/data-export";

const period = z.object({ from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).refine(value => value.from <= value.until && Number.isFinite(Date.parse(value.from)) && Number.isFinite(Date.parse(value.until)), "Período inválido.");
export const getQualifiedObjectives = createServerFn({ method: "POST" })
  .middleware([attachCrmAuth, requireSupabaseAuth])
  .inputValidator((input: unknown) => period.parse(input))
  .handler(async ({ data, context }) => {
    const role = await context.supabase.rpc("is_admin");
    if (role.error || role.data !== true) throw new Error("Acesso restrito a administradores.");
    const leads: ExportRecord[] = [];
    const until = new Date(Date.parse(`${data.until}T00:00:00-03:00`) + 86400000).toISOString();
    for (let offset = 0; ; offset += 1000) {
      const result = await context.supabase.from("leads").select(GOOGLE_ADS_OFFLINE_SELECT).eq("status", "qualificado")
        .gte("created_at", `${data.from}T00:00:00-03:00`).lt("created_at", until).order("created_at").order("id").range(offset, offset + 999);
      if (result.error) throw new Error("Não foi possível consultar os qualificados.");
      leads.push(...(result.data ?? []) as unknown as ExportRecord[]);
      if (!result.data || result.data.length < 1000) break;
    }
    const history: { lead_id: string; created_at: string; note: string | null }[] = [];
    for (let chunk = 0; chunk < leads.length; chunk += 200) {
      const ids = leads.slice(chunk, chunk + 200).map(lead => String(lead.id));
      for (let offset = 0; ; offset += 1000) {
        const result = await context.supabase.from("lead_qualification_log").select("id,lead_id,created_at,note").in("lead_id", ids).eq("to_status", "qualificado").order("created_at").order("id").range(offset, offset + 999);
        if (result.error) throw new Error("Não foi possível consultar a hora da qualificação.");
        history.push(...(result.data ?? []));
        if (!result.data || result.data.length < 1000) break;
      }
    }
    history.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
    const report = await qualifiedObjectivesReport(leads, pickQualifiedAt(history), new Date());
    return { groups: report.groups, total: report.total, exportCount: report.rows.length, csv: toCsv("google_ads_offline", report.rows, { sep: ",", dec: "." }) };
  });