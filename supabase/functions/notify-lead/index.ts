// Edge function: notify-lead
// Notifies the commercial team on Slack when a new diagnostic lead arrives.
// Future CRM (Bwild Engine) integration is stubbed via createCrmCard().

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

  // Main fields (omit empty)
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

  // Origin block
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

  // Action button
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

async function postToSlack(webhookUrl: string, payload: unknown) {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Slack webhook failed: HTTP ${res.status} ${body.slice(0, 200)}`);
  }
}

// TODO: Hook for the next step. Will create an MQL card in the
// "Bwild Engine" CRM. Will use its own secrets (e.g. BWILD_ENGINE_API_URL,
// BWILD_ENGINE_API_KEY). Keep isolated; do NOT implement now.
async function createCrmCard(_lead: Lead): Promise<void> {
  // Intentionally empty. Plug CRM integration here in a future step.
  return;
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

  const webhookUrl = Deno.env.get("SLACK_WEBHOOK_URL");
  if (!webhookUrl) {
    console.warn("[notify-lead] SLACK_WEBHOOK_URL is not set; skipping Slack notification");
    return new Response(
      JSON.stringify({ ok: true, slack: "skipped", reason: "missing_webhook_secret" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const payload = buildSlackMessage(lead);
    await postToSlack(webhookUrl, payload);
  } catch (err) {
    // Never leak the webhook URL or secrets in the response.
    console.error("[notify-lead] slack post failed", err);
    return new Response(JSON.stringify({ ok: false, slack: "error" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fire-and-forget CRM hook (stub for now).
  try {
    await createCrmCard(lead);
  } catch (err) {
    console.error("[notify-lead] crm hook failed", err);
  }

  return new Response(JSON.stringify({ ok: true, slack: "sent" }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
