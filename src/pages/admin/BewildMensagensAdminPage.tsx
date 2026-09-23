/**
 * /admin/mensagens — Mensagens recebidas pelo formulário de /contato.
 *
 * Fonte: tabela `leads` (alimentada pela edge function `notify-lead`),
 * filtrada pelo FORMULÁRIO (`form_path = '/contato'`). Antes o filtro era
 * `landing_path`, que é a primeira página da sessão (atribuição): quem
 * entrou pela home e mandou mensagem no /contato sumia desta tela. Leads
 * antigos, sem `form_path`, entram pelo `landing_path` como antes.
 *
 * Diferente de /admin/leads, esta tela é focada na MENSAGEM em si: o texto
 * aparece direto na lista, sem precisar abrir detalhes.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MessageCircle, Mail } from "lucide-react";
import BewildAdminShell from "@/components/admin/BewildAdminShell";
import AdminAlert from "@/components/admin/AdminAlert";
import { supabase } from "@/integrations/supabase/client";
import {
  LEAD_STATUSES,
  MENSAGEM_FORMS,
  isLeadStatus,
  leadFormOrFilter,
  mailtoHref,
  updateLeadStatus,
  waLink,
  type LeadStatus,
} from "@/lib/adminLeads";

type Mensagem = {
  id: string;
  name: string | null;
  whatsapp: string | null;
  email: string | null;
  message: string | null;
  form_path: string | null;
  landing_path: string | null;
  status: LeadStatus;
  created_at: string;
};

const PAGE_SIZE = 100;

const STATUS_OPTIONS: { value: "all" | LeadStatus; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "novo", label: "Novas" },
  { value: "contatado", label: "Contatadas" },
  { value: "qualificado", label: "Qualificadas" },
  { value: "descartado", label: "Descartadas" },
];

const SELECT_COLS = "id, name, whatsapp, email, message, form_path, landing_path, status, created_at";
const FORM_FILTER = leadFormOrFilter(MENSAGEM_FORMS);

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

export default function BewildMensagensAdminPage() {
  const [rows, setRows] = useState<Mensagem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [novas, setNovas] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ kind: "err" | "warn"; text: string } | null>(null);
  const [status, setStatus] = useState<"all" | LeadStatus>("all");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const [listRes, novasRes] = await Promise.all([
      supabase
        .from("leads")
        .select(SELECT_COLS, { count: "exact" })
        .or(FORM_FILTER)
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .or(FORM_FILTER)
        .eq("status", "novo"),
    ]);

    if (listRes.error) {
      console.error("[admin/mensagens] falha ao carregar mensagens:", listRes.error);
      setLoadError(listRes.error.message || "Não foi possível carregar as mensagens.");
      setRows([]);
      setTotalCount(0);
      setNovas(null);
    } else {
      setRows((listRes.data ?? []) as Mensagem[]);
      setTotalCount(listRes.count ?? listRes.data?.length ?? 0);
      setNovas(novasRes.error ? null : (novasRes.count ?? 0));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function loadMore() {
    if (loadingMore || rows.length >= totalCount) return;
    setLoadingMore(true);
    const { data, error } = await supabase
      .from("leads")
      .select(SELECT_COLS)
      .or(FORM_FILTER)
      .order("created_at", { ascending: false })
      .range(rows.length, rows.length + PAGE_SIZE - 1);
    setLoadingMore(false);
    if (error) {
      setActionMsg({ kind: "err", text: `Não foi possível carregar mais: ${error.message}` });
      return;
    }
    setRows((prev) => {
      const seen = new Set(prev.map((r) => r.id));
      return [...prev, ...((data ?? []) as Mensagem[]).filter((r) => !seen.has(r.id))];
    });
  }

  const filtered = useMemo(() => {
    if (status === "all") return rows;
    return rows.filter((r) => r.status === status);
  }, [rows, status]);

  async function changeStatus(item: Mensagem, next: string) {
    if (!isLeadStatus(next)) return;
    const previous = item.status;
    if (next === previous) return;
    setRows((prev) => prev.map((r) => (r.id === item.id ? { ...r, status: next } : r)));
    setNovas((n) => (n === null ? n : n + (next === "novo" ? 1 : 0) - (previous === "novo" ? 1 : 0)));
    setBusy(item.id);
    setActionMsg(null);
    const result = await updateLeadStatus(item.id, isLeadStatus(previous) ? previous : null, next);
    setBusy(null);
    if (!result.ok) {
      console.error("[admin/mensagens] falha ao atualizar status:", result.error);
      setRows((prev) => prev.map((r) => (r.id === item.id ? { ...r, status: previous } : r)));
      setNovas((n) => (n === null ? n : n - (next === "novo" ? 1 : 0) + (previous === "novo" ? 1 : 0)));
      setActionMsg({ kind: "err", text: `Não foi possível atualizar o status: ${result.error}` });
      return;
    }
    if (result.logError) {
      setActionMsg({
        kind: "warn",
        text: `Status salvo, mas o histórico de qualificação não foi registrado: ${result.logError}`,
      });
    }
  }

  async function deleteItem(item: Mensagem) {
    const label = item.name?.trim() || "esta mensagem";
    if (!window.confirm(`Excluir a mensagem de ${label}? Essa ação não pode ser desfeita.`)) return;
    setBusy(item.id);
    setActionMsg(null);
    const { data, error } = await supabase.from("leads").delete().eq("id", item.id).select("id");
    setBusy(null);
    if (error || !data || data.length === 0) {
      console.error("[admin/mensagens] falha ao excluir:", error);
      setActionMsg({
        kind: "err",
        text: `Não foi possível excluir: ${error?.message ?? "nada foi excluído (sem permissão ou já removido)."}`,
      });
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== item.id));
    setTotalCount((n) => Math.max(0, n - 1));
    if (item.status === "novo") setNovas((n) => (n === null ? n : Math.max(0, n - 1)));
  }

  const hasMore = rows.length < totalCount;

  return (
    <BewildAdminShell
      active="mensagens"
      eyebrow="Painel"
      title="Mensagens"
      description="Tudo o que chegou pelo formulário de /contato, mais recente primeiro."
    >
      {actionMsg && (
        <AdminAlert kind={actionMsg.kind} onClose={() => setActionMsg(null)}>
          {actionMsg.text}
        </AdminAlert>
      )}

      <div className="bw-admin__kpi-grid">
        <div className="bw-admin__kpi-card">
          <p className="bw-admin__kpi-label">Total de mensagens</p>
          <div className="bw-admin__kpi-value">{totalCount}</div>
        </div>
        <div className="bw-admin__kpi-card">
          <p className="bw-admin__kpi-label">Novas</p>
          <div className={"bw-admin__kpi-value" + (novas === null ? " bw-admin__kpi-empty" : "")}>
            {novas === null ? "—" : novas}
          </div>
        </div>
      </div>

      <div className="bw-admin__period" style={{ marginBottom: 14 }} role="group" aria-label="Filtro por status">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={status === opt.value ? "is-active" : ""}
            onClick={() => setStatus(opt.value)}
            aria-pressed={status === opt.value}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="bw-admin__section" style={{ padding: 0 }}>
        {loading ? (
          <p className="bw-admin__empty">Carregando…</p>
        ) : loadError ? (
          <div
            className="bw-admin__empty"
            role="alert"
            style={{
              display: "grid",
              gap: 12,
              justifyItems: "center",
              background: "#FEF2F2",
              border: "1px solid #FCA5A5",
              borderRadius: 8,
              padding: 24,
            }}
          >
            <p style={{ margin: 0, color: "#991B1B" }}>
              <strong>Erro ao carregar as mensagens.</strong>
              <br />
              <span style={{ fontSize: 13 }}>{loadError}</span>
            </p>
            <button type="button" className="bw-admin__btn bw-admin__btn--sm" onClick={() => void load()}>
              Tentar de novo
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="bw-admin__empty">
            {totalCount === 0
              ? "Nenhuma mensagem ainda. Quando alguém enviar o formulário de /contato, ela aparece aqui."
              : hasMore
                ? "Nenhuma mensagem com esse status entre as carregadas. Use “Carregar mais” para ver as mais antigas."
                : "Nenhuma mensagem com esse status."}
          </p>
        ) : (
          <table className="bw-admin__table">
            <thead>
              <tr>
                <th>Quem</th>
                <th>Mensagem</th>
                <th>Status</th>
                <th>Recebida</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const wa = waLink(r.whatsapp);
                const mailto = mailtoHref(r.email);
                return (
                  <React.Fragment key={r.id}>
                    <tr>
                      <td style={{ verticalAlign: "top" }}>
                        <strong>{r.name ?? "(sem nome)"}</strong>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {r.whatsapp ?? "—"}
                        </div>
                        {r.email && (
                          <div className="muted" style={{ fontSize: 12, overflowWrap: "anywhere" }}>
                            {r.email}
                          </div>
                        )}
                      </td>
                      <td style={{ maxWidth: 420, whiteSpace: "pre-wrap", verticalAlign: "top" }}>
                        {r.message ?? <span className="muted">(sem mensagem)</span>}
                      </td>
                      <td style={{ verticalAlign: "top" }}>
                        <select
                          value={r.status}
                          onChange={(e) => void changeStatus(r, e.target.value)}
                          disabled={busy === r.id}
                          aria-label={`Mudar status de ${r.name ?? "mensagem"}`}
                          style={{
                            padding: "6px 28px 6px 10px",
                            borderRadius: 6,
                            border: "1px solid var(--bw-border, #d6d3cc)",
                            background: "#fff",
                            fontSize: 13,
                            cursor: busy === r.id ? "wait" : "pointer",
                          }}
                        >
                          {!isLeadStatus(r.status) && (
                            <option value={r.status} disabled>
                              {r.status}
                            </option>
                          )}
                          {LEAD_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="muted" style={{ whiteSpace: "nowrap", verticalAlign: "top" }}>
                        {fmtDate(r.created_at)}
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap", verticalAlign: "top" }}>
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
                        {mailto && (
                          <>
                            {"  "}
                            <a className="bw-admin__btn bw-admin__btn--sm" href={mailto}>
                              <Mail aria-hidden /> E-mail
                            </a>
                          </>
                        )}
                        {"  "}
                        <button
                          type="button"
                          className="bw-admin__section-link"
                          style={{
                            background: "none",
                            border: 0,
                            cursor: busy === r.id ? "wait" : "pointer",
                            color: "#b3261e",
                          }}
                          onClick={() => void deleteItem(r)}
                          disabled={busy === r.id}
                          aria-label={`Excluir mensagem de ${r.name ?? "contato"}`}
                        >
                          excluir
                        </button>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && !loadError && hasMore && (
          <div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
            <button
              type="button"
              className="bw-admin__btn bw-admin__btn--sm"
              onClick={() => void loadMore()}
              disabled={loadingMore}
            >
              {loadingMore ? "Carregando…" : `Carregar mais (${totalCount - rows.length} restantes)`}
            </button>
          </div>
        )}
      </div>
    </BewildAdminShell>
  );
}
