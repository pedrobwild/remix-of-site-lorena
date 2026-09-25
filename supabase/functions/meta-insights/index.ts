// Edge function: meta-insights
// Lê métricas agregadas da conta de anúncios Bwild na Meta Marketing API
// (Graph API /insights) e devolve um payload normalizado para o painel
// admin "Mídia paga". Nunca quebra: se faltar token ou a Graph API
// rejeitar, devolve { connected:false, reason } com status 200 pra UI
// degradar graciosamente. NUNCA loga/retorna o access_token.
//
// Somente admin logado: sem isso qualquer pessoa com a chave pública do
// site lia gasto, CPL, CTR e o id da conta de anúncios (e consumia a cota
// da Graph API).

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { META_GRAPH_VERSION, redactSecrets } from "../_shared/meta-capi.ts";
import { DEFAULT_AD_ACCOUNT_ID, leadsFromActions } from "../_shared/meta-leads.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// A v22.0 saiu do ar; a versão acompanha a da API de Conversões.
const GRAPH_VERSION = META_GRAPH_VERSION;
const ALLOWED_PRESETS = new Set([
  "today",
  "last_7d",
  "last_30d",
  "this_month",
]);

type Json = Record<string, unknown>;

function json(body: Json, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type MetaAction = { action_type?: string; value?: string };
type MetaCost = { action_type?: string; value?: string };
type MetaInsightRow = {
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  actions?: MetaAction[];
  cost_per_action_type?: MetaCost[];
};

function num(v: unknown): number {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Valida o JWT do usuário e `is_admin()` no banco. Devolve a resposta de erro ou null. */
async function requireAdmin(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "não autorizado" }, 401);
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anonKey) return json({ error: "indisponível" }, 503);
  const client = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData } = await client.auth.getUser();
  if (!userData?.user) return json({ error: "não autorizado" }, 401);
  const { data: isAdmin, error } = await client.rpc("is_admin");
  if (error || isAdmin !== true) return json({ error: "somente administradores" }, 403);
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const denied = await requireAdmin(req);
  if (denied) return denied;

  // Janela
  let datePreset = "last_30d";
  try {
    if (req.method === "POST") {
      const body = (await req.json().catch(() => ({}))) as { date_preset?: string };
      if (body?.date_preset && ALLOWED_PRESETS.has(body.date_preset)) {
        datePreset = body.date_preset;
      }
    } else {
      const url = new URL(req.url);
      const p = url.searchParams.get("date_preset");
      if (p && ALLOWED_PRESETS.has(p)) datePreset = p;
    }
  } catch {
    // mantém default
  }

  const token = Deno.env.get("META_ADS_ACCESS_TOKEN");
  if (!token) {
    return json({ connected: false, reason: "no_token" });
  }
  const accountId = (Deno.env.get("META_ADS_ACCOUNT_ID") || "").replace(/^act_/i, "") || DEFAULT_AD_ACCOUNT_ID;

  const fields = [
    "spend",
    "impressions",
    "clicks",
    "ctr",
    "cpc",
    "cpm",
    "actions",
    "cost_per_action_type",
  ].join(",");

  const apiUrl = new URL(
    `https://graph.facebook.com/${GRAPH_VERSION}/act_${accountId}/insights`,
  );
  apiUrl.searchParams.set("fields", fields);
  apiUrl.searchParams.set("date_preset", datePreset);

  let res: Response;
  try {
    // Token no cabeçalho: na URL ele podia aparecer em logs de proxy.
    res = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (_e) {
    return json({
      connected: false,
      reason: "api_error",
      error: "Falha de rede ao contatar a Graph API.",
    });
  }

  const payload = (await res.json().catch(() => null)) as
    | { data?: MetaInsightRow[]; error?: { message?: string; code?: number } }
    | null;

  if (!res.ok || !payload || payload.error) {
    const msg =
      payload?.error?.message || `Graph API respondeu ${res.status}.`;
    return json({
      connected: false,
      reason: "api_error",
      error: redactSecrets(String(msg)).slice(0, 200),
    });
  }

  const row = payload.data?.[0];
  if (!row) {
    return json({
      connected: true,
      account_id: accountId,
      date_preset: datePreset,
      currency: "BRL",
      spend: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      cpc: 0,
      cpm: 0,
      leads: 0,
      cpl: null,
      roas: null,
      roas_available: false,
      updated_at: new Date().toISOString(),
    });
  }

  const spend = num(row.spend);
  const impressions = num(row.impressions);
  const clicks = num(row.clicks);
  const ctr = num(row.ctr);
  const cpc = num(row.cpc);
  const cpm = num(row.cpm);

  // `lead` já é o total (formulário + site). Somar toda ação com "lead" no
  // nome contava o mesmo lead duas ou três vezes.
  const leads = leadsFromActions(row.actions).leads;

  let cpl: number | null = null;
  const leadCost = (row.cost_per_action_type ?? []).find((c) => c.action_type === "lead");
  if (leadCost) {
    cpl = num(leadCost.value);
  } else if (leads > 0) {
    cpl = spend / leads;
  }

  return json({
    connected: true,
    account_id: accountId,
    date_preset: datePreset,
    currency: "BRL",
    spend,
    impressions,
    clicks,
    ctr,
    cpc,
    cpm,
    leads,
    cpl,
    roas: null,
    roas_available: false,
    updated_at: new Date().toISOString(),
  });
});
