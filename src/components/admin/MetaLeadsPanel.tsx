/**
 * Aba "Formulários Meta" de /admin/leads — leads dos formulários
 * instantâneos (Lead Ads) do Facebook e do Instagram.
 *
 * Quem grava é a edge function `meta-sync` (a cada 30 min, ou pelo botão
 * "Sincronizar agora"); cada lead novo já foi avisado no Slack, por e-mail e
 * no CRM como os do site. Aqui o time confere, muda o status e, se preciso,
 * exclui: "excluir" apaga os dados pessoais do painel e mantém a linha, para
 * a sincronização não trazer o lead de volta (na Meta ele continua na
 * Central de Leads até ser apagado lá).
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MessageCircle, RefreshCw } from "lucide-react";
import AdminAlert from "@/components/admin/AdminAlert";
import { supabase } from "@/integrations/supabase/client";
import { LEAD_STATUSES, isLeadStatus, mailtoHref, type LeadStatus } from "@/lib/adminLeads";
import {
  displayMetaPhone,
  fetchMetaSyncStates,
  leadAnswers,
  metaSyncSummary,
  metaWaLink,
  notifySummary,
  platformLabel,
  triggerMetaSync,
  type MetaLeadRecord,
  type MetaSyncStateRow,
} from "@/lib/metaAds";

const PAGE_SIZE = 200;

type Row = Pick<
  MetaLeadRecord,
  | "id"
  | "meta_lead_id"
  | "created_time"
  | "form_name"
  | "ad_name"
  | "adset_name"
  | "campaign_name"
  | "platform"
  | "is_organic"
  | "is_test"
  | "name"
  | "email"
  | "phone"
  | "city"
  | "answers"
  | "status"
  | "notify"
>;

const COLS =
  "id, meta_lead_id, created_time, form_name, ad_name, adset_name, campaign_name, platform, is_organic, is_test, name, email, phone, city, answers, status, notify";

const STATUS_OPTIONS: { value: "all" | LeadStatus; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "novo", label: "Novos" },
  { value: "contatado", label: "Contatados" },
  { value: "qualificado", label: "Qualificados" },
  { value: "descartado", label: "Descartados" },
];

type Counts = Record<LeadStatus, number>;
const ZERO: Counts = { novo: 0, contatado: 0, qualificado: 0, descartado: 0 };

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

async function fetchCounts(): Promise<{ counts: Counts; error: string | null }> {
  const res = await Promise.all(
    LEAD_STATUSES.map((s) =>
      supabase
        .from("meta_leads")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("status", s),
    ),
  );
  const counts = { ...ZERO };
  let error: string | null = null;
  LEAD_STATUSES.forEach((s, i) => {
    if (res[i].error) error = res[i].error?.message ?? "erro";
    else counts[s] = res[i].count ?? 0;
  });
  return { counts, error };
}

const TONE_COLOR: Record<string, string> = {
  ok: "#15803D",
  warn: "#8A5A00",
  error: "#B3261E",
  off: "var(--bw-muted)",
};

export default function MetaLeadsPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Counts>(ZERO);
  const [countsError, setCountsError] = useState<string | null>(null);
  const [states, setStates] = useState<MetaSyncStateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "err" | "warn" | "ok"; text: string } | null>(null);
  const [status, setStatus] = useState<"all" | LeadStatus>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const [listRes, countsRes, statesRes] = await Promise.all([
      supabase
        .from("meta_leads")
        .select(COLS, { count: "exact" })
        .is("deleted_at", null)
        .order("created_time", { ascending: false })
        .range(0, PAGE_SIZE - 1),
      fetchCounts(),
      fetchMetaSyncStates(),
    ]);
    setStates(statesRes.states);
    if (listRes.error) {
      setLoadError(listRes.error.message || "Não foi possível carregar os leads da Meta.");
      setRows([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setRows((listRes.data ?? []) as Row[]);
    setTotal(listRes.count ?? listRes.data?.length ?? 0);
    setCounts(countsRes.counts);
    setCountsError(countsRes.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function loadMore() {
    if (loadingMore || rows.length >= total) return;
    setLoadingMore(true);
    const { data, error } = await supabase
      .from("meta_leads")
      .select(COLS)
      .is("deleted_at", null)
      .order("created_time", { ascending: false })
      .range(rows.length, rows.length + PAGE_SIZE - 1);
    setLoadingMore(false);
    if (error) {
      setMsg({ kind: "err", text: `Não foi possível carregar mais: ${error.message}` });
      return;
    }
    setRows((prev) => {
      const seen = new Set(prev.map((r) => r.id));
      return [...prev, ...((data ?? []) as Row[]).filter((r) => !seen.has(r.id))];
    });
  }

  async function syncNow() {
    setSyncing(true);
    setMsg(null);
    const res = await triggerMetaSync();
    setSyncing(false);
    setMsg({ kind: res.ok ? "ok" : "err", text: res.message });
    await load();
  }

  async function changeStatus(row: Row, next: string) {
    if (!isLeadStatus(next) || next === row.status) return;
    const previous = row.status;
    const known = isLeadStatus(previous);
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: next } : r)));
    if (known) setCounts((c) => ({ ...c, [previous]: Math.max(0, c[previous] - 1), [next]: c[next] + 1 }));
    setBusy(row.id);
    setMsg(null);
    const { data, error } = await supabase.from("meta_leads").update({ status: next }).eq("id", row.id).select("id");
    setBusy(null);
    if (error || !data || data.length === 0) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: previous } : r)));
      if (known) setCounts((c) => ({ ...c, [next]: Math.max(0, c[next] - 1), [previous]: c[previous] + 1 }));
      setMsg({
        kind: "err",
        text: `Não foi possível atualizar o status: ${error?.message ?? "sem permissão ou lead removido."}`,
      });
    }
  }

  async function remove(row: Row) {
    const label = row.name?.trim() || "este lead";
    if (
      !window.confirm(
        `Excluir ${label}? Nome, contato e respostas saem do painel e não voltam na próxima sincronização. ` +
          "Na Meta, o lead continua na Central de Leads até ser apagado lá.",
      )
    ) {
      return;
    }
    setBusy(row.id);
    setMsg(null);
    const { data, error } = await supabase
      .from("meta_leads")
      .update({ deleted_at: new Date().toISOString(), name: null, email: null, phone: null, city: null, answers: [] })
      .eq("id", row.id)
      .select("id");
    setBusy(null);
    if (error || !data || data.length === 0) {
      setMsg({ kind: "err", text: `Não foi possível excluir: ${error?.message ?? "sem permissão ou já removido."}` });
      return;
    }
    if (openId === row.id) setOpenId(null);
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    setTotal((t) => Math.max(0, t - 1));
    if (isLeadStatus(row.status)) setCounts((c) => ({ ...c, [row.status]: Math.max(0, c[row.status as LeadStatus] - 1) }));
  }

  const filtered = useMemo(() => rows.filter((r) => status === "all" || r.status === status), [rows, status]);
  const sync = metaSyncSummary(states);
  const hasMore = rows.length < total;

  return (
    <>
      {msg && (
        <AdminAlert kind={msg.kind} onClose={() => setMsg(null)}>
          {msg.text}
        </AdminAlert>
      )}

      <div
        style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 16px", marginBottom: 16 }}
        role="status"
      >
        <span style={{ fontSize: 13 }}>
          <strong>Sincronização com a Meta:</strong>{" "}
          <span style={{ color: TONE_COLOR[sync.tone], fontWeight: 600 }} data-testid="meta-sync-status">
            {sync.label}
          </span>
          <span className="muted"> · automática a cada 30 min</span>
        </span>
        <button
          type="button"
          className="bw-admin__btn bw-admin__btn--sm"
          onClick={() => void syncNow()}
          disabled={syncing}
        >
          <RefreshCw aria-hidden /> {syncing ? "Sincronizando…" : "Sincronizar agora"}
        </button>
        {sync.hint && (
          <p className="muted" style={{ flexBasis: "100%", margin: 0, fontSize: 12.5 }}>
            {sync.hint}
          </p>
        )}
      </div>

      <div className="bw-admin__kpi-grid">
        {LEAD_STATUSES.map((s) => (
          <div key={s} className="bw-admin__kpi-card">
            <p className="bw-admin__kpi-label">{STATUS_OPTIONS.find((o) => o.value === s)?.label}</p>
            <div className="bw-admin__kpi-value">{counts[s]}</div>
          </div>
        ))}
      </div>
      {countsError && !loading && (
        <p className="bw-admin__card-error" title={countsError} style={{ marginTop: -16, marginBottom: 16 }}>
          contagens incompletas · erro ao carregar
        </p>
      )}

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
          <div className="bw-admin__empty" role="alert" style={{ display: "grid", gap: 12, justifyItems: "center" }}>
            <p style={{ margin: 0, color: "#991B1B" }}>
              <strong>Erro ao carregar os leads da Meta.</strong>
              <br />
              <span style={{ fontSize: 13 }}>{loadError}</span>
            </p>
            <button type="button" className="bw-admin__btn bw-admin__btn--sm" onClick={() => void load()}>
              Tentar de novo
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="bw-admin__empty">
            {total === 0
              ? sync.connected
                ? "Nenhum lead de formulário da Meta nos últimos 90 dias."
                : "Os leads dos formulários do Facebook e do Instagram aparecem aqui depois que a Meta for conectada."
              : "Nenhum lead com esse filtro entre os carregados."}
          </p>
        ) : (
          <>
            {hasMore && (
              <p className="muted" style={{ padding: "10px 16px 0", margin: 0, fontSize: 12 }}>
                Exibindo {rows.length} de {total} leads.
              </p>
            )}
            <table className="bw-admin__table">
              <thead>
                <tr>
                  <th>Quem</th>
                  <th>Formulário</th>
                  <th>Campanha · anúncio</th>
                  <th>Status</th>
                  <th>Recebido</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const wa = metaWaLink(r.phone);
                  const isOpen = openId === r.id;
                  const answers = leadAnswers(r.answers);
                  const platform = platformLabel(r.platform);
                  return (
                    <React.Fragment key={r.id}>
                      <tr>
                        <td>
                          <strong>{r.name ?? "(sem nome)"}</strong>
                          {r.is_test && (
                            <span className="bw-admin__tag bw-admin__tag--warn" style={{ marginLeft: 6 }}>
                              teste
                            </span>
                          )}
                          <div className="muted" style={{ fontSize: 12 }}>
                            {displayMetaPhone(r.phone) ?? r.email ?? "—"}
                          </div>
                        </td>
                        <td className="muted">
                          {r.form_name ?? "—"}
                          {platform && <div style={{ fontSize: 12 }}>{platform}{r.is_organic ? " · orgânico" : ""}</div>}
                        </td>
                        <td className="muted" style={{ maxWidth: 260 }}>
                          {r.campaign_name ?? (r.is_organic ? "orgânico (sem anúncio)" : "—")}
                          {r.ad_name && <div style={{ fontSize: 12 }}>{r.ad_name}</div>}
                        </td>
                        <td>
                          <select
                            value={r.status}
                            onChange={(e) => void changeStatus(r, e.target.value)}
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
                        <td className="muted" style={{ whiteSpace: "nowrap" }}>
                          {fmtDate(r.created_time)}
                        </td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          {wa && (
                            <a className="bw-admin__btn bw-admin__btn--sm" href={wa} target="_blank" rel="noopener noreferrer">
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
                            {isOpen ? "fechar" : "detalhes"}
                          </button>
                          {"  "}
                          <button
                            type="button"
                            className="bw-admin__section-link"
                            style={{ background: "none", border: 0, cursor: busy === r.id ? "wait" : "pointer", color: "#b3261e" }}
                            onClick={() => void remove(r)}
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
                              <Detail label="E-mail" value={r.email} href={mailtoHref(r.email)} />
                              <Detail label="Telefone" value={displayMetaPhone(r.phone)} />
                              <Detail label="Cidade" value={r.city} />
                              {answers.map((a) => (
                                <Detail key={a.key} label={a.label} value={a.value} />
                              ))}
                              <Detail label="Formulário" value={r.form_name} />
                              <Detail label="Campanha" value={r.campaign_name} />
                              <Detail label="Conjunto" value={r.adset_name} />
                              <Detail label="Anúncio" value={r.ad_name} />
                              <Detail label="Plataforma" value={platform ? `${platform}${r.is_organic ? " · orgânico" : ""}` : null} />
                              <Detail label="Aviso ao time" value={notifySummary(r.notify)} />
                              <Detail label="Id do lead na Meta" value={r.meta_lead_id} />
                            </dl>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
        {!loading && !loadError && hasMore && (
          <div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
            <button type="button" className="bw-admin__btn bw-admin__btn--sm" onClick={() => void loadMore()} disabled={loadingMore}>
              {loadingMore ? "Carregando…" : `Carregar mais (${total - rows.length} restantes)`}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function Detail({ label, value, href }: { label: string; value: string | null | undefined; href?: string | null }) {
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
      <dd style={{ margin: 0, color: "var(--bw-ink)", overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}>
        {href ? <a href={href}>{value}</a> : value}
      </dd>
    </div>
  );
}
