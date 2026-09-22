/**
 * /admin/qualificacao — Tela de qualificação dos leads.
 *
 * O dono classifica cada lead em Qualificado · Em andamento · Descartado
 * (e "Novo" como estado inicial), com observação opcional. Toda mudança é
 * registrada em `lead_qualification_log`, formando o histórico por lead.
 *
 * Os status gravados em `leads.status` continuam sendo os mesmos usados nas
 * outras telas do painel: novo | contatado | qualificado | descartado.
 * "Em andamento" é o rótulo de `contatado`.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import BewildAdminShell from "@/components/admin/BewildAdminShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";

type LeadStatus = "novo" | "contatado" | "qualificado" | "descartado";

type Lead = {
  id: string;
  name: string | null;
  whatsapp: string | null;
  email: string | null;
  location: string | null;
  area_m2: number | null;
  objetivo: string | null;
  message: string | null;
  landing_path: string | null;
  status: LeadStatus;
  created_at: string;
};

type LogRow = {
  id: string;
  lead_id: string;
  from_status: string | null;
  to_status: string;
  note: string | null;
  changed_by_email: string | null;
  created_at: string;
};

const SELECT_COLS =
  "id, name, whatsapp, email, location, area_m2, objetivo, message, landing_path, status, created_at";

const PAGE_SIZE = 200;

const STATUS_LABEL: Record<LeadStatus, string> = {
  novo: "Novo",
  contatado: "Em andamento",
  qualificado: "Qualificado",
  descartado: "Descartado",
};

const STATUS_COLOR: Record<LeadStatus, string> = {
  novo: "#6B7280",
  contatado: "#B45309",
  qualificado: "#15803D",
  descartado: "#B3261E",
};

const CLASSIFY: LeadStatus[] = ["qualificado", "contatado", "descartado"];

const FILTERS: { value: "all" | LeadStatus; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "novo", label: "Novos" },
  { value: "contatado", label: "Em andamento" },
  { value: "qualificado", label: "Qualificados" },
  { value: "descartado", label: "Descartados" },
];

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function waLink(whatsapp: string | null): string | null {
  if (!whatsapp) return null;
  const digits = whatsapp.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) return `https://wa.me/55${digits}`;
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55"))
    return `https://wa.me/${digits}`;
  return null;
}

function resumo(lead: Lead): string {
  const partes = [lead.objetivo, lead.location, lead.area_m2 ? `${lead.area_m2} m²` : null].filter(
    Boolean,
  );
  if (partes.length) return partes.join(" · ");
  return lead.message?.trim().slice(0, 120) || "—";
}

export default function BewildQualificacaoAdminPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Lead[]>([]);
  const [logs, setLogs] = useState<Record<string, LogRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<"all" | LeadStatus>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [nota, setNota] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const [listRes, logRes] = await Promise.all([
      supabase
        .from("leads")
        .select(SELECT_COLS)
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1),
      supabase
        .from("lead_qualification_log")
        .select("id, lead_id, from_status, to_status, note, changed_by_email, created_at")
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);

    if (listRes.error) {
      console.error("[admin/qualificacao] falha ao carregar leads:", listRes.error);
      setLoadError(listRes.error.message || "Não foi possível carregar os leads.");
      setRows([]);
      setLoading(false);
      return;
    }

    setRows((listRes.data ?? []) as Lead[]);

    const byLead: Record<string, LogRow[]> = {};
    for (const row of (logRes.data ?? []) as LogRow[]) {
      (byLead[row.lead_id] ||= []).push(row);
    }
    setLogs(byLead);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () => rows.filter((r) => filtro === "all" || r.status === filtro),
    [rows, filtro],
  );

  const counts = useMemo(() => {
    const c: Record<LeadStatus, number> = { novo: 0, contatado: 0, qualificado: 0, descartado: 0 };
    for (const r of rows) if (r.status in c) c[r.status] += 1;
    return c;
  }, [rows]);

  async function classificar(lead: Lead, next: LeadStatus) {
    if (busy) return;
    const observacao = (nota[lead.id] ?? "").trim();
    if (next === lead.status && !observacao) return;

    const previous = lead.status;
    setBusy(lead.id);
    setRows((prev) => prev.map((r) => (r.id === lead.id ? { ...r, status: next } : r)));

    const { error } = await supabase.from("leads").update({ status: next }).eq("id", lead.id);
    if (error) {
      setRows((prev) => prev.map((r) => (r.id === lead.id ? { ...r, status: previous } : r)));
      setBusy(null);
      window.alert(`Não foi possível salvar a classificação: ${error.message}`);
      return;
    }

    const { data: inserted, error: logError } = await supabase
      .from("lead_qualification_log")
      .insert({
        lead_id: lead.id,
        from_status: previous,
        to_status: next,
        note: observacao || null,
        changed_by: user?.id ?? null,
        changed_by_email: user?.email ?? null,
      })
      .select("id, lead_id, from_status, to_status, note, changed_by_email, created_at")
      .single();

    setBusy(null);
    setNota((prev) => ({ ...prev, [lead.id]: "" }));

    if (logError || !inserted) {
      console.warn("[admin/qualificacao] falha ao gravar histórico:", logError);
      return;
    }
    setLogs((prev) => ({
      ...prev,
      [lead.id]: [inserted as LogRow, ...(prev[lead.id] ?? [])],
    }));
  }

  return (
    <BewildAdminShell
      active="qualificacao"
      eyebrow="Painel"
      title="Qualificação"
      description="Classifique cada lead como qualificado, em andamento ou descartado. Toda mudança fica registrada no histórico, com observação, autor e data."
    >
      <div className="bw-admin__kpi-grid">
        <KpiSimple label="Novos" value={counts.novo} />
        <KpiSimple label="Em andamento" value={counts.contatado} />
        <KpiSimple label="Qualificados" value={counts.qualificado} />
        <KpiSimple label="Descartados" value={counts.descartado} />
      </div>

      <div
        className="bw-admin__period"
        style={{ marginBottom: 14 }}
        role="group"
        aria-label="Filtro por classificação"
      >
        {FILTERS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={filtro === opt.value ? "is-active" : ""}
            onClick={() => setFiltro(opt.value)}
            aria-pressed={filtro === opt.value}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="bw-admin__section" style={{ padding: 0 }}>
        {loading ? (
          <p className="bw-admin__empty">Carregando…</p>
        ) : loadError ? (
          <div className="bw-admin__empty" role="alert" style={{ display: "grid", gap: 12, justifyItems: "center" }}>
            <p style={{ margin: 0, color: "#991B1B" }}>
              <strong>Erro ao carregar os leads.</strong>
              <br />
              <span style={{ fontSize: 13 }}>{loadError}</span>
            </p>
            <button type="button" className="bw-admin__btn bw-admin__btn--sm" onClick={load}>
              Tentar de novo
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="bw-admin__empty">
            {rows.length === 0
              ? "Nada recebido ainda. Os contatos do site aparecem aqui para qualificação."
              : "Nenhum lead com essa classificação."}
          </p>
        ) : (
          <table className="bw-admin__table">
            <thead>
              <tr>
                <th>Quem</th>
                <th>Imóvel / mensagem</th>
                <th>Classificação</th>
                <th>Recebido</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const wa = waLink(r.whatsapp);
                const isOpen = openId === r.id;
                const hist = logs[r.id] ?? [];
                return (
                  <React.Fragment key={r.id}>
                    <tr>
                      <td>
                        <strong>{r.name ?? "(sem nome)"}</strong>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {r.whatsapp ?? r.email ?? "—"}
                        </div>
                      </td>
                      <td className="muted">{resumo(r)}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: STATUS_COLOR[r.status] }}>
                          {STATUS_LABEL[r.status]}
                        </span>
                        <div className="muted" style={{ fontSize: 11 }}>
                          {hist.length > 0 ? `${hist.length} registro(s)` : "sem histórico"}
                        </div>
                      </td>
                      <td className="muted" style={{ whiteSpace: "nowrap" }}>{fmtDate(r.created_at)}</td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        {wa && (
                          <a
                            className="bw-admin__btn bw-admin__btn--sm"
                            href={wa}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle aria-hidden /> WhatsApp
                          </a>
                        )}
                        {"  "}
                        <button
                          type="button"
                          className="bw-admin__section-link"
                          style={{ background: "none", border: 0, cursor: "pointer" }}
                          onClick={() => setOpenId(isOpen ? null : r.id)}
                          aria-expanded={isOpen}
                        >
                          {isOpen ? "fechar" : "qualificar"}
                        </button>
                      </td>
                    </tr>

                    {isOpen && (
                      <tr>
                        <td colSpan={5} style={{ background: "#FBFAF5", fontSize: 13 }}>
                          <div style={{ display: "grid", gap: 14 }}>
                            <div style={{ display: "grid", gap: 8, maxWidth: 620 }}>
                              <label
                                htmlFor={`nota-${r.id}`}
                                style={{ fontSize: 12, color: "var(--bw-muted)", textTransform: "uppercase", letterSpacing: ".06em" }}
                              >
                                Observação (opcional)
                              </label>
                              <textarea
                                id={`nota-${r.id}`}
                                rows={2}
                                maxLength={600}
                                value={nota[r.id] ?? ""}
                                onChange={(e) => setNota((prev) => ({ ...prev, [r.id]: e.target.value }))}
                                placeholder="Ex.: falou por WhatsApp, quer orçamento para studio de 28 m² na Vila Olímpia."
                                style={{
                                  width: "100%",
                                  padding: 10,
                                  borderRadius: 8,
                                  border: "1px solid var(--bw-border, #d6d3cc)",
                                  font: "inherit",
                                  resize: "vertical",
                                }}
                              />
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {CLASSIFY.map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    className="bw-admin__btn bw-admin__btn--sm"
                                    disabled={busy === r.id}
                                    onClick={() => classificar(r, s)}
                                    style={{ borderColor: STATUS_COLOR[s], color: STATUS_COLOR[s] }}
                                  >
                                    {STATUS_LABEL[s]}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <strong
                                style={{ display: "block", fontSize: 12, color: "var(--bw-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}
                              >
                                Histórico
                              </strong>
                              {hist.length === 0 ? (
                                <p className="muted" style={{ margin: 0 }}>
                                  Nenhuma classificação registrada ainda.
                                </p>
                              ) : (
                                <ol style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
                                  {hist.map((h) => (
                                    <li key={h.id}>
                                      <span style={{ fontWeight: 600, color: STATUS_COLOR[(h.to_status as LeadStatus) in STATUS_COLOR ? (h.to_status as LeadStatus) : "novo"] }}>
                                        {STATUS_LABEL[(h.to_status as LeadStatus)] ?? h.to_status}
                                      </span>
                                      {h.from_status && (
                                        <span className="muted">
                                          {" "}
                                          (antes: {STATUS_LABEL[(h.from_status as LeadStatus)] ?? h.from_status})
                                        </span>
                                      )}
                                      <span className="muted"> · {fmtDate(h.created_at)}</span>
                                      {h.changed_by_email && (
                                        <span className="muted"> · {h.changed_by_email}</span>
                                      )}
                                      {h.note && <div style={{ marginTop: 2 }}>{h.note}</div>}
                                    </li>
                                  ))}
                                </ol>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </BewildAdminShell>
  );
}

function KpiSimple({ label, value }: { label: string; value: number }) {
  return (
    <div className="bw-admin__kpi">
      <span className="bw-admin__kpi-label">{label}</span>
      <strong className="bw-admin__kpi-value">{value}</strong>
    </div>
  );
}
