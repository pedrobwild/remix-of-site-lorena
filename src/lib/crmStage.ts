/**
 * Status do lead do site derivado do funil do CRM (Bwild Engine).
 *
 * Regra (decidida por Pedro, 13/10/2026) — os cortes são as POSIÇÕES das etapas
 * `lead` e `qualificacao` vindas de `stages`, nunca números fixos:
 *  - ganho                                   → qualificado (selo "ganho")
 *  - etapa máxima ≥ `lead`                   → qualificado (+ selo "perdido" se tudo perdido)
 *  - tudo perdido/aquecer sem passar de Qualificação → descartado
 *  - etapa máxima ≥ `qualificacao`           → contatado ("Em andamento")
 *  - MQL ou sem negócio no CRM               → novo
 *
 * Também planeja o histórico (`lead_qualification_log`) de forma idempotente:
 * cada transição do funil vira UMA linha (chave = texto + instante).
 * Módulo puro: usado pela sincronização no servidor e testado no Vitest.
 */
import type { LeadStatus } from "@/lib/adminLeads";

export const CRM_ENGINE_AUTHOR = "Bwild Engine (automático)";

export type CrmStage = {
  stage_key: string;
  stage_name: string;
  stage_position: number;
  stage_is_terminal: boolean;
};

export type CrmTransition = {
  at: string;
  from_stage_key: string | null;
  from_stage_name: string | null;
  to_stage_key: string | null;
  to_stage_name: string | null;
};

export type CrmLeadItem = {
  lead_id: string;
  current_stage_key: string | null;
  current_stage_name: string | null;
  current_stage_position: number | null;
  max_stage_key: string | null;
  max_stage_position: number | null;
  won: boolean | null;
  all_closed_lost: boolean | null;
  deal_count: number | null;
  last_change_at: string | null;
  transitions?: CrmTransition[] | null;
  /** Marcação do Engine; `null` = sem marcação (NÃO é desqualificado). */
  qualification?: EngineQualification | null;
};

export const ENGINE_REASONS = [
  "imovel_antigo",
  "fora_regiao",
  "orcamento_incompativel",
  "escopo_fora",
  "nao_decisor",
  "contato_invalido",
  "outro",
] as const;
export type EngineReason = (typeof ENGINE_REASONS)[number];

export const ENGINE_REASON_LABEL: Record<EngineReason, string> = {
  imovel_antigo: "Imóvel antigo",
  fora_regiao: "Fora da região atendida",
  orcamento_incompativel: "Orçamento incompatível",
  escopo_fora: "Escopo fora do que fazemos",
  nao_decisor: "Não é quem decide",
  contato_invalido: "Contato inválido",
  outro: "Outro motivo",
};

export type EngineQualification = {
  decision: "qualificado" | "desqualificado";
  marked_at: string;
  reason_category?: string | null;
};

export type CrmStatusResult = {
  status: LeadStatus;
  won: boolean;
  lost: boolean;
  noDeal: boolean;
};

function positionOf(stages: CrmStage[], key: string): number {
  const s = stages.find((x) => x.stage_key === key);
  if (!s || typeof s.stage_position !== "number") {
    throw new Error(`etapa "${key}" ausente na lista do CRM`);
  }
  return s.stage_position;
}

export function crmLeadStatus(item: CrmLeadItem | null | undefined, stages: CrmStage[]): CrmStatusResult {
  const leadPos = positionOf(stages, "lead");
  const qualPos = positionOf(stages, "qualificacao");
  if (!item || !item.deal_count) return { status: "novo", won: false, lost: false, noDeal: true };
  const max = typeof item.max_stage_position === "number" ? item.max_stage_position : -Infinity;
  const allLost = item.all_closed_lost === true;
  if (item.won === true) return { status: "qualificado", won: true, lost: false, noDeal: false };
  if (max >= leadPos) return { status: "qualificado", won: false, lost: allLost, noDeal: false };
  if (allLost) return { status: "descartado", won: false, lost: true, noDeal: false };
  if (max >= qualPos) return { status: "contatado", won: false, lost: false, noDeal: false };
  return { status: "novo", won: false, lost: false, noDeal: false };
}

// ---------------------------------------------------------------------------
// Plano de atualização de um lead
// ---------------------------------------------------------------------------

export type CrmLeadRow = {
  id: string;
  status: string;
  manual_qualification?: "qualificado" | "descartado" | null;
  manual_qualification_source?: string | null;
  manual_qualification_at?: string | null;
  manual_qualification_reason?: string | null;
  crm_stage_key: string | null;
  crm_stage_name: string | null;
  crm_max_stage_key: string | null;
  crm_won: boolean | null;
  crm_lost: boolean | null;
  crm_deal_count: number | null;
  crm_last_change_at: string | null;
};

export type ExistingLog = { note: string | null; created_at: string };

export type PlannedLog = {
  lead_id: string;
  from_status: string | null;
  to_status: string;
  note: string;
  changed_by: null;
  changed_by_email: string;
  created_at: string;
};

export type CrmLeadPlan = {
  /** Campos a gravar em `leads` (vazio = nada mudou). */
  patch: Record<string, unknown>;
  logs: PlannedLog[];
  statusChanged: boolean;
  from: string;
  to: LeadStatus;
  noDeal: boolean;
  /** A mudança de status veio da marcação do Engine: não dispara Meta nem volta ao Engine. */
  byEngineQualification: boolean;
};

/** Marcação do Engine a aplicar, se for válida e mais nova que a atual do site. */
export function engineQualificationPatch(
  lead: Pick<CrmLeadRow, "manual_qualification_at">,
  q: EngineQualification | null | undefined,
): { manual_qualification: "qualificado" | "descartado"; manual_qualification_source: "engine"; manual_qualification_at: string; manual_qualification_reason: EngineReason | null } | null {
  if (!q || (q.decision !== "qualificado" && q.decision !== "desqualificado")) return null;
  const at = Date.parse(q.marked_at);
  if (Number.isNaN(at)) return null;
  const cur = lead.manual_qualification_at ? Date.parse(lead.manual_qualification_at) : NaN;
  if (!Number.isNaN(cur) && Math.floor(at / 1000) <= Math.floor(cur / 1000)) return null;
  const reason = q.decision === "desqualificado" && (ENGINE_REASONS as readonly string[]).includes(q.reason_category ?? "")
    ? (q.reason_category as EngineReason)
    : null;
  return {
    manual_qualification: q.decision === "qualificado" ? "qualificado" : "descartado",
    manual_qualification_source: "engine",
    manual_qualification_at: new Date(at).toISOString(),
    manual_qualification_reason: reason,
  };
}

export function transitionNote(t: CrmTransition): string {
  const to = t.to_stage_name ?? t.to_stage_key ?? "?";
  const from = t.from_stage_name ?? t.from_stage_key;
  return from ? `CRM: ${from} → ${to}` : `CRM: entrou em ${to}`;
}

function logKey(note: string | null, at: string): string {
  const ms = Date.parse(at);
  return `${note ?? ""}|${Number.isNaN(ms) ? at : Math.floor(ms / 1000)}`;
}

function sameTs(a: string | null, b: string | null): boolean {
  if (!a || !b) return a === b;
  return Math.floor(Date.parse(a) / 1000) === Math.floor(Date.parse(b) / 1000);
}

export function planCrmLeadUpdate(
  lead: CrmLeadRow,
  item: CrmLeadItem | null,
  stages: CrmStage[],
  existingLogs: ExistingLog[],
  nowIso: string,
): CrmLeadPlan {
  const r = crmLeadStatus(item, stages);
  const eq = engineQualificationPatch(lead, item?.qualification);
  const effectiveStatus = eq?.manual_qualification ?? lead.manual_qualification ?? r.status;
  const next = {
    crm_stage_key: item?.current_stage_key ?? null,
    crm_stage_name: item?.current_stage_name ?? null,
    crm_max_stage_key: item?.max_stage_key ?? null,
    crm_won: item ? r.won : false,
    crm_lost: item ? r.lost || item.all_closed_lost === true : false,
    crm_deal_count: item?.deal_count ?? 0,
    crm_last_change_at: item?.last_change_at ?? null,
  };
  const patch: Record<string, unknown> = {};
  (Object.keys(next) as (keyof typeof next)[]).forEach((k) => {
    const cur = lead[k];
    const val = next[k];
    const equal = k === "crm_last_change_at" ? sameTs(cur as string | null, val as string | null) : cur === val;
    if (!equal) patch[k] = val;
  });
  if (eq) Object.assign(patch, eq);
  const statusChanged = lead.status !== effectiveStatus;
  if (statusChanged) patch.status = effectiveStatus;
  if (Object.keys(patch).length) patch.crm_synced_at = nowIso;

  const seen = new Set(existingLogs.map((l) => logKey(l.note, l.created_at)));
  const fresh = [...(item?.transitions ?? [])]
    .filter((t) => t && t.at)
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
    .filter((t) => {
      const k = logKey(transitionNote(t), t.at);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

  const base = { lead_id: lead.id, changed_by: null, changed_by_email: CRM_ENGINE_AUTHOR } as const;
  const logs: PlannedLog[] = fresh.map((t) => ({
    ...base,
    from_status: effectiveStatus,
    to_status: effectiveStatus,
    note: transitionNote(t),
    created_at: new Date(Date.parse(t.at)).toISOString(),
  }));
  if (eq) {
    const reason = eq.manual_qualification_reason ? ` (${ENGINE_REASON_LABEL[eq.manual_qualification_reason]})` : "";
    const note = eq.manual_qualification === "qualificado" ? "Engine: qualificado" : `Engine: desqualificado${reason}`;
    if (!seen.has(logKey(note, eq.manual_qualification_at))) {
      logs.push({ ...base, from_status: lead.status, to_status: effectiveStatus, note, created_at: eq.manual_qualification_at });
    }
  }
  if (statusChanged && !eq) {
    const last = logs[logs.length - 1];
    if (last) {
      last.from_status = lead.status;
    } else {
      const where = item?.current_stage_name ?? (r.noDeal ? "sem negócio no CRM" : "?");
      logs.push({
        ...base,
        from_status: lead.status,
        to_status: effectiveStatus,
        note: `CRM: status atualizado (etapa atual: ${where})`,
        created_at: nowIso,
      });
    }
  }
  return { patch, logs, statusChanged, from: lead.status, to: effectiveStatus, noDeal: r.noDeal, byEngineQualification: !!eq && statusChanged };
}

/** A Meta recusa eventos com mais de 7 dias. */
export const META_EVENT_MAX_AGE_MS = 7 * 24 * 3_600_000;

export function shouldSendMetaQuality(plan: CrmLeadPlan, lastChangeAt: string | null, now: number): boolean {
  if (!plan.statusChanged || plan.byEngineQualification) return false;
  if (plan.to !== "qualificado" && plan.to !== "descartado") return false;
  const t = lastChangeAt ? Date.parse(lastChangeAt) : NaN;
  return !Number.isNaN(t) && now - t <= META_EVENT_MAX_AGE_MS;
}

// ---------------------------------------------------------------------------
// Rótulos (UI)
// ---------------------------------------------------------------------------

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  novo: "Novo",
  contatado: "Em andamento",
  qualificado: "Qualificado",
  descartado: "Não qualificado",
};
