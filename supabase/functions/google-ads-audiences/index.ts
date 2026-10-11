// Edge function: google-ads-audiences
// Lê da conta Google Ads conectada (GOOGLE_ADS_CUSTOMER_ID) as listas de
// público (catálogo atual), conversões e campanhas do período/página pedidos.
// As datas seguem o fuso da conta. Somente admin.
// Só leitura (googleAds:search). Nunca retorna chaves.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import {
  accountDay,
  InvalidFilter,
  normalizeLandingPath,
  parseRequest,
  readPeriod,
} from "./report.ts";

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
    if (!pageToken) return out;
  }
  // Never quietly present a truncated set of landing URLs as complete totals.
  throw new Error("Google Ads pagination limit reached");
}

const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST")
    return json({ error: "método não permitido" }, 405);
  const denied = await requireAdmin(req);
  if (denied) return denied;

  if (
    !Deno.env.get("GOOGLE_ADS_CUSTOMER_ID") ||
    !Deno.env.get("GOOGLE_ADS_API_KEY") ||
    !Deno.env.get("LOVABLE_API_KEY")
  ) {
    return json({ connected: false, reason: "Google Ads não está conectado ao projeto." });
  }

  try {
    let input: unknown = {};
    if (req.method === "POST") {
      try {
        const text = await req.text();
        input = text ? JSON.parse(text) : {};
      } catch {
        throw new InvalidFilter("Envie filtros em JSON válido.");
      }
    } else {
      input = Object.fromEntries(new URL(req.url).searchParams);
    }
    const account = await gaql("SELECT customer.currency_code, customer.time_zone FROM customer");
    const timeZone = account[0]?.customer?.timeZone ?? "America/Sao_Paulo";
    const currency = account[0]?.customer?.currencyCode ?? "BRL";
    const today = accountDay(new Date(), timeZone);
    const filters = parseRequest(input, today);
    const landingPath = filters.segments.length
      ? normalizeLandingPath(filters.segments[0].value)
      : null;
    const [lists, actions] = await Promise.all([
      gaql(`SELECT user_list.id, user_list.name, user_list.type, user_list.membership_status,
              user_list.size_for_search, user_list.size_for_display, user_list.membership_life_span,
              user_list.eligible_for_search, user_list.eligible_for_display
            FROM user_list WHERE user_list.membership_status = 'OPEN'`),
      gaql(`SELECT conversion_action.id, conversion_action.name, conversion_action.category,
              conversion_action.type, conversion_action.status, conversion_action.primary_for_goal
            FROM conversion_action WHERE conversion_action.status != 'REMOVED'`),
    ]);
    const [current, previous] = await Promise.all([
      readPeriod(gaql, filters, landingPath, actions),
      filters.previous
        ? readPeriod(gaql, filters.previous, landingPath, actions)
        : Promise.resolve(null),
    ]);

    return json({
      connected: true,
      version: 2,
      request: filters,
      scope: { landingPath, lists: "account_current", timeZone, currency, today },
      fetchedAt: new Date().toISOString(),
      ...current,
      previous,
      lists: lists
        .map((r) => ({
          id: String(r.userList?.id),
          name: r.userList?.name ?? "",
          type: r.userList?.type ?? "",
          sizeSearch: r.userList?.sizeForSearch == null ? null : n(r.userList?.sizeForSearch),
          sizeDisplay: r.userList?.sizeForDisplay == null ? null : n(r.userList?.sizeForDisplay),
          lifeSpanDays: n(r.userList?.membershipLifeSpan),
          eligibleSearch: !!r.userList?.eligibleForSearch,
          eligibleDisplay: !!r.userList?.eligibleForDisplay,
        }))
        .sort((a, b) => (b.sizeDisplay ?? 0) - (a.sizeDisplay ?? 0)),
    });
  } catch (e) {
    if (e instanceof InvalidFilter) return json({ connected: false, reason: e.message }, 400);
    // Gateway error bodies can contain sensitive details; do not log them.
    console.error("google-ads-audiences: report failed");
    return json({ connected: false, reason: "Não foi possível ler a conta do Google Ads agora." });
  }
});
