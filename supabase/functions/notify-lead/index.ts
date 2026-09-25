// Edge function: notify-lead
// Grava o lead em `leads`, avisa o time comercial no Slack e por e-mail, cria
// um card de MQL no CRM (Bwild Engine) e, com aceite de cookies, manda o Lead
// para a API de Conversões do Meta. Os destinos são independentes: a falha
// de um não bloqueia os outros. O cliente decide "entregue" pelo corpo da
// resposta (ver src/lib/leadDelivery.ts), nunca pelo status HTTP.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";
import { sendTemplateEmail } from "../_shared/transactional-email-templates/send-email.ts";
import {
  ATTRIBUTION_COLUMNS,
  BWILD_ENGINE_WEBHOOK_URL,
  buildCrmPayload,
  buildLeadEmail,
  buildSlackMessage,
  type CleanLead,
  DEFAULT_LEAD_NAME,
  formLabel,
  LEAD_EMAIL_TEMPLATE,
  LEAD_EMAIL_TO,
  leadSchema,
  MAX_BODY_BYTES,
  type Outcome,
  RATE_GLOBAL_DAY,
  RATE_PER_IP,
  type RawLead,
  sanitizeLead,
  type StepResult,
} from "./lead.ts";
import {
  AD_LEAD_FORMS,
  buildCapiBody,
  buildLeadEvent,
  isValidPixelId,
  META_GRAPH_VERSION,
  sanitizeTestEventCode,
  summarizeCapiResponse,
} from "./metaCapi.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function notifySlack(lead: CleanLead, leadId: string | null): Promise<Outcome> {
  const webhookUrl = Deno.env.get("SLACK_WEBHOOK_URL");
  if (!webhookUrl) {
    console.warn("[notify-lead] SLACK_WEBHOOK_URL is not set; skipping Slack");
    return "skipped";
  }
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildSlackMessage(lead, leadId)),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${body.slice(0, 200)}`);
    }
    return "sent";
  } catch (err) {
    console.error("[notify-lead] slack post failed", err instanceof Error ? err.message : String(err));
    return "error";
  }
}

function isMissingColumnError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "PGRST204" || error.code === "42703" || /form_path/.test(error.message ?? "");
}

function omitKeys(row: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> {
  const out = { ...row };
  for (const k of keys) delete out[k];
  return out;
}

async function insertLead(admin: SupabaseClient, lead: CleanLead): Promise<StepResult> {
  const row: Record<string, unknown> = { ...lead, status: "novo" };
  try {
    let { data, error } = await admin.from("leads").insert(row).select("id").single();
    // Colunas novas chegam por migration separada (atribuição/CAPI; antes,
    // `form_path`). Se ainda não existirem no banco, grava sem elas em vez de
    // perder o lead: primeiro sem as de atribuição, depois também sem form_path.
    if (error && isMissingColumnError(error)) {
      const withoutAttribution = omitKeys(row, ATTRIBUTION_COLUMNS);
      ({ data, error } = await admin.from("leads").insert(withoutAttribution).select("id").single());
      if (error && isMissingColumnError(error)) {
        const legacy = omitKeys(withoutAttribution, ["form_path"]);
        ({ data, error } = await admin.from("leads").insert(legacy).select("id").single());
      }
    }
    if (error) {
      // Só o código vai para o log: a mensagem do Postgres pode repetir a
      // linha rejeitada (nome, telefone).
      console.error("[notify-lead] lead insert failed", error.code ?? "unknown");
      return { status: "error", error: "insert_failed" };
    }
    const insertedId = typeof data?.id === "string" ? data.id : undefined;
    return { status: "sent", ...(insertedId ? { id: insertedId } : {}) };
  } catch (err) {
    console.error("[notify-lead] lead insert threw", err instanceof Error ? err.name : "unknown");
    return { status: "error", error: "insert_failed" };
  }
}

async function createCrmCard(lead: CleanLead, leadId: string | null): Promise<Outcome> {
  const key = Deno.env.get("BWILD_ENGINE_INTEGRATION_KEY");
  if (!key) {
    console.warn("[notify-lead] BWILD_ENGINE_INTEGRATION_KEY is not set; skipping CRM");
    return "skipped";
  }
  try {
    const res = await fetch(BWILD_ENGINE_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-integration-key": key,
      },
      body: JSON.stringify(buildCrmPayload(lead, leadId)),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const body = (await res.text().catch(() => "")).slice(0, 200);
      console.error("[notify-lead] crm hook non-2xx", res.status, body);
      return "error";
    }
    return "sent";
  } catch (err) {
    console.error("[notify-lead] crm hook failed", err instanceof Error ? err.message : String(err));
    return "error";
  }
}

/**
 * Aviso por e-mail (marketing@bewild.com.br, fixo no modelo) pela fila de
 * e-mails transacionais da Lovable. Com teto de tempo: o cliente espera esta
 * resposta, e um envio lento não pode fazer um lead já gravado parecer perdido.
 */
async function sendLeadEmail(lead: CleanLead, leadId: string | null): Promise<Outcome> {
  if (!Deno.env.get("LOVABLE_API_KEY")) {
    console.warn("[notify-lead] LOVABLE_API_KEY is not set; skipping e-mail");
    return "skipped";
  }
  const { idempotencyKey, templateData } = buildLeadEmail(lead, leadId);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      sendTemplateEmail(LEAD_EMAIL_TEMPLATE, LEAD_EMAIL_TO, { idempotencyKey, templateData }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("timeout")), 10_000);
      }),
    ]);
    // Destinatário suprimido (bounce/descadastro) não é entrega.
    return result.sent ? "sent" : "skipped";
  } catch (err) {
    console.error("[notify-lead] email send failed", err instanceof Error ? err.message : String(err));
    return "error";
  } finally {
    clearTimeout(timer);
  }
}

/**
 * IP do cliente para o rate limit. O primeiro item de X-Forwarded-For pode
 * ser forjado pelo cliente; por isso os cabeçalhos definidos pela borda vêm
 * antes. O teto global diário cobre o que escapar daqui.
 */
function clientIp(req: Request): string {
  const edge = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip");
  if (edge) return edge.trim();
  const forwarded = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  return forwarded || "unknown";
}

/**
 * Rate limit durável (tabela `edge_rate_limits`, RPC `hit_rate_limit`).
 * Fail-open: se a RPC não existir ou falhar, o lead passa — perder um lead
 * real custa mais do que aceitar um spam.
 */
async function withinRateLimit(admin: SupabaseClient, key: string, windowS: number, max: number): Promise<boolean> {
  try {
    const { data, error } = await admin.rpc("hit_rate_limit", {
      p_key: key,
      p_window_s: windowS,
      p_max: max,
    });
    if (error) return true;
    return data !== false;
  } catch {
    return true;
  }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  // Corpo grande demais nem chega a ser parseado (LEAD-07).
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return json(413, { error: "payload_too_large" });
  }

  let raw: RawLead;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) return json(413, { error: "payload_too_large" });
    const parsed = leadSchema.safeParse(JSON.parse(text) as unknown);
    if (!parsed.success) return json(400, { error: "invalid_payload" });
    raw = parsed.data;
  } catch {
    return json(400, { error: "invalid_json" });
  }

  const lead = sanitizeLead(raw);
  if (!lead.whatsapp && !lead.email) {
    // Sem nenhum meio de contato não há lead — só ruído no CRM.
    return json(400, { error: "missing_contact" });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const admin = url && key
    ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;

  if (admin) {
    const day = new Date().toISOString().slice(0, 10);
    const [ipOk, dayOk] = await Promise.all([
      withinRateLimit(admin, `notify-lead:ip:${clientIp(req)}`, RATE_PER_IP.windowS, RATE_PER_IP.max),
      withinRateLimit(admin, `notify-lead:day:${day}`, RATE_GLOBAL_DAY.windowS, RATE_GLOBAL_DAY.max),
    ]);
    if (!ipOk || !dayOk) return json(429, { error: "rate_limited" });
  }

  let lead_insert: StepResult;
  if (admin) {
    lead_insert = await insertLead(admin, lead);
  } else {
    console.error("[notify-lead] backend service credentials are not available");
    lead_insert = { status: "error", error: "service_unavailable" };
  }
  const leadId = lead_insert.id ?? null;

  // Slack, CRM e e-mail em paralelo; a falha de um não bloqueia os outros.
  const [slack, crm, email] = await Promise.all([
    notifySlack(lead, leadId),
    createCrmCard(lead, leadId),
    sendLeadEmail(lead, leadId),
  ]);

  return json(200, { ok: true, lead_insert, slack, crm, email });
});
