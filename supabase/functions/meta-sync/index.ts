// Edge function: meta-sync
// Traz da Meta, a cada 30 minutos (cron) ou pelo botão "Sincronizar agora":
//  1. métricas diárias por campanha da conta de anúncios → `meta_ads_daily`;
//  2. leads dos formulários instantâneos (Lead Ads) → `meta_leads`, avisando
//     o time de cada lead NOVO pelos mesmos canais dos leads do site (Slack,
//     e-mail e card no CRM).
// A primeira carga importa o histórico que a Meta ainda guarda (90 dias) sem
// avisar ninguém. O estado de cada parte fica em `meta_sync_state` e cada
// rodada deixa uma linha em `integration_log` (sem dados pessoais).
//
// Acesso: cron interno (x-cron-key === INDEX_TRACKER_CRON_KEY) ou admin
// logado (JWT + public.is_admin()). Segredos: ver resolveMetaSyncConfig
// (_shared/meta-leads.ts) e docs/META-SYNC.md. O token nunca é logado.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";
import { sendTemplateEmail } from "../_shared/transactional-email-templates/send-email.ts";
import { logIntegration } from "../_shared/integration-log.ts";
import { createGraphClient, type GraphClient, GraphApiError } from "../_shared/meta-graph.ts";
import {
  adsDailyRowFromApi,
  adsWindow,
  buildMetaLeadCrmPayload,
  buildMetaLeadEmail,
  buildMetaLeadSlackMessage,
  CRM_WEBHOOK_URL,
  FORM_FIELDS,
  formInfoFromApi,
  INSIGHTS_FIELDS,
  type InsightsApiRow,
  LEAD_FIELDS,
  LEAD_FIELDS_MINIMAL,
  leadRowFromApi,
  leadsWindow,
  type MetaFormApi,
  type MetaFormInfo,
  type MetaLeadApi,
  type MetaLeadRow,
  type MetaSyncConfig,
  notifyDecision,
  NOTIFY_MAX_AGE_H,
  NOTIFY_MAX_PER_RUN,
  resolveMetaSyncConfig,
} from "../_shared/meta-leads.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Cron (x-cron-key) ou admin logado. Devolve a resposta de erro ou null. */
async function authorize(req: Request): Promise<Response | null> {
  const cronKey = Deno.env.get("INDEX_TRACKER_CRON_KEY");
  const given = req.headers.get("x-cron-key");
  if (cronKey && given && given === cronKey) return null;

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

type SyncKey = "ads" | "leads";
type StateRow = { key: SyncKey; cursor: Record<string, unknown> | null };

async function readCursor(admin: SupabaseClient, key: SyncKey): Promise<Record<string, unknown>> {
  const { data } = await admin.from("meta_sync_state").select("key, cursor").eq("key", key).maybeSingle<StateRow>();
  return (data?.cursor ?? {}) as Record<string, unknown>;
}

async function writeState(admin: SupabaseClient, key: SyncKey, patch: Record<string, unknown>): Promise<void> {
  const { error } = await admin.from("meta_sync_state").upsert({ key, ...patch }, { onConflict: "key" });
  if (error) console.warn("[meta-sync] state upsert failed", key, error.code ?? "unknown");
}

function errorSummary(err: unknown): { reason: string; message: string; code: number | null } {
  if (err instanceof GraphApiError) return { reason: err.reason, message: err.summary(), code: err.code };
  return { reason: "internal", message: err instanceof Error ? err.name : "erro", code: null };
}

// ---------------------------------------------------------------------------
// 1. Métricas diárias
// ---------------------------------------------------------------------------

type AdsResult =
  | { status: "ok"; rows: number; since: string; until: string; backfill: boolean }
  | { status: "skipped"; reason: string }
  | { status: "error"; reason: string; error: string };

async function syncAds(admin: SupabaseClient, cfg: MetaSyncConfig, now: Date): Promise<AdsResult> {
  const runAt = now.toISOString();
  if (!cfg.adsToken) {
    await writeState(admin, "ads", { last_run_at: runAt, last_error: "no_token" });
    return { status: "skipped", reason: "no_token" };
  }
  const cursor = await readCursor(admin, "ads");
  const win = adsWindow(now, cursor.backfilled === true);
  const graph = createGraphClient({ token: cfg.adsToken, appSecret: cfg.appSecret });
  try {
    const { data, truncated } = await graph.getAll<InsightsApiRow>(
      `act_${cfg.accountId}/insights`,
      {
        level: "campaign",
        time_increment: 1,
        time_range: JSON.stringify({ since: win.since, until: win.until }),
        fields: INSIGHTS_FIELDS,
        limit: 500,
      },
      { maxPages: 20 },
    );
    const rows = data
      .map((r) => adsDailyRowFromApi(r, cfg.accountId, runAt))
      .filter((r): r is NonNullable<typeof r> => r !== null);
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await admin
        .from("meta_ads_daily")
        .upsert(rows.slice(i, i + 500), { onConflict: "account_id,date,campaign_id" });
      if (error) throw new Error(`upsert_failed:${error.code ?? "unknown"}`);
    }
    // Campanha/dia que sumiu do relatório (a Meta revisou para zero) sai da tabela.
    if (!truncated) {
      await admin
        .from("meta_ads_daily")
        .delete()
        .eq("account_id", cfg.accountId)
        .gte("date", win.since)
        .lte("date", win.until)
        .lt("synced_at", runAt);
    }
    await writeState(admin, "ads", {
      last_run_at: runAt,
      last_success_at: runAt,
      last_error: null,
      cursor: { backfilled: true, since: win.since, until: win.until },
      stats: { rows: rows.length, truncated, account_id: cfg.accountId },
    });
    await logIntegration(admin, {
      integration: "meta_sync",
      event_name: "ads",
      lead_id: null,
      status: "sent",
      detail: { rows: rows.length, since: win.since, until: win.until, backfill: win.backfill, truncated },
    });
    return { status: "ok", rows: rows.length, since: win.since, until: win.until, backfill: win.backfill };
  } catch (err) {
    const e = errorSummary(err);
    console.error("[meta-sync] ads failed", e.message);
    await writeState(admin, "ads", { last_run_at: runAt, last_error: e.message });
    await logIntegration(admin, {
      integration: "meta_sync",
      event_name: "ads",
      lead_id: null,
      status: "error",
      http_status: err instanceof GraphApiError ? err.httpStatus : null,
      detail: { reason: e.reason, ...(e.code != null ? { error_code: e.code } : {}) },
    });
    return { status: "error", reason: e.reason, error: e.message };
  }
}

// ---------------------------------------------------------------------------
// 2. Leads dos formulários
// ---------------------------------------------------------------------------

type PageRef = { id: string; token: string };

/** Páginas a ler e o token de cada uma (token de Página quando a Meta devolve). */
async function listPages(graph: GraphClient, cfg: MetaSyncConfig, fallbackToken: string): Promise<PageRef[]> {
  if (cfg.pageIds.length) {
    const out: PageRef[] = [];
    for (const id of cfg.pageIds) {
      try {
        const page = await graph.get<{ id?: string; access_token?: string }>(id, { fields: "id,access_token" });
        out.push({ id, token: typeof page.access_token === "string" && page.access_token ? page.access_token : fallbackToken });
      } catch {
        // Sem o token de Página, tenta com o próprio token configurado.
        out.push({ id, token: fallbackToken });
      }
    }
    return out;
  }
  try {
    const { data } = await graph.getAll<{ id?: string; access_token?: string }>(
      "me/accounts",
      { fields: "id,access_token", limit: 100 },
      { maxPages: 5 },
    );
    return data
      .filter((p) => typeof p.id === "string" && /^\d+$/.test(p.id))
      .map((p) => ({ id: p.id as string, token: p.access_token || fallbackToken }));
  } catch (err) {
    // Token de Página (em vez de usuário do sistema): `/me` já é a Página.
    if (err instanceof GraphApiError && err.code === 100) {
      const me = await graph.get<{ id?: string }>("me", { fields: "id" });
      if (typeof me.id === "string" && /^\d+$/.test(me.id)) return [{ id: me.id, token: fallbackToken }];
    }
    throw err;
  }
}

async function fetchFormLeads(pageGraph: GraphClient, form: MetaFormInfo, since: number) {
  const params = {
    filtering: JSON.stringify([{ field: "time_created", operator: "GREATER_THAN", value: since }]),
    limit: 100,
  };
  try {
    return await pageGraph.getAll<MetaLeadApi>(`${form.id}/leads`, { ...params, fields: LEAD_FIELDS }, { maxPages: 30 });
  } catch (err) {
    // Sem acesso à conta de anúncios, os nomes de campanha/anúncio derrubam a
    // leitura inteira: tenta de novo só com os campos do lead.
    if (err instanceof GraphApiError && (err.reason === "permission" || err.code === 100)) {
      return await pageGraph.getAll<MetaLeadApi>(`${form.id}/leads`, { ...params, fields: LEAD_FIELDS_MINIMAL }, { maxPages: 30 });
    }
    throw err;
  }
}

type Outcome = "sent" | "skipped" | "error";

async function notifySlack(row: MetaLeadRow, id: string): Promise<Outcome> {
  const url = Deno.env.get("SLACK_WEBHOOK_URL");
  if (!url) return "skipped";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildMetaLeadSlackMessage(row, id)),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error("[meta-sync] slack non-2xx", res.status);
      return "error";
    }
    return "sent";
  } catch (err) {
    console.error("[meta-sync] slack failed", err instanceof Error ? err.name : "unknown");
    return "error";
  }
}

async function notifyEmail(row: MetaLeadRow): Promise<Outcome> {
  if (!Deno.env.get("LOVABLE_API_KEY")) return "skipped";
  const { idempotencyKey, templateData } = buildMetaLeadEmail(row);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      sendTemplateEmail("novo-lead-site", "marketing@bewild.com.br", { idempotencyKey, templateData }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("timeout")), 10_000);
      }),
    ]);
    return result.sent ? "sent" : "skipped";
  } catch (err) {
    console.error("[meta-sync] email failed", err instanceof Error ? err.message : "unknown");
    return "error";
  } finally {
    clearTimeout(timer);
  }
}

async function notifyCrm(row: MetaLeadRow, id: string): Promise<Outcome> {
  // Lead da Ferramenta de Teste da Meta não vira card no CRM.
  if (row.is_test) return "skipped";
  const key = Deno.env.get("BWILD_ENGINE_INTEGRATION_KEY");
  if (!key) return "skipped";
  try {
    const res = await fetch(CRM_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-integration-key": key },
      body: JSON.stringify(buildMetaLeadCrmPayload(row, id)),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error("[meta-sync] crm non-2xx", res.status);
      return "error";
    }
    return "sent";
  } catch (err) {
    console.error("[meta-sync] crm failed", err instanceof Error ? err.name : "unknown");
    return "error";
  }
}

const PENDING_COLUMNS =
  "id, meta_lead_id, created_time, page_id, form_id, form_name, ad_id, ad_name, adset_id, adset_name, campaign_id, campaign_name, platform, is_organic, is_test, name, email, phone, city, answers";

/**
 * Avisa os leads pendentes (`notify` nulo, até 72h de idade) — os que esta
 * rodada acabou de gravar e os que uma rodada anterior não conseguiu avisar.
 * Cada linha é "reservada" antes do envio (`notify` nulo → "enviando", numa
 * única UPDATE condicional): duas rodadas ao mesmo tempo nunca avisam o
 * mesmo lead duas vezes.
 */
async function notifyPending(admin: SupabaseClient, now: Date, deadline: number): Promise<number> {
  const since = new Date(now.getTime() - NOTIFY_MAX_AGE_H * 3_600_000).toISOString();
  const { data, error } = await admin
    .from("meta_leads")
    .select(PENDING_COLUMNS)
    .is("notify", null)
    .is("deleted_at", null)
    .gte("created_time", since)
    .order("created_time", { ascending: true })
    .limit(NOTIFY_MAX_PER_RUN);
  if (error) {
    console.error("[meta-sync] pending select failed", error.code ?? "unknown");
    return 0;
  }
  let notified = 0;
  for (const pending of (data ?? []) as (MetaLeadRow & { id: string })[]) {
    // Reserva o fôlego final da função para gravar o estado.
    if (Date.now() > deadline + 25_000) break;
    const { data: claimed } = await admin
      .from("meta_leads")
      .update({ notify: { state: "sending" } })
      .eq("id", pending.id)
      .is("notify", null)
      .select("id");
    if (!claimed || claimed.length === 0) continue;
    const row: MetaLeadRow = { ...pending, answers: Array.isArray(pending.answers) ? pending.answers : [] };
    const [slack, email, crm] = await Promise.all([
      notifySlack(row, pending.id),
      notifyEmail(row),
      notifyCrm(row, pending.id),
    ]);
    notified += 1;
    await admin
      .from("meta_leads")
      .update({ notify: { slack, email, crm }, notified_at: new Date().toISOString() })
      .eq("id", pending.id);
  }
  return notified;
}

type LeadsResult =
  | {
      status: "ok" | "partial";
      pages: number;
      forms: number;
      fetched: number;
      inserted: number;
      notified: number;
      backfill: boolean;
      errors?: string[];
    }
  | { status: "skipped"; reason: string }
  | { status: "error"; reason: string; error: string };

async function syncLeads(admin: SupabaseClient, cfg: MetaSyncConfig, now: Date, deadline: number): Promise<LeadsResult> {
  const runAt = now.toISOString();
  if (!cfg.leadsToken) {
    await writeState(admin, "leads", { last_run_at: runAt, last_error: "no_token" });
    return { status: "skipped", reason: "no_token" };
  }
  const cursor = await readCursor(admin, "leads");
  const win = leadsWindow(now.getTime(), cursor.since);
  const graph = createGraphClient({ token: cfg.leadsToken, appSecret: cfg.appSecret });
  const failures: string[] = [];
  let formsCount = 0;
  let pagesCount = 0;
  const rows: MetaLeadRow[] = [];

  try {
    const pages = await listPages(graph, cfg, cfg.leadsToken);
    pagesCount = pages.length;
    for (const page of pages) {
      if (Date.now() > deadline) {
        failures.push("deadline");
        break;
      }
      const pageGraph =
        page.token === cfg.leadsToken ? graph : createGraphClient({ token: page.token, appSecret: cfg.appSecret });
      let forms: MetaFormInfo[];
      try {
        const res = await pageGraph.getAll<MetaFormApi>(`${page.id}/leadgen_forms`, { fields: FORM_FIELDS, limit: 100 }, {
          maxPages: 10,
        });
        forms = res.data.map((f) => formInfoFromApi(f, page.id)).filter((f): f is MetaFormInfo => f !== null);
        if (res.truncated) failures.push(`forms_truncated:${page.id}`);
      } catch (err) {
        failures.push(`page:${errorSummary(err).reason}`);
        continue;
      }
      for (const form of forms) {
        if (Date.now() > deadline) {
          failures.push("deadline");
          break;
        }
        formsCount += 1;
        try {
          const res = await fetchFormLeads(pageGraph, form, win.since);
          if (res.truncated) failures.push(`leads_truncated:${form.id}`);
          for (const lead of res.data) {
            const row = leadRowFromApi(lead, form);
            if (row) rows.push(row);
          }
        } catch (err) {
          failures.push(`form:${errorSummary(err).reason}`);
        }
      }
    }
  } catch (err) {
    const e = errorSummary(err);
    console.error("[meta-sync] leads failed", e.message);
    await writeState(admin, "leads", { last_run_at: runAt, last_error: e.message });
    await logIntegration(admin, {
      integration: "meta_sync",
      event_name: "leads",
      lead_id: null,
      status: "error",
      http_status: err instanceof GraphApiError ? err.httpStatus : null,
      detail: { reason: e.reason, ...(e.code != null ? { error_code: e.code } : {}) },
    });
    return { status: "error", reason: e.reason, error: e.message };
  }

  // Grava. O índice único em meta_lead_id descarta o que já existe e devolve
  // só as linhas NOVAS. Lead da primeira carga ou antigo entra já marcado
  // como "sem aviso"; o resto entra com `notify` nulo = aviso pendente.
  const unique = [...new Map(rows.map((r) => [r.meta_lead_id, r])).values()];
  let inserted = 0;
  for (let i = 0; i < unique.length; i += 200) {
    const batch = unique.slice(i, i + 200).map((r) => {
      const decision = notifyDecision(r.created_time, now.getTime(), win.backfill);
      return { ...r, notify: decision === "notify" ? null : { skipped: decision } };
    });
    const { data, error } = await admin
      .from("meta_leads")
      .upsert(batch, { onConflict: "meta_lead_id", ignoreDuplicates: true })
      .select("id");
    if (error) {
      console.error("[meta-sync] meta_leads insert failed", error.code ?? "unknown");
      failures.push(`insert:${error.code ?? "unknown"}`);
      continue;
    }
    inserted += (data ?? []).length;
  }

  const notified = await notifyPending(admin, now, deadline);

  const complete = failures.length === 0;
  await writeState(admin, "leads", {
    last_run_at: runAt,
    // O cursor só avança quando TODOS os formulários foram lidos: numa falha
    // parcial, a próxima rodada relê a mesma janela (duplicados são ignorados).
    ...(complete
      ? { last_success_at: runAt, last_error: null, cursor: { since: Math.floor(now.getTime() / 1000) } }
      : { last_error: `parcial: ${[...new Set(failures)].slice(0, 5).join(", ")}` }),
    stats: { pages: pagesCount, forms: formsCount, fetched: unique.length, inserted, notified, backfill: win.backfill },
  });
  await logIntegration(admin, {
    integration: "meta_sync",
    event_name: "leads",
    lead_id: null,
    status: complete ? "sent" : "error",
    detail: {
      pages: pagesCount,
      forms: formsCount,
      fetched: unique.length,
      inserted,
      notified,
      backfill: win.backfill,
      ...(complete ? {} : { failures: [...new Set(failures)].slice(0, 10) }),
    },
  });
  return {
    status: complete ? "ok" : "partial",
    pages: pagesCount,
    forms: formsCount,
    fetched: unique.length,
    inserted,
    notified,
    backfill: win.backfill,
    ...(complete ? {} : { errors: [...new Set(failures)].slice(0, 10) }),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const denied = await authorize(req);
  if (denied) return denied;

  let only: "ads" | "leads" | null = null;
  try {
    const body = (await req.json()) as { only?: unknown } | null;
    if (body?.only === "ads" || body?.only === "leads") only = body.only;
  } catch {
    /* sem corpo: sincroniza tudo */
  }

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return json(503, { error: "service_unavailable" });
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const now = new Date();
  const resolved = resolveMetaSyncConfig((name) => Deno.env.get(name));
  if (!resolved.config) {
    const runAt = now.toISOString();
    await Promise.all(
      (["ads", "leads"] as const).map((k) => writeState(admin, k, { last_run_at: runAt, last_error: "no_token" })),
    );
    return json(200, { ok: true, ads: { status: "skipped", reason: "no_token" }, leads: { status: "skipped", reason: "no_token" } });
  }
  const cfg = resolved.config;
  // O relógio da função é curto: para de buscar formulários aos 90 s e de
  // avisar leads aos 115 s (o resto fica pendente para a próxima rodada).
  const deadline = Date.now() + 90_000;

  const [ads, leads] = await Promise.all([
    only === "leads" ? Promise.resolve(null) : syncAds(admin, cfg, now),
    only === "ads" ? Promise.resolve(null) : syncLeads(admin, cfg, now, deadline),
  ]);
  return json(200, { ok: true, ...(ads ? { ads } : {}), ...(leads ? { leads } : {}) });
});
