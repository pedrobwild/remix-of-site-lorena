// Edge function: notify-lead
// Notifies the commercial team on Slack AND creates an MQL card in the
// Bwild Engine CRM. Slack and CRM are independent: a failure in one does
// not block the other. Fire-and-forget from the client.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Lead = {
  id?: string | null;
  name?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  location?: string | null;
  area_m2?: number | null;
  objetivo?: string | null;
  chaves?: string | null;
  planta?: string | null;
  message?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  referrer?: string | null;
  landing_path?: string | null;
  user_agent?: string | null;
};

type Outcome = "sent" | "skipped" | "error";

type StepResult = {
  status: Outcome;
  id?: string;
  error?: string;
};

type CrmResult = Outcome;

function fmtDateBR(d: Date): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

function waLink(whatsapp?: string | null): string | null {
  if (!whatsapp) return null;
  const digits = String(whatsapp).replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/55${digits}`;
}

function buildSlackMessage(lead: Lead) {
  const blocks: unknown[] = [];

  blocks.push({
    type: "header",
    text: { type: "plain_text", text: "Novo lead · Diagnóstico Bewild" },
  });

  const wa = waLink(lead.whatsapp);

  const fields: { label: string; value: string }[] = [];
  const push = (label: string, value?: string | number | null) => {
    if (value === null || value === undefined) return;
    const s = String(value).trim();
    if (!s) return;
    fields.push({ label, value: s });
  };

  push("Nome", lead.name);
  if (wa) fields.push({ label: "WhatsApp", value: `<${wa}|${lead.whatsapp}>` });
  push("E-mail", lead.email);
  push("Local", lead.location);
  push("Metragem (m²)", lead.area_m2 ?? null);
  push("Objetivo", lead.objetivo);
  push("Chaves", lead.chaves);
  push("Planta", lead.planta);

  if (fields.length) {
    blocks.push({
      type: "section",
      fields: fields.map((f) => ({
        type: "mrkdwn",
        text: `*${f.label}*\n${f.value}`,
      })),
    });
  }

  if (lead.message && lead.message.trim()) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Mensagem*\n${lead.message.trim()}` },
    });
  }

  const origin: string[] = [];
  if (lead.utm_source) origin.push(`utm_source: ${lead.utm_source}`);
  if (lead.utm_medium) origin.push(`utm_medium: ${lead.utm_medium}`);
  if (lead.utm_campaign) origin.push(`utm_campaign: ${lead.utm_campaign}`);
  if (lead.referrer) origin.push(`referrer: ${lead.referrer}`);
  if (lead.landing_path) origin.push(`landing_path: ${lead.landing_path}`);
  if (origin.length) {
    blocks.push({ type: "divider" });
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Origem*\n${origin.join("\n")}` },
    });
  }

  if (wa) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Falar no WhatsApp" },
          url: wa,
          style: "primary",
        },
      ],
    });
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `Recebido em ${fmtDateBR(new Date())} (America/Sao_Paulo)${
          lead.id ? ` · id: ${lead.id}` : ""
        }`,
      },
    ],
  });

  return {
    text: `Novo lead · Diagnóstico Bewild${lead.name ? ` · ${lead.name}` : ""}`,
    blocks,
  };
}

async function notifySlack(lead: Lead): Promise<Outcome> {
  const webhookUrl = Deno.env.get("SLACK_WEBHOOK_URL");
  if (!webhookUrl) {
    console.warn("[notify-lead] SLACK_WEBHOOK_URL is not set; skipping Slack");
    return "skipped";
  }
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildSlackMessage(lead)),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${body.slice(0, 200)}`);
    }
    return "sent";
  } catch (err) {
    console.error("[notify-lead] slack post failed", err);
    return "error";
  }
}

/**
 * LEAD-07 — limites de tamanho por campo.
 *
 * Esta função grava com a SERVICE ROLE KEY, então nenhuma policy de RLS
 * limita o que entra: até a auditoria de 22/09/2026 qualquer POST anônimo
 * podia inserir strings de tamanho arbitrário em `leads`. Os tetos abaixo
 * são generosos para uso legítimo (o formulário já limita `nome` a 120) e
 * cortam o abuso. Truncar em vez de rejeitar: um lead real com um campo
 * grande demais precisa chegar ao time comercial mesmo assim.
 */
const FIELD_LIMITS = {
  name: 120,
  whatsapp: 20,
  email: 254,
  location: 200,
  objetivo: 80,
  chaves: 80,
  planta: 80,
  message: 4000,
  utm_source: 200,
  utm_medium: 200,
  utm_campaign: 200,
  referrer: 500,
  landing_path: 500,
  user_agent: 500,
} as const;

/** Teto do corpo cru, antes de qualquer parse. */
const MAX_BODY_BYTES = 64 * 1024;

function cut(value: string | null | undefined, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function buildLeadInsertPayload(lead: Lead) {
  return {
    name: cut(lead.name, FIELD_LIMITS.name) || "Lead sem nome",
    whatsapp: lead.whatsapp
      ? String(lead.whatsapp).replace(/\D/g, "").slice(0, FIELD_LIMITS.whatsapp)
      : "",
    email: cut(lead.email, FIELD_LIMITS.email),
    location: cut(lead.location, FIELD_LIMITS.location),
    area_m2:
      typeof lead.area_m2 === "number" && Number.isFinite(lead.area_m2)
        ? Math.min(Math.max(Math.trunc(lead.area_m2), 0), 100000)
        : null,
    objetivo: cut(lead.objetivo, FIELD_LIMITS.objetivo),
    chaves: cut(lead.chaves, FIELD_LIMITS.chaves),
    planta: cut(lead.planta, FIELD_LIMITS.planta),
    message: cut(lead.message, FIELD_LIMITS.message),
    status: "novo",
    utm_source: cut(lead.utm_source, FIELD_LIMITS.utm_source),
    utm_medium: cut(lead.utm_medium, FIELD_LIMITS.utm_medium),
    utm_campaign: cut(lead.utm_campaign, FIELD_LIMITS.utm_campaign),
    referrer: cut(lead.referrer, FIELD_LIMITS.referrer),
    landing_path: cut(lead.landing_path, FIELD_LIMITS.landing_path),
    user_agent: cut(lead.user_agent, FIELD_LIMITS.user_agent),
  };
}

async function insertLead(lead: Lead): Promise<{ result: StepResult; lead: Lead }> {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    console.error("[notify-lead] backend service credentials are not available");
    return {
      result: { status: "error", error: "service_credentials_missing" },
      lead,
    };
  }

  try {
    const admin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await admin
      .from("leads")
      .insert(buildLeadInsertPayload(lead))
      .select("id")
      .single();

    if (error) throw error;

    const insertedId = typeof data?.id === "string" ? data.id : undefined;
    return {
      result: { status: "sent", ...(insertedId ? { id: insertedId } : {}) },
      lead: { ...lead, id: insertedId ?? lead.id ?? null },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[notify-lead] lead insert failed", err);
    return { result: { status: "error", error: message }, lead };
  }
}

const BWILD_ENGINE_WEBHOOK_URL =
  "https://pieenhgjulsrjlioozsy.supabase.co/functions/v1/lead-webhook";

function buildCrmPayload(lead: Lead) {
  const whatsappDigits = lead.whatsapp
    ? String(lead.whatsapp).replace(/\D/g, "")
    : "";
  const phone = whatsappDigits ? `+55${whatsappDigits}` : null;

  return {
    source: "site_form",
    name: lead.name && lead.name.trim() ? lead.name.trim() : "Lead sem nome",
    email: lead.email ?? null,
    phone,
    utm_source: lead.utm_source ?? null,
    utm_medium: lead.utm_medium ?? null,
    utm_campaign: lead.utm_campaign ?? null,
    form_name: "Diagnóstico Bewild",
    bairro: lead.location ?? null,
    extra: {
      objetivo: lead.objetivo ?? null,
      chaves: lead.chaves ?? null,
      planta: lead.planta ?? null,
      area_m2: lead.area_m2 ?? null,
      message: lead.message ?? null,
      location: lead.location ?? null,
      referrer: lead.referrer ?? null,
      landing_path: lead.landing_path ?? null,
      lead_id: lead.id ?? null,
    },
  };
}

async function createCrmCard(lead: Lead): Promise<CrmResult> {
  const key = Deno.env.get("BWILD_ENGINE_INTEGRATION_KEY");
  if (!key) {
    console.warn(
      "[notify-lead] BWILD_ENGINE_INTEGRATION_KEY is not set; skipping CRM",
    );
    return "skipped";
  }
  try {
    const res = await fetch(BWILD_ENGINE_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-integration-key": key,
      },
      body: JSON.stringify(buildCrmPayload(lead)),
    });
    if (!res.ok) {
      const body = (await res.text().catch(() => "")).slice(0, 200);
      console.error("[notify-lead] crm hook non-2xx", res.status, body);
      return "error";
    }
    return "sent";
  } catch (err) {
    console.error("[notify-lead] crm hook failed", err);
    return "error";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Corpo grande demais nem chega a ser parseado (LEAD-07).
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({ error: "payload_too_large" }), {
      status: 413,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let lead: Lead;
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      return new Response(JSON.stringify({ error: "payload_too_large" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("not_an_object");
    }
    lead = parsed as Lead;
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { result: lead_insert, lead: savedLead } = await insertLead(lead);

  // Run Slack and CRM in parallel; one failure must not block the other.
  const [slack, crm] = await Promise.all([
    notifySlack(savedLead),
    createCrmCard(savedLead),
  ]);

  return new Response(JSON.stringify({ ok: true, lead_insert, slack, crm }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
