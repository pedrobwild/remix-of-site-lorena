// Edge function: gbp-sync
// Lê a ficha da Bewild no Google Business Profile (via conector) e grava
// endereço e telefone em `site_settings`, que a página de contato e os dados
// estruturados usam. Roda toda segunda-feira pelo cron e pelo botão manual.
// Cada rodada deixa uma linha em `integration_log` (sem dados pessoais).
//
// Acesso: cron interno (x-cron-key === INDEX_TRACKER_CRON_KEY) ou admin
// logado (JWT + public.is_admin()). A chave da conexão nunca é logada.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { logIntegration } from "../_shared/integration-log.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Ficha "Bewild Reformas e Arquitetura" (única localização da conta).
const GBP_LOCATION_ID = "9026212938507676931";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_business_profile";
const READ_MASK = "title,phoneNumbers,storefrontAddress,websiteUri";

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Cron (x-cron-key) ou admin logado. Devolve a resposta de erro ou null. */
async function authorize(req: Request): Promise<Response | null> {
  const cronKey = Deno.env.get("INDEX_TRACKER_CRON_KEY");
  if (cronKey && req.headers.get("x-cron-key") === cronKey) return null;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json(401, { error: "não autorizado" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: isAdmin, error } = await userClient.rpc("is_admin");
  if (error || !isAdmin) return json(403, { error: "somente administradores" });
  return null;
}

type GbpLocation = {
  title?: string;
  phoneNumbers?: { primaryPhone?: string };
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
  };
  websiteUri?: string;
};

/** Monta "Rua Pitú, 72, Brooklin, São Paulo-SP" a partir do endereço da ficha. */
function formatAddress(addr: NonNullable<GbpLocation["storefrontAddress"]>): string {
  const parts = [
    (addr.addressLines ?? []).join(", "),
    addr.locality,
    addr.administrativeArea,
  ].filter((p) => p && p.trim());
  return parts.join(", ");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "método não suportado" });

  const denied = await authorize(req);
  if (denied) return denied;

  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const gbpKey = Deno.env.get("GOOGLE_BUSINESS_PROFILE_API_KEY");
  if (!lovableKey || !gbpKey) {
    return json(500, { error: "conexão do Google Business Profile não configurada" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const res = await fetch(
      `${GATEWAY_URL}/business_information/v1/locations/${GBP_LOCATION_ID}?readMask=${READ_MASK}`,
      {
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": gbpKey,
        },
      },
    );
    if (!res.ok) {
      const body = await res.text();
      await logIntegration(supabase, {
        integration: "gbp-sync",
        event_name: "sync",
        status: "error", lead_id: null,
        http_status: res.status,
        detail: { provider_body: body.slice(0, 500) },
      });
      return json(res.status, { error: "falha ao ler a ficha do Google", details: body });
    }

    const loc = (await res.json()) as GbpLocation;
    const phone = loc.phoneNumbers?.primaryPhone?.trim() || null;
    const address = loc.storefrontAddress ? formatAddress(loc.storefrontAddress) : null;

    if (!phone && !address) {
      await logIntegration(supabase, {
        integration: "gbp-sync",
        event_name: "sync",
        status: "skipped", lead_id: null,
        detail: { reason: "ficha sem endereço nem telefone" },
      });
      return json(200, { ok: true, updated: false, reason: "ficha sem endereço nem telefone" });
    }

    const { data: row, error: readErr } = await supabase
      .from("site_settings")
      .select("id, contact_phone, address_street")
      .limit(1)
      .single();
    if (readErr || !row) throw new Error(`site_settings ilegível: ${readErr?.message}`);

    const nextPhone = phone ?? row.contact_phone;
    const nextAddress = address ?? row.address_street;
    const changed = nextPhone !== row.contact_phone || nextAddress !== row.address_street;

    if (changed) {
      const { error: upErr } = await supabase
        .from("site_settings")
        .update({ contact_phone: nextPhone, address_street: nextAddress })
        .eq("id", row.id);
      if (upErr) throw new Error(`falha ao gravar site_settings: ${upErr.message}`);
    }

    await logIntegration(supabase, {
      integration: "gbp-sync",
      event_name: "sync",
      status: "sent", lead_id: null,
      detail: {
        changed,
        phone: nextPhone,
        address: nextAddress,
        location: loc.title ?? null,
      },
    });

    return json(200, {
      ok: true,
      updated: changed,
      phone: nextPhone,
      address: nextAddress,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logIntegration(supabase, {
      integration: "gbp-sync",
      event_name: "sync",
      status: "error", lead_id: null,
      detail: { message },
    }).catch(() => {});
    return json(500, { error: message });
  }
});
