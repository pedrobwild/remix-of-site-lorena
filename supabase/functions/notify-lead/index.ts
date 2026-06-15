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

function buildLeadInsertPayload(lead: Lead) {
  return {
    name: lead.name?.trim() || "Lead sem nome",
    whatsapp: lead.whatsapp ? String(lead.whatsapp).replace(/\D/g, "") : "",
    email: lead.email?.trim() || null,
    location: lead.location?.trim() || null,
    area_m2:
      typeof lead.area_m2 === "number" && Number.isFinite(lead.area_m2)
        ? Math.trunc(lead.area_m2)
        : null,
    objetivo: lead.objetivo ?? null,
    chaves: lead.chaves ?? null,
    planta: lead.planta ?? null,
    message: lead.message?.trim() || null,
    status: "novo",
    utm_source: lead.utm_source ?? null,
    utm_medium: lead.utm_medium ?? null,
    utm_campaign: lead.utm_campaign ?? null,
    referrer: lead.referrer ?? null,
    landing_path: lead.landing_path ?? null,
    user_agent: lead.user_agent ?? null,
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

async function createCrmCard(lead: Lead): Promise<Outcome> {
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
      const body = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${body.slice(0, 200)}`);
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

  let lead: Lead;
  try {
    lead = (await req.json()) as Lead;
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Run Slack and CRM in parallel; one failure must not block the other.
  const [slack, crm] = await Promise.all([
    notifySlack(lead),
    createCrmCard(lead),
  ]);

  return new Response(JSON.stringify({ ok: true, slack, crm }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
