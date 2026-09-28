// Edge function: google-ads-audiences
// Lê da conta Google Ads conectada (GOOGLE_ADS_CUSTOMER_ID) as listas de
// público (user_list), as ações de conversão e as conversões dos últimos
// 30 dias, para a aba "Google Ads" do /admin/analytics. Somente admin.
// Só leitura (googleAds:search). Nunca retorna chaves.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
const GATEWAY = "https://connector-gateway.lovable.dev/google_ads/v25";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

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

type Row = Record<string, any>;

async function gaql(query: string): Promise<Row[]> {
  const cid = Deno.env.get("GOOGLE_ADS_CUSTOMER_ID")!;
  const out: Row[] = [];
  let pageToken: string | undefined;
  for (let i = 0; i < 10; i++) {
    const res = await fetch(`${GATEWAY}/customers/${cid}/googleAds:search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "X-Connection-Api-Key": Deno.env.get("GOOGLE_ADS_API_KEY")!,
      },
      body: JSON.stringify(pageToken ? { query, pageToken } : { query }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Google Ads ${res.status}: ${JSON.stringify(body).slice(0, 400)}`);
    out.push(...(body.results ?? []));
    pageToken = body.nextPageToken;
    if (!pageToken) break;
  }
  return out;
}

const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const denied = await requireAdmin(req);
  if (denied) return denied;

  if (!Deno.env.get("GOOGLE_ADS_CUSTOMER_ID") || !Deno.env.get("GOOGLE_ADS_API_KEY") || !Deno.env.get("LOVABLE_API_KEY")) {
    return json({ connected: false, reason: "Google Ads não está conectado ao projeto." });
  }

  try {
    const [lists, actions, perAction, campaigns] = await Promise.all([
      gaql(`SELECT user_list.id, user_list.name, user_list.type, user_list.membership_status,
              user_list.size_for_search, user_list.size_for_display, user_list.membership_life_span,
              user_list.eligible_for_search, user_list.eligible_for_display
            FROM user_list WHERE user_list.membership_status = 'OPEN'`),
      gaql(`SELECT conversion_action.id, conversion_action.name, conversion_action.category,
              conversion_action.type, conversion_action.status, conversion_action.primary_for_goal
            FROM conversion_action WHERE conversion_action.status != 'REMOVED'`),
      gaql(`SELECT segments.conversion_action_name, metrics.conversions, metrics.conversions_value
            FROM customer WHERE segments.date DURING LAST_30_DAYS`),
      gaql(`SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type,
              metrics.impressions, metrics.clicks, metrics.conversions, metrics.cost_micros
            FROM campaign WHERE campaign.status != 'REMOVED' AND segments.date DURING LAST_30_DAYS`),
    ]);

    const convByName = new Map<string, { conversions: number; value: number }>();
    for (const r of perAction) {
      const name = r.segments?.conversionActionName ?? "";
      const cur = convByName.get(name) ?? { conversions: 0, value: 0 };
      cur.conversions += n(r.metrics?.conversions);
      cur.value += n(r.metrics?.conversionsValue);
      convByName.set(name, cur);
    }

    const campMap = new Map<string, Row>();
    for (const r of campaigns) {
      const id = String(r.campaign?.id);
      const cur = campMap.get(id) ?? {
        id, name: r.campaign?.name, status: r.campaign?.status, channel: r.campaign?.advertisingChannelType,
        impressions: 0, clicks: 0, conversions: 0, cost: 0,
      };
      cur.impressions += n(r.metrics?.impressions);
      cur.clicks += n(r.metrics?.clicks);
      cur.conversions += n(r.metrics?.conversions);
      cur.cost += n(r.metrics?.costMicros) / 1_000_000;
      campMap.set(id, cur);
    }

    return json({
      connected: true,
      fetchedAt: new Date().toISOString(),
      lists: lists.map((r) => ({
        id: String(r.userList?.id),
        name: r.userList?.name ?? "",
        type: r.userList?.type ?? "",
        sizeSearch: n(r.userList?.sizeForSearch),
        sizeDisplay: n(r.userList?.sizeForDisplay),
        lifeSpanDays: n(r.userList?.membershipLifeSpan),
        eligibleSearch: !!r.userList?.eligibleForSearch,
        eligibleDisplay: !!r.userList?.eligibleForDisplay,
      })).sort((a, b) => b.sizeDisplay - a.sizeDisplay),
      conversions: actions.map((r) => {
        const name = r.conversionAction?.name ?? "";
        const c = convByName.get(name);
        return {
          id: String(r.conversionAction?.id),
          name,
          category: r.conversionAction?.category ?? "",
          status: r.conversionAction?.status ?? "",
          primary: !!r.conversionAction?.primaryForGoal,
          conversions30d: c?.conversions ?? 0,
          value30d: c?.value ?? 0,
        };
      }).sort((a, b) => b.conversions30d - a.conversions30d),
      campaigns: [...campMap.values()].sort((a, b) => b.cost - a.cost),
    });
  } catch (e) {
    console.error("google-ads-audiences", e instanceof Error ? e.message : e);
    return json({ connected: false, reason: "Não foi possível ler a conta do Google Ads agora." });
  }
});
