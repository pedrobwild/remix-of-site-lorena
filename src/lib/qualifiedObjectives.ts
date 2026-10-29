import { buildGoogleAdsOfflineRows, GOOGLE_ADS_QUALIFIED_CONVERSION, type ExportRecord } from "../../supabase/functions/_shared/data-export";

export async function qualifiedObjectivesReport(leads: ExportRecord[], qualifiedAt: Map<string, string>, now: Date) {
  const qualified = leads.filter(lead => lead.status === "qualificado");
  const groups = new Map<string, number>();
  for (const lead of qualified) {
    const objective = typeof lead.objetivo === "string" && lead.objetivo.trim() ? lead.objetivo.trim() : "Não informado";
    groups.set(objective, (groups.get(objective) ?? 0) + 1);
  }
  const rows = (await buildGoogleAdsOfflineRows({ leads: qualified, qualifiedAt, now })).filter(row => row["Conversion Name"] === GOOGLE_ADS_QUALIFIED_CONVERSION);
  return { groups: [...groups].map(([objective, count]) => ({ objective, count })).sort((a, b) => b.count - a.count), total: qualified.length, rows };
}