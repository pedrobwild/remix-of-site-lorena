// Evento de QUALIDADE do lead do SITE na Meta (Conversions API):
// `qualificado` → QualifiedLead, `descartado` → DisqualifiedLead.
// Fonte única da regra, usada pela edge function `meta-lead-quality` (painel)
// e pela sincronização do funil do Bwild Engine (`src/lib/crmStageSync.server.ts`).
// Módulo puro: sem `Deno.*` nem imports `npm:` (recebe o cliente service-role
// e o leitor de env), por isso roda no Deno, no servidor do site e no Vitest.
// Idempotente por `meta_qualified_sent_at`. Cada tentativa vai para
// `integration_log` (sem PII).

import {
  AD_LEAD_FORMS,
  capiLogEntry,
  capiRequiresConsent,
  type MetaEventName,
  resolveMetaCapiConfig,
  sendMetaEvents,
  statusEventId,
} from "./meta-capi.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Só o que usamos do cliente supabase-js (service role). */
export type ServiceDb = { from: (table: string) => any };
/* eslint-enable @typescript-eslint/no-explicit-any */

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

async function log(admin: ServiceDb, row: Record<string, unknown>): Promise<void> {
  try {
    const { error } = await admin.from("integration_log").insert(row);
    if (error) console.warn("[integration_log] insert failed", error.code ?? "unknown");
  } catch {
    /* o registro nunca derruba o envio */
  }
}

export async function sendSiteLeadQuality(
  admin: ServiceDb,
  getEnv: (name: string) => string | null | undefined,
  leadId: string,
  status: string,
  opts: { force?: boolean; eventSource?: string } = {},
): Promise<SiteLeadQualityResult> {
  const eventName = SITE_STATUS_EVENTS[status];
  if (!eventName) return { ok: true, meta: "skipped", reason: "status_not_tracked" };

  const { data, error } = await admin
    .from("leads")
    .select(
      "id, name, whatsapp, email, location, objetivo, form_path, utm_source, utm_campaign, user_agent, fbp, fbc, consent_marketing, created_at, meta_qualified_sent_at",
    )
    .eq("id", leadId)
    .maybeSingle();
  const lead = data as LeadRow | null;
  if (error) {
    console.error("[lead-quality] lead select failed", error.code ?? "unknown");
    return { ok: false, meta: "error", reason: "lead_lookup_failed", httpStatus: 500 };
  }
  if (!lead) return { ok: false, meta: "error", reason: "lead_not_found", httpStatus: 404 };

  // Parceiro/indicação não é lead de cliente; aceite de cookies só com
  // META_CAPI_REQUIRE_CONSENT=true.
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
    await log(admin, { ...base, status: "skipped", http_status: null, detail: { reason: resolved.reason } });
    return { ok: true, meta: "skipped", reason: resolved.reason };
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

  const entry = capiLogEntry(result, { test: !!config.testEventCode });
  await log(admin, { ...base, ...entry, http_status: entry.http_status ?? null, detail: entry.detail ?? null });
  if (result.status === "sent" && eventName === "QualifiedLead") {
    try {
      await admin.from("leads").update({ meta_qualified_sent_at: new Date().toISOString() }).eq("id", lead.id);
    } catch {
      /* segue: o evento já saiu */
    }
  }
  if (result.status === "error") {
    console.error("[lead-quality] meta capi failed", result.httpStatus ?? result.reason);
    return { ok: false, meta: "error", reason: result.reason };
  }
  return result.status === "skipped"
    ? { ok: true, meta: "skipped", event: eventName, reason: result.reason }
    : { ok: true, meta: "sent", event: eventName };
}
