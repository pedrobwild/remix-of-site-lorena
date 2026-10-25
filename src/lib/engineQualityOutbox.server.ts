/**
 * Envio ao Bwild Engine das marcações manuais do painel do site
 * (fila `engine_quality_outbox`, preenchida por gatilho em `leads`).
 *
 * - Chamado logo depois de cada marcação (só aquele lead) e no começo de cada
 *   sincronização com o CRM (todas as pendências vencidas).
 * - Corpo fixo por evento: mesmo UUID e horário em todas as tentativas.
 * - O Engine aplica a marcação no cliente e nos negócios, e não envia nada ao
 *   Google Ads (esse envio é só pela planilha do site).
 * - Sem dados pessoais no corpo: só ids, decisão e horário.
 */
import type { ServiceDb } from "../../supabase/functions/_shared/lead-quality.ts";

export const ENGINE_QUALITY_URL = "https://pieenhgjulsrjlioozsy.supabase.co/functions/v1/site-lead-quality";
export const OUTBOX_MAX_ATTEMPTS = 12;

type Env = (name: string) => string | null | undefined;

export type OutboxEvent = { id: string; lead_id: string; decision: "qualificado" | "descartado"; marked_at: string; attempts: number };

export type OutboxResult =
  | { kind: "done"; status: "sent" | "skipped"; outcome: string }
  | { kind: "retry"; error: string }
  | { kind: "fail"; error: string }
  | { kind: "stop"; error: string };

/** Pura: o que fazer com a resposta do Engine. */
export function classifyEngineResponse(httpStatus: number, body: unknown): OutboxResult {
  const b = (body ?? {}) as { status?: string; outcome?: string; error?: string };
  if (httpStatus === 401 || httpStatus === 403) return { kind: "stop", error: `engine_http_${httpStatus}` };
  if (httpStatus === 200 && (b.status === "sent" || b.status === "skipped")) {
    return { kind: "done", status: b.status, outcome: String(b.outcome ?? b.status) };
  }
  if (httpStatus === 400 || httpStatus === 409) return { kind: "fail", error: String(b.outcome ?? b.error ?? `engine_http_${httpStatus}`) };
  return { kind: "retry", error: String(b.outcome ?? b.error ?? `engine_http_${httpStatus}`) };
}

/** Pura: próxima tentativa — 2, 4, 8… minutos, no máximo 6 horas. */
export function nextAttemptAt(attempts: number, now: Date): string {
  const minutes = Math.min(2 ** Math.max(1, attempts), 360);
  return new Date(now.getTime() + minutes * 60_000).toISOString();
}

export function engineQualityBody(e: OutboxEvent): Record<string, string> {
  return { event_id: e.id, lead_id: e.lead_id, decision: e.decision, marked_at: new Date(e.marked_at).toISOString() };
}

export type DrainSummary = { lidos: number; enviados: number; ignorados: number; reenvio: number; falhas: number; error?: string };

export async function drainEngineQualityOutbox(
  admin: ServiceDb,
  env: Env,
  opts: { leadId?: string; fetchImpl?: typeof fetch; now?: Date; limit?: number } = {},
): Promise<DrainSummary> {
  const now = opts.now ?? new Date();
  const fetchImpl = opts.fetchImpl ?? fetch;
  const summary: DrainSummary = { lidos: 0, enviados: 0, ignorados: 0, reenvio: 0, falhas: 0 };
  let q = admin
    .from("engine_quality_outbox")
    .select("id, lead_id, decision, marked_at, attempts")
    .eq("status", "pending")
    .lte("next_attempt_at", now.toISOString())
    .order("marked_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(opts.limit ?? 200);
  if (opts.leadId) q = q.eq("lead_id", opts.leadId);
  const { data, error } = await q;
  if (error) return { ...summary, error: "outbox_query_failed" };
  const events = (data ?? []) as OutboxEvent[];
  summary.lidos = events.length;
  if (!events.length) return summary;

  const { resolveEngineKey } = await import("@/lib/externalApi.server");
  const key = await resolveEngineKey(env("BWILD_ENGINE_INTEGRATION_KEY"), env("EXTERNAL_API_ENCRYPTION_KEY"));
  if (!key) return { ...summary, error: "engine_key_missing" };

  for (const e of events) {
    let result: OutboxResult;
    try {
      const res = await fetchImpl(ENGINE_QUALITY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-integration-key": key },
        body: JSON.stringify(engineQualityBody(e)),
        signal: AbortSignal.timeout(30_000),
      });
      let body: unknown = null;
      try { body = await res.json(); } catch { /* corpo vazio */ }
      result = classifyEngineResponse(res.status, body);
    } catch {
      result = { kind: "retry", error: "engine_unreachable" };
    }
    const attempts = e.attempts + 1;
    let patch: Record<string, unknown>;
    if (result.kind === "done") {
      patch = { status: result.status, outcome: result.outcome, attempts, sent_at: now.toISOString(), last_error: null };
      if (result.status === "sent") summary.enviados++; else summary.ignorados++;
    } else if (result.kind === "fail" || (result.kind === "retry" && attempts >= OUTBOX_MAX_ATTEMPTS)) {
      patch = { status: "failed", attempts, last_error: result.error };
      summary.falhas++;
    } else if (result.kind === "retry") {
      patch = { attempts, last_error: result.error, next_attempt_at: nextAttemptAt(attempts, now) };
      summary.reenvio++;
    } else {
      // Chave recusada: nada adianta tentar os outros agora. O evento fica pendente.
      await admin.from("engine_quality_outbox").update({ last_error: result.error }).eq("id", e.id);
      return { ...summary, error: result.error };
    }
    await admin.from("engine_quality_outbox").update(patch).eq("id", e.id).eq("status", "pending");
  }
  return summary;
}
