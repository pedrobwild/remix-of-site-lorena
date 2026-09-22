/**
 * /admin/diagnostico — Submissões do formulário de diagnóstico (/diagnostico).
 *
 * Fonte: tabela `leads` (alimentada pela edge function `notify-lead`),
 * filtrada por `landing_path = '/diagnostico'`. Diferente de /admin/mensagens
 * (formulário de /contato), esta tela destaca os dados do IMÓVEL: bairro,
 * metragem, objetivo, chaves e planta — tudo visível na lista.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MessageCircle, Mail } from "lucide-react";
import BewildAdminShell from "@/components/admin/BewildAdminShell";
import { supabase } from "@/integrations/supabase/client";

type LeadStatus = "novo" | "contatado" | "qualificado" | "descartado";

type Diagnostico = {
  id: string;
  name: string | null;
  whatsapp: string | null;
  email: string | null;
  location: string | null;
  area_m2: number | null;
  objetivo: string | null;
  chaves: string | null;
  planta: string | null;
  lives_in_sp: boolean | null;
  message: string | null;
  status: LeadStatus;
  created_at: string;
};

const PAGE_SIZE = 200;

const STATUS_VALUES: LeadStatus[] = ["novo", "contatado", "qualificado", "descartado"];

const STATUS_OPTIONS: { value: "all" | LeadStatus; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "novo", label: "Novos" },
  { value: "contatado", label: "Contatados" },
  { value: "qualificado", label: "Qualificados" },
  { value: "descartado", label: "Descartados" },
];

const SELECT_COLS =
  "id, name, whatsapp, email, location, area_m2, objetivo, chaves, planta, lives_in_sp, message, status, created_at";

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
  let full: string;
  if (digits.length === 10 || digits.length === 11) {
    full = `55${digits}`;
  } else if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    full = digits;
  } else {
    return null;
  }
  return `https://wa.me/${full}`;
}

function imovelResumo(r: Diagnostico): string {
  const partes: string[] = [];
  if (r.location) partes.push(r.location);
  if (r.area_m2 != null) partes.push(`${r.area_m2} m²`);
  if (r.objetivo) partes.push(r.objetivo);
  return partes.join(" · ");
}

export default function BewildDiagnosticoAdminPage() {
  const [rows, setRows] = useState<Diagnostico[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<"all" | LeadStatus>("all");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error, count } = await supabase
      .from("leads")
      .select(SELECT_COLS, { count: "exact" })
      .eq("landing_path", "/diagnostico")
      .order("created_at", { ascending: false })
      .range(0, PAGE_SIZE - 1);

    if (error) {
      console.error("[admin/diagnostico] falha ao carregar diagnósticos:", error);
      setLoadError(error.message || "Não foi possível carregar os diagnósticos.");
      setRows([]);
      setTotalCount(0);
    } else {
      setRows((data ?? []) as Diagnostico[]);
      setTotalCount(count ?? data?.length ?? 0);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (status === "all") return rows;
    return rows.filter((r) => r.status === status);
  }, [rows, status]);

  const novos = useMemo(() => rows.filter((r) => r.status === "novo").length, [rows]);

  async function changeStatus(item: Diagnostico, next: string) {
    if (!STATUS_VALUES.includes(next as LeadStatus)) return;
    const nextStatus = next as LeadStatus;
    const previous = item.status;
    if (nextStatus === previous) return;
    setRows((prev) => prev.map((r) => (r.id === item.id ? { ...r, status: nextStatus } : r)));
    setBusy(item.id);
    const { error } = await supabase.from("leads").update({ status: nextStatus }).eq("id", item.id);
    setBusy(null);
    if (error) {
      console.error("[admin/diagnostico] falha ao atualizar status:", error);
      setRows((prev) => prev.map((r) => (r.id === item.id ? { ...r, status: previous } : r)));
      window.alert(`Não foi possível atualizar o status: ${error.message}`);
    }
  }

  async function deleteItem(item: Diagnostico) {
    const label = item.name?.trim() || "este diagnóstico";
    if (!window.confirm(`Excluir o diagnóstico de ${label}? Essa ação não pode ser desfeita.`)) return;
    setBusy(item.id);
    const { error } = await supabase.from("leads").delete().eq("id", item.id);
    setBusy(null);
    if (error) {
      console.error("[admin/diagnostico] falha ao excluir:", error);
      window.alert(`Não foi possível excluir: ${error.message}`);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== item.id));
    setTotalCount((n) => Math.max(0, n - 1));
  }

  return (
    <BewildAdminShell
      active="diagnostico"
      eyebrow="Painel"
      title="Diagnósticos"
      description="Todas as submissões do formulário de /diagnostico, mais recentes primeiro."
    >
      <div className="bw-admin__kpi-grid">
        <div className="bw-admin__kpi-card">
          <p className="bw-admin__kpi-label">Total de diagnósticos</p>
          <div className="bw-admin__kpi-value">{totalCount}</div>
        </div>
        <div className="bw-admin__kpi-card">
          <p className="bw-admin__kpi-label">Novos</p>
          <div className="bw-admin__kpi-value">{novos}</div>
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
              <strong>Erro ao carregar os diagnósticos.</strong>
              <br />
              <span style={{ fontSize: 13 }}>{loadError}</span>
            </p>
            <button type="button" className="bw-admin__btn bw-admin__btn--sm" onClick={load}>
              Tentar de novo
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="bw-admin__empty">
            {totalCount === 0
              ? "Nenhum diagnóstico ainda. Quando alguém enviar o formulário de /diagnostico, ele aparece aqui."
              : "Nenhum diagnóstico com esse status."}
          </p>
        ) : (
          <table className="bw-admin__table">
            <thead>
              <tr>
                <th>Quem</th>
                <th>Imóvel</th>
                <th>Detalhes</th>
                <th>Status</th>
                <th>Recebido</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const wa = waLink(r.whatsapp);
                const resumo = imovelResumo(r);
                return (
                  <React.Fragment key={r.id}>
                    <tr>
                      <td style={{ verticalAlign: "top" }}>
                        <strong>{r.name ?? "(sem nome)"}</strong>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {r.whatsapp ?? "—"}
                        </div>
                        {r.email && (
                          <div className="muted" style={{ fontSize: 12 }}>
                            {r.email}
                          </div>
                        )}
                      </td>
                      <td style={{ maxWidth: 260, verticalAlign: "top" }}>
                        {resumo || <span className="muted">—</span>}
                        {r.lives_in_sp != null && (
                          <div className="muted" style={{ fontSize: 12 }}>
                            {r.lives_in_sp ? "Mora em SP" : "Não mora em SP"}
                          </div>
                        )}
                      </td>
                      <td style={{ maxWidth: 320, verticalAlign: "top" }}>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {r.chaves && <>Chaves: {r.chaves} · </>}
                          {r.planta && <>Planta: {r.planta}</>}
                        </div>
                        {r.message && (
                          <div style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>{r.message}</div>
                        )}
                        {!r.chaves && !r.planta && !r.message && <span className="muted">—</span>}
                      </td>
                      <td style={{ verticalAlign: "top" }}>
                        <select
                          value={r.status}
                          onChange={(e) => changeStatus(r, e.target.value)}
                          disabled={busy === r.id}
                          aria-label={`Mudar status de ${r.name ?? "diagnóstico"}`}
                          style={{
                            padding: "6px 28px 6px 10px",
                            borderRadius: 6,
                            border: "1px solid var(--bw-border, #d6d3cc)",
                            background: "#fff",
                            fontSize: 13,
                            cursor: busy === r.id ? "wait" : "pointer",
                          }}
                        >
                          {STATUS_VALUES.map((s) => (
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
                        {r.email && (
                          <>
                            {"  "}
                            <a className="bw-admin__btn bw-admin__btn--sm" href={`mailto:${r.email}`}>
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
                          onClick={() => deleteItem(r)}
                          disabled={busy === r.id}
                          aria-label={`Excluir diagnóstico de ${r.name ?? "contato"}`}
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
      </div>
    </BewildAdminShell>
  );
}
