/**
 * /admin/leads — Listagem de leads do formulário de diagnóstico.
 *
 * Fonte: tabela `leads` (alimentada pela edge function `notify-lead`,
 * chamada a partir do formulário em /diagnostico). A tabela legada
 * `diagnostic_leads` não é mais usada — ficou só por compatibilidade
 * histórica.
 *
 * Esta é a tela do DONO para conferir os leads. A operação comercial
 * (responder, qualificar de verdade, etc.) acontece no Bwild Engine —
 * por isso aqui não há mensagem pré-preenchida no WhatsApp nem features
 * de SLA/score/realtime.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import BewildAdminShell from "@/components/admin/BewildAdminShell";
import { supabase } from "@/integrations/supabase/client";

type LeadStatus = "novo" | "contatado" | "qualificado" | "descartado";

type Lead = {
  id: string;
  name: string | null;
  whatsapp: string | null;
  email: string | null;
  location: string | null;
  area_m2: number | null;
  objetivo: string | null;
  chaves: string | null;
  planta: string | null;
  message: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  landing_path: string | null;
  lead_source: string | null;
  lives_in_sp: boolean | null;
  status: LeadStatus;
  created_at: string;
};

const PAGE_SIZE = 200;

const STATUS_OPTIONS: { value: "all" | LeadStatus; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "novo", label: "Novos" },
  { value: "contatado", label: "Contatados" },
  { value: "qualificado", label: "Qualificados" },
  { value: "descartado", label: "Descartados" },
];

const STATUS_VALUES: LeadStatus[] = ["novo", "contatado", "qualificado", "descartado"];

const SELECT_COLS =
  "id, name, whatsapp, email, location, area_m2, objetivo, chaves, planta, message, utm_source, utm_medium, utm_campaign, referrer, landing_path, lead_source, lives_in_sp, status, created_at";

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

/**
 * Normaliza um número brasileiro para link wa.me.
 * - 10 dígitos (DDD + fixo 8) ou 11 dígitos (DDD + celular 9) → prefixa 55.
 * - 12/13 dígitos começando com 55 → usa como está.
 * - Qualquer outra coisa → retorna null (link omitido).
 */
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

type StatusCounts = Record<LeadStatus, number>;

const ZERO_COUNTS: StatusCounts = { novo: 0, contatado: 0, qualificado: 0, descartado: 0 };

export default function BewildLeadsAdminPage() {
  const [rows, setRows] = useState<Lead[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [counts, setCounts] = useState<StatusCounts>(ZERO_COUNTS);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<"all" | LeadStatus>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    // Query principal (página 1) + contagem total por status em paralelo.
    const [listRes, countsRes] = await Promise.all([
      supabase
        .from("leads")
        .select(SELECT_COLS, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1),
      supabase.from("leads").select("status"),
    ]);

    if (listRes.error) {
      console.error("[admin/leads] falha ao carregar leads:", listRes.error);
      setLoadError(listRes.error.message || "Não foi possível carregar os leads.");
      setRows([]);
      setTotalCount(0);
      setCounts(ZERO_COUNTS);
      setLoading(false);
      return;
    }

    setRows((listRes.data ?? []) as Lead[]);
    setTotalCount(listRes.count ?? (listRes.data?.length ?? 0));

    if (countsRes.error) {
      console.warn("[admin/leads] falha ao agregar contagens por status:", countsRes.error);
      // Fallback: contar a partir das linhas já carregadas.
      const c: StatusCounts = { ...ZERO_COUNTS };
      for (const r of (listRes.data ?? []) as Lead[]) {
        if (r.status in c) c[r.status] += 1;
      }
      setCounts(c);
    } else {
      const c: StatusCounts = { ...ZERO_COUNTS };
      for (const row of countsRes.data ?? []) {
        const s = (row as { status: LeadStatus }).status;
        if (s in c) c[s] += 1;
      }
      setCounts(c);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function loadMore() {
    if (loadingMore || rows.length >= totalCount) return;
    setLoadingMore(true);
    const from = rows.length;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("leads")
      .select(SELECT_COLS)
      .order("created_at", { ascending: false })
      .range(from, to);
    setLoadingMore(false);
    if (error) {
      console.error("[admin/leads] falha ao carregar mais leads:", error);
      window.alert(`Não foi possível carregar mais: ${error.message}`);
      return;
    }
    setRows((prev) => [...prev, ...((data ?? []) as Lead[])]);
  }

  const filtered = useMemo(() => {
    if (status === "all") return rows;
    return rows.filter((r) => r.status === status);
  }, [rows, status]);

  async function changeStatus(lead: Lead, next: string) {
    if (!STATUS_VALUES.includes(next as LeadStatus)) return;
    const nextStatus = next as LeadStatus;
    const previous = lead.status;
    if (nextStatus === previous) return;
    // Otimista: UI atualiza imediatamente; rollback em caso de erro.
    setRows((prev) => prev.map((r) => (r.id === lead.id ? { ...r, status: nextStatus } : r)));
    setCounts((prev) => ({
      ...prev,
      [previous]: Math.max(0, prev[previous] - 1),
      [nextStatus]: prev[nextStatus] + 1,
    }));
    setBusy(lead.id);
    const { error } = await supabase.from("leads").update({ status: nextStatus }).eq("id", lead.id);
    setBusy(null);
    if (error) {
      console.error("[admin/leads] falha ao atualizar status:", error);
      setRows((prev) => prev.map((r) => (r.id === lead.id ? { ...r, status: previous } : r)));
      setCounts((prev) => ({
        ...prev,
        [previous]: prev[previous] + 1,
        [nextStatus]: Math.max(0, prev[nextStatus] - 1),
      }));
      window.alert(`Não foi possível atualizar o status: ${error.message}`);
    }
  }

  async function deleteLead(lead: Lead) {
    const label = lead.name?.trim() || "este lead";
    if (!window.confirm(`Excluir ${label}? Essa ação não pode ser desfeita.`)) return;
    setBusy(lead.id);
    const { error } = await supabase.from("leads").delete().eq("id", lead.id);
    setBusy(null);
    if (error) {
      console.error("[admin/leads] falha ao excluir lead:", error);
      window.alert(`Não foi possível excluir: ${error.message}`);
      return;
    }
    if (openId === lead.id) setOpenId(null);
    // Atualiza local sem refetch completo.
    setRows((prev) => prev.filter((r) => r.id !== lead.id));
    setTotalCount((n) => Math.max(0, n - 1));
    setCounts((prev) => ({ ...prev, [lead.status]: Math.max(0, prev[lead.status] - 1) }));
  }

  const hasMore = rows.length < totalCount;

  return (
    <BewildAdminShell
      active="leads"
      eyebrow="Painel"
      title="Leads"
      description="Quem caiu no formulário de /diagnostico. Filtre por status e responda direto no WhatsApp."
    >
      <div className="bw-admin__kpi-grid">
        <KpiSimple label="Novos" value={counts.novo} />
        <KpiSimple label="Contatados" value={counts.contatado} />
        <KpiSimple label="Qualificados" value={counts.qualificado} />
        <KpiSimple label="Descartados" value={counts.descartado} />
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
            {totalCount === 0
              ? "Nenhum lead ainda. Quando alguém enviar o formulário de /diagnostico, ele aparece aqui."
              : "Nenhum lead com esse status."}
          </p>
        ) : (
          <>
            {rows.length < totalCount && (
              <p
                className="muted"
                style={{ padding: "10px 16px 0", margin: 0, fontSize: 12 }}
              >
                Exibindo {rows.length} de {totalCount} leads.
              </p>
            )}
            <table className="bw-admin__table">
              <thead>
                <tr>
                  <th>Quem</th>
                  <th>Imóvel</th>
                  <th>Origem</th>
                  <th>Status</th>
                  <th>Recebido</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const wa = waLink(r.whatsapp);
                  const isOpen = openId === r.id;
                  return (
                    <React.Fragment key={r.id}>
                      <tr>
                        <td>
                          <strong>{r.name ?? "(sem nome)"}</strong>
                          <div className="muted" style={{ fontSize: 12 }}>
                            {r.whatsapp ?? r.email ?? "—"}
                          </div>
                        </td>
                        <td className="muted">
                          {[r.objetivo, r.location, r.area_m2 ? `${r.area_m2}m²` : null]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </td>
                        <td className="muted ellip" title={r.landing_path ?? ""}>
                          {r.utm_source || r.utm_medium || r.utm_campaign
                            ? [r.utm_source, r.utm_medium, r.utm_campaign].filter(Boolean).join(" / ")
                            : r.landing_path ?? "(direto)"}
                        </td>
                        <td>
                          <select
                            value={r.status}
                            onChange={(e) => changeStatus(r, e.target.value)}
                            disabled={busy === r.id}
                            aria-label={`Mudar status de ${r.name ?? "lead"}`}
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
                          >
                            {isOpen ? "fechar" : "detalhes"}
                          </button>
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
                            onClick={() => deleteLead(r)}
                            disabled={busy === r.id}
                            aria-label={`Excluir ${r.name ?? "lead"}`}
                          >
                            excluir
                          </button>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr>
                          <td colSpan={6} style={{ background: "#FBFAF5", fontSize: 13 }}>
                            <dl
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                gap: "10px 24px",
                                margin: 0,
                              }}
                            >
                              <DetailItem label="E-mail" value={r.email} />
                              <DetailItem label="Localização" value={r.location} />
                              <DetailItem label="Metragem" value={r.area_m2 ? `${r.area_m2} m²` : null} />
                              <DetailItem label="Objetivo" value={r.objetivo} />
                              <DetailItem label="Como conheceu" value={r.lead_source} />
                              <DetailItem label="Mora em SP capital" value={r.lives_in_sp === null ? null : r.lives_in_sp ? "Sim" : "Não"} />
                              <DetailItem label="Chaves" value={r.chaves} />
                              <DetailItem label="Planta" value={r.planta} />
                              <DetailItem label="Landing" value={r.landing_path} />
                              <DetailItem label="Referrer" value={r.referrer} />
                              <DetailItem
                                label="UTM"
                                value={[r.utm_source, r.utm_medium, r.utm_campaign]
                                  .filter(Boolean)
                                  .join(" · ")}
                              />
                            </dl>
                            {r.message && (
                              <div style={{ marginTop: 12 }}>
                                <strong style={{ display: "block", fontSize: 12, color: "var(--bw-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>
                                  Mensagem
                                </strong>
                                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{r.message}</p>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            {hasMore && (
              <div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
                <button
                  type="button"
                  className="bw-admin__btn bw-admin__btn--sm"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Carregando…" : `Carregar mais (${totalCount - rows.length} restantes)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </BewildAdminShell>
  );
}

function KpiSimple({ label, value }: { label: string; value: number }) {
  return (
    <div className="bw-admin__kpi-card">
      <p className="bw-admin__kpi-label">{label}</p>
      <div className="bw-admin__kpi-value">{value}</div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: ".07em",
          color: "var(--bw-muted)",
          fontWeight: 600,
        }}
      >
        {label}
      </dt>
      <dd style={{ margin: 0, color: "var(--bw-ink)" }}>{value}</dd>
    </div>
  );
}
