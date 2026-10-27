/**
 * Sincronização do status dos leads do site com o funil do Bwild Engine.
 * Chamada por /api/public/crm-stage-sync (agendamento ou admin no painel).
 *
 * - Antes, envia ao Engine as marcações manuais do painel na fila (`engine_quality_outbox`).
 * - Lê `site-lead-stages` do Engine (header x-integration-key).
 * - Aplica `planCrmLeadUpdate` (regra pura em src/lib/crmStage.ts).
 * - Grava colunas `crm_*`/`status` e o histórico em `lead_qualification_log`.
 * - Dispara QualifiedLead/DisqualifiedLead na Meta só para mudanças dos
 *   últimos 7 dias (`shouldSendMetaQuality`), reaproveitando `sendSiteLeadQuality`.
 * - Idempotente: sem mudança, nada é gravado (nem `crm_synced_at`).
 * - Uma linha por execução em `integration_log` (só contagens, sem PII).
 */
import {
  CRM_ENGINE_AUTHOR,
  planCrmLeadUpdate,
  shouldSendMetaQuality,
  type CrmLeadItem,
  type CrmLeadRow,
  type CrmStage,
  type ExistingLog,
} from "@/lib/crmStage";
import { sendSiteLeadQuality, type ServiceDb } from "../../supabase/functions/_shared/lead-quality.ts";

export const ENGINE_STAGES_URL = "https://pieenhgjulsrjlioozsy.supabase.co/functions/v1/site-lead-stages";
const PAGE = 1000;

export type CrmSyncSummary = {
  ok: boolean;
  mode: "full" | "incremental";
  updated_since: string | null;
  lidos: number;
  alterados: number;
  linhas_atualizadas: number;
  logs_novos: number;
  sem_negocio: number;
  meta_enviados: number;
  erros: number;
  /** Marcações do painel levadas ao Engine nesta rodada. */
  engine_fila?: { enviados: number; pendentes: number; falhas: number };
  error?: string;
};

type Env = (name: string) => string | null | undefined;

async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) return out;
  }
}

export async function fetchEngineStages(
  key: string,
  body: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
): Promise<{ leads: CrmLeadItem[]; stages: CrmStage[] }> {
  const res = await fetchImpl(ENGINE_STAGES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-integration-key": key },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`engine_http_${res.status}`);
  const json = (await res.json()) as { leads?: CrmLeadItem[]; stages?: CrmStage[] };
  if (!Array.isArray(json.leads) || !Array.isArray(json.stages)) throw new Error("engine_invalid_response");
  return { leads: json.leads, stages: json.stages };
}

/** Janela da Meta para o evento de qualidade (mesma de `shouldSendMetaQuality`). */
export const MANUAL_META_WINDOW_MS = 7 * 24 * 3_600_000;

/**
 * Qualificado marcado no painel nos últimos 7 dias que ainda não chegou à Meta
 * (lead sem negócio no Engine, ou envio do painel que falhou). Idempotente:
 * `sendSiteLeadQuality` grava `meta_qualified_sent_at` e não repete.
 * Devolve quantos eventos saíram.
 */
export async function sendPendingManualQualified(admin: ServiceDb, env: Env, now: Date): Promise<number> {
  const since = new Date(now.getTime() - MANUAL_META_WINDOW_MS).toISOString();
  let data: unknown;
  try {
    const res = await admin
      .from("leads")
      .select("id")
      .eq("status", "qualificado")
      .eq("manual_qualification", "qualificado")
      .is("meta_qualified_sent_at", null)
      .gte("manual_qualification_at", since)
      .limit(200);
    if (res.error) return 0;
    data = res.data;
  } catch {
    return 0;
  }
  if (!Array.isArray(data)) return 0;
  let sent = 0;
  for (const row of data as { id: string }[]) {
    try {
      const r = await sendSiteLeadQuality(admin, env, row.id, "qualificado", { eventSource: "Painel Bewild" });
      if (r.ok && r.meta === "sent") sent++;
    } catch {
      /* um lead nunca derruba a sincronização */
    }
  }
  return sent;
}

export async function runCrmStageSync(
  admin: ServiceDb,
  env: Env,
  opts: { full?: boolean; fetchImpl?: typeof fetch; now?: Date } = {},
): Promise<CrmSyncSummary> {
  const now = opts.now ?? new Date();
  const nowIso = now.toISOString();
  const summary: CrmSyncSummary = {
    ok: false,
    mode: opts.full ? "full" : "incremental",
    updated_since: null,
    lidos: 0,
    alterados: 0,
    linhas_atualizadas: 0,
    logs_novos: 0,
    sem_negocio: 0,
    meta_enviados: 0,
    erros: 0,
  };

  try {
    const { resolveEngineKey } = await import("@/lib/externalApi.server");
    const key = await resolveEngineKey(env("BWILD_ENGINE_INTEGRATION_KEY"), env("EXTERNAL_API_ENCRYPTION_KEY"));
    if (!key) throw new Error("engine_key_missing");

    if (!opts.full) {
      const { data } = await admin
        .from("leads")
        .select("crm_synced_at")
        .not("crm_synced_at", "is", null)
        .order("crm_synced_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const last = (data as { crm_synced_at?: string } | null)?.crm_synced_at;
      if (last) summary.updated_since = new Date(Date.parse(last) - 3_600_000).toISOString();
      else summary.mode = "full";
    }

    // Primeiro leva ao Engine as marcações do painel que ainda estão na fila,
    // para a leitura abaixo já voltar com elas.
    try {
      const { drainEngineQualityOutbox } = await import("@/lib/engineQualityOutbox.server");
      const drained = await drainEngineQualityOutbox(admin, env, { fetchImpl: opts.fetchImpl, now });
      summary.engine_fila = { enviados: drained.enviados, pendentes: drained.reenvio, falhas: drained.falhas };
    } catch {
      /* a fila nunca derruba a sincronização */
    }

    const engine = await fetchEngineStages(
      key,
      summary.updated_since ? { updated_since: summary.updated_since } : {},
      opts.fetchImpl,
    );
    summary.lidos = engine.leads.length;
    const byId = new Map(engine.leads.map((l) => [l.lead_id, l]));

    const rows = await fetchAll<CrmLeadRow>((from, to) =>
      admin
        .from("leads")
        .select("id, status, manual_qualification, manual_qualification_source, manual_qualification_at, manual_qualification_reason, crm_stage_key, crm_stage_name, crm_max_stage_key, crm_won, crm_lost, crm_deal_count, crm_last_change_at")
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to),
    );
    const targets = summary.mode === "full" ? rows : rows.filter((r) => byId.has(r.id));

    const logs = await fetchAll<ExistingLog & { lead_id: string }>((from, to) =>
      admin
        .from("lead_qualification_log")
        .select("lead_id, note, created_at")
        .eq("changed_by_email", CRM_ENGINE_AUTHOR)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to),
    );
    const logsByLead = new Map<string, ExistingLog[]>();
    for (const l of logs) {
      const arr = logsByLead.get(l.lead_id) ?? [];
      arr.push(l);
      logsByLead.set(l.lead_id, arr);
    }

    for (const row of targets) {
      const item = byId.get(row.id) ?? null;
      try {
        const plan = planCrmLeadUpdate(row, item, engine.stages, logsByLead.get(row.id) ?? [], nowIso);
        if (plan.noDeal) summary.sem_negocio++;
        if (Object.keys(plan.patch).length) {
          const { error } = await admin.from("leads").update(plan.patch).eq("id", row.id);
          if (error) throw new Error(error.code ?? "update_failed");
          summary.linhas_atualizadas++;
        }
        if (plan.logs.length) {
          const { error } = await admin.from("lead_qualification_log").insert(plan.logs);
          if (error) throw new Error(error.code ?? "log_failed");
          summary.logs_novos += plan.logs.length;
        }
        if (plan.statusChanged) summary.alterados++;
        if (shouldSendMetaQuality(plan, item?.last_change_at ?? null, now.getTime())) {
          const r = await sendSiteLeadQuality(admin, env, row.id, plan.to, { eventSource: "Bwild Engine" });
          if (r.ok && r.meta === "sent") summary.meta_enviados++;
        }
      } catch (err) {
        summary.erros++;
        console.warn("[crm-stage-sync] lead falhou", err instanceof Error ? err.message : "erro");
      }
    }
    summary.meta_enviados += await sendPendingManualQualified(admin, env, now);
    summary.ok = true;
  } catch (err) {
    summary.error = err instanceof Error ? err.message : "erro";
    summary.erros++;
  }

  // Lista "Exclusao desqualificados" do Google Ads: segue a qualificação atual.
  if (summary.ok) {
    try {
      const { syncDisqualifiedList } = await import("@/lib/googleAdsDisqualifiedList.server");
      await syncDisqualifiedList(admin, env, opts.fetchImpl);
    } catch {
      /* a lista nunca derruba a sincronização */
    }
  }

  try {
    await admin.from("integration_log").insert({
      integration: "crm_stage_sync",
      event_name: summary.mode,
      lead_id: null,
      status: summary.ok ? "sent" : "error",
      http_status: null,
      detail: { ...summary },
    });
  } catch {
    /* o registro nunca derruba a sincronização */
  }
  return summary;
}
