// Evento de QUALIDADE do lead do SITE na Meta (Conversions API):
// `qualificado` → QualifiedLead, `descartado` → DisqualifiedLead.
// Usado pela `meta-lead-quality` (painel) e pela `crm-stage-sync` (funil do
// Bwild Engine) — a regra mora só aqui. Idempotente por `meta_qualified_sent_at`.
// Cada tentativa fica em `integration_log` (sem PII).

import type { SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";
import { logIntegration } from "./integration-log.ts";
import {
  AD_LEAD_FORMS,
  capiLogEntry,
  capiRequiresConsent,
  type MetaEventName,
  resolveMetaCapiConfig,
  sendMetaEvents,
  statusEventId,
} from "./meta-capi.ts";

export const SITE_STATUS_EVENTS: Record<string, MetaEventName> = {
  qualificado: "QualifiedLead",
  descartado: "DisqualifiedLead",
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

export type SiteLeadQualityResult =
  | { ok: true; meta: "sent" | "skipped"; event?: MetaEventName; reason?: string; sent_at?: string }
  | { ok: false; meta: "error"; reason: string; httpStatus?: number };

export async function sendSiteLeadQuality(
  admin: SupabaseClient,
  leadId: string,
  status: string,
  opts: { force?: boolean; eventSource?: string } = {},
): Promise<SiteLeadQualityResult> {
  const getEnv = (n: string) => Deno.env.get(n);
  const eventName = SITE_STATUS_EVENTS[status];
  if (!eventName) return { ok: true, meta: "skipped", reason: "status_not_tracked" };

  const { data: lead, error } = await admin
    .from("leads")
    .select(
      "id, name, whatsapp, email, location, objetivo, form_path, utm_source, utm_campaign, user_agent, fbp, fbc, consent_marketing, created_at, meta_qualified_sent_at",
    )
    .eq("id", leadId)
    .maybeSingle<LeadRow>();
  if (error) {
    console.error("[lead-quality] lead select failed", error.code ?? "unknown");
    return { ok: false, meta: "error", reason: "lead_lookup_failed", httpStatus: 500 };
  }
  if (!lead) return { ok: false, meta: "error", reason: "lead_not_found", httpStatus: 404 };

  if (capiRequiresConsent(getEnv) && lead.consent_marketing !== true) {
    return { ok: true, meta: "skipped", reason: "no_consent" };
  }
  if (!lead.form_path || !AD_LEAD_FORMS.includes(lead.form_path)) {
    return { ok: true, meta: "skipped", reason: "not_ad_form" };
  }
  if (eventName === "QualifiedLead" && lead.meta_qualified_sent_at && opts.force !== true) {
    return { ok: true, meta: "skipped", reason: "already_sent", sent_at: lead.meta_qualified_sent_at };
  }

  const base = { integration: "meta_capi", event_name: eventName, lead_id: lead.id };
  const { data: settings } = await admin.from("site_settings").select("*").eq("id", 1).maybeSingle();
  const resolved = resolveMetaCapiConfig(getEnv, settings as Record<string, unknown> | null);
  if (!resolved.config) {
    await logIntegration(admin, { ...base, status: "skipped", detail: { reason: resolved.reason } });
    return { ok: true, meta: "skipped", reason: resolved.reason };
  }
  const config = resolved.config;

  const result = await sendMetaEvents(config, [
    {
      eventName,
      eventId: statusEventId(lead.id, eventName),
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
        lead_event_source: opts.eventSource ?? "Bewild Admin",
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
    console.error("[lead-quality] meta capi failed", result.httpStatus ?? result.reason);
    return { ok: false, meta: "error", reason: result.reason };
  }
  return result.status === "skipped"
    ? { ok: true, meta: "skipped", event: eventName, reason: result.reason }
    : { ok: true, meta: "sent", event: eventName };
}
