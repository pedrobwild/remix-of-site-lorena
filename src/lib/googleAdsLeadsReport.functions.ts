import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { attachCrmAuth } from "@/lib/crmAuth";
import { leadCost } from "@/lib/googleAdsLeadsReport";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "Data inválida.");
const schema = z.object({ from: date, to: date }).refine(value => value.from <= value.to, "Período inválido.");

export const getGoogleAdsLeadsReport = createServerFn({ method: "POST" })
  .middleware([attachCrmAuth, requireSupabaseAuth])
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data, context }) => {
    const role = await context.supabase.rpc("is_admin");
    if (role.error || role.data !== true) throw new Error("Acesso restrito a administradores.");
    const key = process.env["LOVABLE_API_KEY"];
    const adsKey = process.env["GOOGLE_ADS_API_KEY"];
    const customer = process.env["GOOGLE_ADS_CUSTOMER_ID"];
    if (!key || !adsKey || !customer || !/^\d+$/.test(customer)) throw new Error("A conexão de relatórios do Google Ads não está configurada.");
    async function search(query: string): Promise<Record<string, any>[]> {
      const rows: Record<string, any>[] = [];
      const seen = new Set<string>();
      let pageToken: string | undefined;
      do {
        const response = await fetch(`https://connector-gateway.lovable.dev/google_ads/v25/customers/${customer}/googleAds:search`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "X-Connection-Api-Key": adsKey ?? "" },
          body: JSON.stringify({ query, ...(pageToken ? { pageToken } : {}) }),
          signal: AbortSignal.timeout(25000),
        });
        if (!response.ok) {
          const detail = await response.text();
          console.error(`Google Ads relatório [${response.status}]: ${detail}`);
          throw new Error(`Google Ads recusou a consulta (${response.status}). Tente atualizar ou conferir a conexão.`);
        }
        const payload = await response.json() as { results?: Record<string, any>[]; nextPageToken?: string };
        rows.push(...(payload.results ?? []));
        pageToken = payload.nextPageToken;
        if (pageToken && seen.has(pageToken)) throw new Error("O Google Ads retornou uma paginação incompleta.");
        if (pageToken) seen.add(pageToken);
      } while (pageToken);
      return rows;
    }
    const [accounts, actions] = await Promise.all([
      search("SELECT customer.descriptive_name, customer.currency_code, customer.time_zone FROM customer"),
      search("SELECT conversion_action.id, conversion_action.name, conversion_action.category, conversion_action.status, conversion_action.primary_for_goal FROM conversion_action WHERE conversion_action.status != 'REMOVED'"),
    ]);
    const { readPeriod } = await import("../../supabase/functions/google-ads-audiences/report");
    const report = await readPeriod(search, data, null, actions);
    const account = accounts[0]?.customer;
    if (!account?.currencyCode || !account?.timeZone) throw new Error("O Google Ads não informou a moeda ou o fuso da conta.");
    return { ...report, ...leadCost(report.totals.cost, report.conversions), currency: String(account.currencyCode), timeZone: String(account.timeZone), account: String(account.descriptiveName ?? "Bewild"), fetchedAt: new Date().toISOString() };
  });