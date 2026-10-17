/**
 * Status do lead (SÓ LEITURA): preenchido pelo funil do Bwild Engine via
 * /api/public/crm-stage-sync. Selo com texto (nunca só cor) + etapa atual
 * do CRM + selos "ganho"/"perdido". Inclui a barra de sincronização e o
 * histórico no funil usados em /admin/leads.
 */
import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LEAD_LOG_COLUMNS, isLeadStatus, type LeadLogRow } from "@/lib/adminLeads";
import { LEAD_STATUS_LABEL } from "@/lib/crmStage";
import { LeadCrmProposals } from "@/components/admin/LeadCrmProposals";

export type LeadCrmFields = {
  status: string;
  crm_stage_name?: string | null;
  crm_won?: boolean | null;
  crm_lost?: boolean | null;
  crm_deal_count?: number | null;
};

const TONE: Record<string, { bg: string; fg: string }> = {
  novo: { bg: "#EEF2F7", fg: "#11355B" },
  contatado: { bg: "#FFF6E0", fg: "#7A4B00" },
  qualificado: { bg: "#E6F4EA", fg: "#15603A" },
  descartado: { bg: "#F3F3F3", fg: "#555" },
};

const pill = (bg: string, fg: string) =>
  ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    background: bg,
    color: fg,
    border: `1px solid ${fg}33`,
    whiteSpace: "nowrap",
  }) as const;

export function LeadCrmStatus({ lead }: { lead: LeadCrmFields }) {
  const label = isLeadStatus(lead.status) ? LEAD_STATUS_LABEL[lead.status] : lead.status;
  const tone = TONE[lead.status] ?? TONE.descartado;
  const semNegocio = lead.crm_deal_count === 0;
  return (
    <div style={{ display: "grid", gap: 4, justifyItems: "start" }}>
      <span style={pill(tone.bg, tone.fg)}>{label}</span>
      <span className="muted" style={{ fontSize: 12 }}>
        {lead.crm_stage_name
          ? `CRM: ${lead.crm_stage_name}`
          : semNegocio
            ? "sem negócio no CRM"
            : lead.crm_deal_count == null
              ? "aguardando sincronização"
              : "—"}
      </span>
      {(lead.crm_won || lead.crm_lost) && (
        <span style={{ display: "flex", gap: 4 }}>
          {lead.crm_won && <span style={pill("#E6F4EA", "#15603A")}>ganho</span>}
          {lead.crm_lost && !lead.crm_won && <span style={pill("#FDECEC", "#9B1C1C")}>perdido</span>}
        </span>
      )}
    </div>
  );
}

function fmtDateTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

function fmtDay(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

export { fmtDateTime as fmtCrmDateTime };

/** Chama a sincronização como admin (Bearer da sessão). */
export async function triggerCrmSync(): Promise<{ ok: boolean; message: string }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { ok: false, message: "Sessão expirada. Entre de novo." };
  try {
    const res = await fetch("/api/public/crm-stage-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({}),
    });
    const body = (await res.json().catch(() => null)) as
      | { ok?: boolean; lidos?: number; alterados?: number; erros?: number; error?: string }
      | null;
    if (!res.ok || !body?.ok) {
      return { ok: false, message: `Falha na sincronização${body?.error ? ` (${body.error})` : ""}.` };
    }
    return {
      ok: true,
      message: `Sincronizado: ${body.lidos ?? 0} lidos no CRM, ${body.alterados ?? 0} com status alterado${body.erros ? `, ${body.erros} com erro` : ""}.`,
    };
  } catch {
    return { ok: false, message: "Não foi possível falar com o servidor." };
  }
}

export function CrmSyncBar({ onSynced }: { onSynced?: () => void }) {
  const [last, setLast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const loadLast = useCallback(async () => {
    const { data } = await supabase
      .from("integration_log")
      .select("created_at")
      .eq("integration", "crm_stage_sync")
      .eq("status", "sent")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setLast((data as { created_at?: string } | null)?.created_at ?? null);
  }, []);

  useEffect(() => {
    void loadLast();
  }, [loadLast]);

  async function run() {
    setBusy(true);
    setMsg(null);
    const r = await triggerCrmSync();
    setBusy(false);
    setMsg({ ok: r.ok, text: r.message });
    if (r.ok) {
      void loadLast();
      onSynced?.();
    }
  }

  return (
    <div
      style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", fontSize: 12, marginBottom: 14 }}
      className="muted"
    >
      <span>
        Status preenchido automaticamente pelo funil do Bwild Engine, uma vez por dia · última sincronização{" "}
        {last ? fmtDateTime(last) : "—"}
      </span>
      <button
        type="button"
        className="bw-admin__btn bw-admin__btn--sm"
        onClick={() => void run()}
        disabled={busy}
        aria-busy={busy}
        style={{ minHeight: 44 }}
      >
        <RefreshCw aria-hidden /> {busy ? "Sincronizando…" : "Sincronizar agora"}
      </button>
      {msg && (
        <span role={msg.ok ? "status" : "alert"} style={{ color: msg.ok ? "#15603A" : "#9B1C1C", fontWeight: 600 }}>
          {msg.text}
        </span>
      )}
    </div>
  );
}

export function LeadFunnelHistory({
  leadId,
  dealCount,
  syncedAt,
}: {
  leadId: string;
  dealCount: number | null | undefined;
  syncedAt: string | null | undefined;
}) {
  const [rows, setRows] = useState<LeadLogRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void supabase
      .from("lead_qualification_log")
      .select(LEAD_LOG_COLUMNS)
      .eq("lead_id", leadId)
      .order("created_at", { ascending: true })
      .limit(500)
      .then(({ data, error: e }) => {
        if (!alive) return;
        if (e) setError(e.message);
        else setRows((data ?? []) as LeadLogRow[]);
      });
    return () => {
      alive = false;
    };
  }, [leadId]);

  return (
    <div style={{ marginTop: 12 }}>
      <LeadCrmProposals leadId={leadId} />
      <strong style={{ display: "block", fontSize: 12, color: "var(--bw-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>
        Histórico no funil
      </strong>
      <p className="muted" style={{ margin: "0 0 6px", fontSize: 12 }}>
        Negócios no CRM: {dealCount == null ? "—" : dealCount} · última atualização vinda do CRM:{" "}
        {syncedAt ? fmtDateTime(syncedAt) : "—"}
      </p>
      {error ? (
        <p role="alert" style={{ margin: 0, color: "#9B1C1C" }}>Erro ao carregar o histórico: {error}</p>
      ) : rows === null ? (
        <p className="muted" style={{ margin: 0 }}>Carregando…</p>
      ) : rows.length === 0 ? (
        <p className="muted" style={{ margin: 0 }}>Nenhuma mudança registrada ainda.</p>
      ) : (
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          {rows.map((l) => (
            <li key={l.id}>
              {fmtDay(l.created_at)} · {l.note ?? `${l.from_status ?? "—"} → ${l.to_status}`}
              {l.from_status && l.from_status !== l.to_status && isLeadStatus(l.to_status) && isLeadStatus(l.from_status)
                ? ` (status: ${LEAD_STATUS_LABEL[l.from_status]} → ${LEAD_STATUS_LABEL[l.to_status]})`
                : ""}
              <span className="muted"> · {l.changed_by_email ?? "sem autor"}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
