// Edge function: meta-insights
// Lê métricas agregadas da conta de anúncios Bwild na Meta Marketing API
// (Graph API /insights) e devolve um payload normalizado para o painel
// admin "Mídia paga". Nunca quebra: se faltar token ou a Graph API
// rejeitar, devolve { connected:false, reason } com status 200 pra UI
// degradar graciosamente. NUNCA loga/retorna o access_token.

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const GRAPH_VERSION = "v22.0";
const DEFAULT_ACCOUNT_ID = "1274618770498233";
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

function isLeadAction(t: string | undefined): boolean {
  if (!t) return false;
  return t.toLowerCase().includes("lead");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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
  const accountId = Deno.env.get("META_ADS_ACCOUNT_ID") || DEFAULT_ACCOUNT_ID;

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
  apiUrl.searchParams.set("access_token", token);

  let res: Response;
  try {
    res = await fetch(apiUrl.toString(), { method: "GET" });
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
      error: String(msg).slice(0, 200),
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

  const leads = (row.actions ?? [])
    .filter((a) => isLeadAction(a.action_type))
    .reduce((sum, a) => sum + num(a.value), 0);

  let cpl: number | null = null;
  const leadCost = (row.cost_per_action_type ?? []).find((c) =>
    isLeadAction(c.action_type),
  );
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
