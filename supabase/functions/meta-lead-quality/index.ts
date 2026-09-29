// Edge function: meta-lead-quality
// Envia à Meta (Conversions API) o evento de QUALIDADE do lead quando o time
// muda o status no painel. Duas origens:
//
//  - Lead do SITE (`leads`, corpo `{ lead_id, status }`): `qualificado` →
//    QualifiedLead, `descartado` → DisqualifiedLead, com PII em hash + fbp/fbc.
//    Só formulário de cliente; aceite de cookies só se
//    `META_CAPI_REQUIRE_CONSENT=true`. Idempotente por `meta_qualified_sent_at`.
//
//  - Lead de FORMULÁRIO INSTANTÂNEO da Meta (`meta_leads`, corpo
//    `{ source: "meta", lead_id, status }`): estágio do CRM (`lead_contatado`,
//    `lead_qualificado`, `lead_descartado`) com `user_data.lead_id` = id do lead
//    na Meta — a "API de Conversões para CRM" (Conversion Leads). O primeiro
//    estágio (`lead_recebido`) sai da `meta-sync` quando o lead entra no painel.
//    Idempotente por (lead, estágio) via `integration_log`; `force: true` reenvia.
//
// Chamada por `notifyMetaLeadQuality` (src/lib/adminLeads.ts) com o JWT do
// admin; só ids e status saem do browser — os dados do lead vêm do banco pela
// service role. Cada tentativa fica em `integration_log`.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";
import { logIntegration } from "../_shared/integration-log.ts";
import {
  AD_LEAD_FORMS,
  capiLogEntry,
  capiRequiresConsent,
  CRM_STAGE_BY_STATUS,
  crmStageEvent,
  isMetaLeadId,
  type MetaCrmStage,
  type MetaEventName,
  resolveMetaCapiConfig,
  sendMetaEvents,
  statusEventId,
} from "../_shared/meta-capi.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Mesmo gate de meta-insights: JWT válido + public.is_admin(). */
async function requireAdmin(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json(401, { error: "não autorizado" });
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anonKey) return json(503, { error: "indisponível" });
  const client = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData } = await client.auth.getUser();
  if (!userData?.user) return json(401, { error: "não autorizado" });
  const { data: isAdmin, error } = await client.rpc("is_admin");
  if (error || isAdmin !== true) return json(403, { error: "somente administradores" });
  return null;
}

const STATUS_EVENTS: Record<string, MetaEventName> = {
  qualificado: "QualifiedLead",
  descartado: "DisqualifiedLead",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type MetaLeadRow = {
  id: string;
  meta_lead_id: string;
  created_time: string | null;
  form_name: string | null;
  campaign_name: string | null;
  platform: string | null;
  is_test: boolean | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  deleted_at: string | null;
};

type LeadRow = {
  id: string;
  name: string | null;
  whatsapp: string | null;
  email: string | null;
  location: string | null;
  objetivo: string | null;
  form_path: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  user_agent: string | null;
  fbp: string | null;
  fbc: string | null;
  consent_marketing: boolean | null;
  created_at: string | null;
  meta_qualified_sent_at: string | null;
};

/**
 * Estágio do CRM para um lead de formulário instantâneo (`meta_leads`).
 * `novo` não é mudança de estágio (o `lead_recebido` sai da meta-sync); os
 * outros três status viram `lead_contatado`/`lead_qualificado`/`lead_descartado`.
 */
async function sendCrmStage(
  admin: SupabaseClient,
  rowId: string,
  status: string,
  force: boolean,
): Promise<Response> {
  const stage: MetaCrmStage | undefined = status === "novo" ? undefined : CRM_STAGE_BY_STATUS[status];
  if (!stage) return json(200, { ok: true, meta: "skipped", reason: "status_not_tracked" });

  const { data: lead, error } = await admin
    .from("meta_leads")
    .select("id, meta_lead_id, created_time, form_name, campaign_name, platform, is_test, name, email, phone, city, deleted_at")
    .eq("id", rowId)
    .maybeSingle<MetaLeadRow>();
  if (error) {
    console.error("[meta-lead-quality] meta_leads select failed", error.code ?? "unknown");
    return json(500, { error: "lead_lookup_failed" });
  }
  if (!lead) return json(404, { error: "lead_not_found" });
  if (lead.deleted_at) return json(200, { ok: true, meta: "skipped", reason: "deleted" });
  if (!isMetaLeadId(lead.meta_lead_id)) return json(200, { ok: true, meta: "skipped", reason: "invalid_meta_lead_id" });

  // Idempotência sem coluna nova: o próprio integration_log diz se este
  // estágio já foi aceito pela Meta para esta linha.
  const detailBase = { source: "meta_leads", meta_lead_row: lead.id };
  const base = { integration: "meta_capi", event_name: stage, lead_id: null };
  if (!force) {
    const { data: prior } = await admin
      .from("integration_log")
      .select("created_at")
      .eq("integration", "meta_capi")
      .eq("event_name", stage)
      .eq("status", "sent")
      .contains("detail", { meta_lead_row: lead.id })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ created_at: string }>();
    if (prior) return json(200, { ok: true, meta: "skipped", reason: "already_sent", sent_at: prior.created_at });
  }

  const { data: settings } = await admin.from("site_settings").select("*").eq("id", 1).maybeSingle();
  const resolved = resolveMetaCapiConfig((name) => Deno.env.get(name), settings as Record<string, unknown> | null);
  if (!resolved.config) {
    await logIntegration(admin, { ...base, status: "skipped", detail: { ...detailBase, reason: resolved.reason } });
    console.warn("[meta-lead-quality] Meta CAPI não configurada:", resolved.reason);
    return json(200, { ok: true, meta: "skipped", reason: resolved.reason });
  }
  const config = resolved.config;

  const result = await sendMetaEvents(config, [
    crmStageEvent(
      {
        rowId: lead.id,
        metaLeadId: lead.meta_lead_id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        city: lead.city,
        formName: lead.form_name,
        campaignName: lead.campaign_name,
        platform: lead.platform,
        isTest: lead.is_test,
        createdTime: lead.created_time,
      },
      stage,
    ),
  ]);

  const entry = capiLogEntry(result, { test: !!config.testEventCode || !!lead.is_test });
  await logIntegration(admin, { ...base, ...entry, detail: { ...entry.detail, ...detailBase } });
  if (result.status === "error") {
    console.error("[meta-lead-quality] meta capi (crm) failed", result.httpStatus ?? result.reason);
    return json(200, { ok: false, meta: "error", reason: result.reason });
  }
  return json(200, {
    ok: true,
    meta: result.status,
    event: stage,
    ...(result.status === "skipped" ? { reason: result.reason } : {}),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const denied = await requireAdmin(req);
  if (denied) return denied;

  let body: { lead_id?: unknown; status?: unknown; force?: unknown; source?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return json(400, { error: "invalid_json" });
  }
  const leadId = typeof body.lead_id === "string" ? body.lead_id.trim() : "";
  const status = typeof body.status === "string" ? body.status.trim().toLowerCase() : "qualificado";
  if (!UUID_RE.test(leadId)) return json(400, { error: "invalid_lead_id" });
  const source = body.source === "meta" ? "meta" : "site";

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return json(503, { error: "service_unavailable" });
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  if (source === "meta") return await sendCrmStage(admin, leadId, status, body.force === true);

  const eventName = STATUS_EVENTS[status];
  if (!eventName) return json(200, { ok: true, meta: "skipped", reason: "status_not_tracked" });

  const { data: lead, error } = await admin
    .from("leads")
    .select(
      "id, name, whatsapp, email, location, objetivo, form_path, utm_source, utm_campaign, user_agent, fbp, fbc, consent_marketing, created_at, meta_qualified_sent_at",
    )
    .eq("id", leadId)
    .maybeSingle<LeadRow>();
  if (error) {
    console.error("[meta-lead-quality] lead select failed", error.code ?? "unknown");
    return json(500, { error: "lead_lookup_failed" });
  }
  if (!lead) return json(404, { error: "lead_not_found" });

  // Mesmas regras do Lead: parceiro/indicação não é lead de cliente; e o aceite
  // de cookies só é exigido com META_CAPI_REQUIRE_CONSENT=true.
  if (capiRequiresConsent((n) => Deno.env.get(n)) && lead.consent_marketing !== true) {
    return json(200, { ok: true, meta: "skipped", reason: "no_consent" });
  }
  if (!lead.form_path || !AD_LEAD_FORMS.includes(lead.form_path)) {
    return json(200, { ok: true, meta: "skipped", reason: "not_ad_form" });
  }
  if (eventName === "QualifiedLead" && lead.meta_qualified_sent_at && body.force !== true) {
    return json(200, { ok: true, meta: "skipped", reason: "already_sent", sent_at: lead.meta_qualified_sent_at });
  }

  const base = { integration: "meta_capi", event_name: eventName, lead_id: lead.id };
  const { data: settings } = await admin.from("site_settings").select("*").eq("id", 1).maybeSingle();
  const resolved = resolveMetaCapiConfig((name) => Deno.env.get(name), settings as Record<string, unknown> | null);
  if (!resolved.config) {
    await logIntegration(admin, { ...base, status: "skipped", detail: { reason: resolved.reason } });
    console.warn("[meta-lead-quality] Meta CAPI não configurada:", resolved.reason);
    return json(200, { ok: true, meta: "skipped", reason: resolved.reason });
  }
  const config = resolved.config;

  const result = await sendMetaEvents(config, [
    {
      eventName,
      eventId: statusEventId(lead.id, eventName),
      // Evento gerado pelo CRM/painel, não por uma ação do visitante no site.
      actionSource: "system_generated",
      user: {
        email: lead.email,
        phone: lead.whatsapp,
        fullName: lead.name,
        externalId: lead.id,
        fbp: lead.fbp,
        fbc: lead.fbc,
        clientUserAgent: lead.user_agent,
        city: lead.location,
      },
      customData: {
        lead_id: lead.id,
        lead_status: status,
        lead_event_source: "Bewild Admin",
        event_source: "crm",
        content_name: lead.form_path ?? "site",
        content_category: lead.objetivo,
        utm_source: lead.utm_source,
        utm_campaign: lead.utm_campaign,
        lead_created_at: lead.created_at,
      },
    },
  ]);

  await logIntegration(admin, { ...base, ...capiLogEntry(result, { test: !!config.testEventCode }) });
  if (result.status === "sent" && eventName === "QualifiedLead") {
    await admin
      .from("leads")
      .update({ meta_qualified_sent_at: new Date().toISOString() })
      .eq("id", lead.id)
      .then(() => undefined, () => undefined);
  }
  if (result.status === "error") {
    console.error("[meta-lead-quality] meta capi failed", result.httpStatus ?? result.reason);
    return json(200, { ok: false, meta: "error", reason: result.reason });
  }
  return json(200, {
    ok: true,
    meta: result.status,
    event: eventName,
    ...(result.status === "skipped" ? { reason: result.reason } : {}),
  });
});
