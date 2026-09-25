/**
 * /admin/leads — Central única de contatos recebidos pelo site.
 *
 * Fonte: tabela `leads` (alimentada pela edge function `notify-lead`,
 * chamada pelos formulários de /diagnostico, /orcamento, /contato,
 * /parceiros e das LPs /o e /p). A tabela legada `diagnostic_leads` não é
 * mais usada — ficou só por compatibilidade histórica.
 *
 * O tipo de cada lead vem de `form_path` (qual formulário foi enviado).
 * `landing_path` é só atribuição: a primeira página da sessão.
 *
 * Esta é a tela do DONO para conferir os leads. A operação comercial
 * (responder, qualificar de verdade, etc.) acontece no Bwild Engine —
 * por isso aqui não há mensagem pré-preenchida no WhatsApp nem features
 * de score/realtime.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import BewildAdminShell from "@/components/admin/BewildAdminShell";
import AdminAlert from "@/components/admin/AdminAlert";
import { supabase } from "@/integrations/supabase/client";
import {
  LEAD_ORIGEM_LABEL,
  LEAD_STATUSES,
  ZERO_STATUS_COUNTS,
  fetchLeadStatusCounts,
  isLeadStatus,
  leadFormLabel,
  leadOrigem,
  mailtoHref,
  moveStatusCount,
  updateLeadStatus,
  waLink,
  type LeadOrigem,
  type LeadStatus,
  type LeadStatusCounts,
} from "@/lib/adminLeads";

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
  form_path: string | null;
  lead_source: string | null;
  lives_in_sp: boolean | null;
  status: LeadStatus;
  created_at: string;
  // Atribuição completa (Fase 1 de conversões). Opcionais: leads antigos não têm.
  utm_term?: string | null;
  utm_content?: string | null;
  first_utm_source?: string | null;
  first_utm_medium?: string | null;
  first_utm_campaign?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  consent_marketing?: boolean | null;
};

const PAGE_SIZE = 200;

const STATUS_OPTIONS: { value: "all" | LeadStatus; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "novo", label: "Novos" },
  { value: "contatado", label: "Contatados" },
  { value: "qualificado", label: "Qualificados" },
  { value: "descartado", label: "Descartados" },
];

// Todas as colunas: as de atribuição completa aparecem quando existem, e a
// tela não quebra se a migration delas ainda não tiver rodado no banco.
const SELECT_COLS = "*";

/** "fonte · meio · campanha", pulando o que estiver vazio. */
function joinUtm(...parts: (string | null | undefined)[]): string | null {
  const s = parts.filter(Boolean).join(" · ");
  return s || null;
}

/** De onde veio o clique de anúncio (os ids em si não ajudam ninguém na tela). */
function adClickLabel(lead: Lead): string | null {
  const out: string[] = [];
  if (lead.gclid) out.push("Google Ads");
  if (lead.fbclid) out.push("Meta");
  return out.length ? out.join(" + ") : null;
}

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

const ORIGEM_OPTIONS: { value: "all" | LeadOrigem; label: string }[] = [
  { value: "all", label: "Tudo" },
  { value: "contato", label: "Mensagens (/contato)" },
  { value: "orcamento", label: "Orçamentos (/diagnostico, /orcamento, /o, /p)" },
  { value: "parceiro", label: "Parceiros (/parceiros)" },
  { value: "indicacao", label: "Indicações (/indique-um-amigo)" },
  { value: "outro", label: "Não identificado" },
];

/** Prazo de resposta combinado: 24h corridas a partir do recebimento. */
const SLA_HOURS = 24;

function slaInfo(lead: Lead): { label: string; late: boolean; done: boolean } {
  if (lead.status !== "novo") return { label: "respondido", late: false, done: true };
  const ms = Date.now() - new Date(lead.created_at).getTime();
  const h = Math.floor(ms / 3_600_000);
  if (h >= SLA_HOURS) {
    const d = Math.floor(h / 24);
    return { label: d >= 1 ? `atrasado · ${d}d` : `atrasado · ${h}h`, late: true, done: false };
  }
  return { label: `no prazo · faltam ${SLA_HOURS - h}h`, late: false, done: false };
}

export default function BewildLeadsAdminPage() {
  const [rows, setRows] = useState<Lead[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [counts, setCounts] = useState<LeadStatusCounts>(ZERO_STATUS_COUNTS);
  const [lateCount, setLateCount] = useState<number | null>(null);
  const [countsError, setCountsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ kind: "err" | "warn"; text: string } | null>(null);
  const [status, setStatus] = useState<"all" | LeadStatus>("all");
  const [origem, setOrigem] = useState<"all" | LeadOrigem>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const lateCutoff = new Date(Date.now() - SLA_HOURS * 3_600_000).toISOString();
    // Página 1 + contagens exatas (uma consulta `head` por status: o antigo
    // `select("status")` era cortado em 1000 linhas pelo PostgREST).
    const [listRes, countsRes, lateRes] = await Promise.all([
      supabase
        .from("leads")
        .select(SELECT_COLS, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1),
      fetchLeadStatusCounts(),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("status", "novo")
        .lt("created_at", lateCutoff),
    ]);

    if (listRes.error) {
      console.error("[admin/leads] falha ao carregar leads:", listRes.error);
      setLoadError(listRes.error.message || "Não foi possível carregar os leads.");
      setRows([]);
      setTotalCount(0);
      setCounts(ZERO_STATUS_COUNTS);
      setLateCount(null);
      setLoading(false);
      return;
    }

    setRows((listRes.data ?? []) as Lead[]);
    setTotalCount(listRes.count ?? listRes.data?.length ?? 0);
    setCounts(countsRes.counts);
    setLateCount(lateRes.error ? null : (lateRes.count ?? 0));
    setCountsError(countsRes.error ?? lateRes.error?.message ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
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
      setActionMsg({ kind: "err", text: `Não foi possível carregar mais: ${error.message}` });
      return;
    }
    setRows((prev) => {
      const seen = new Set(prev.map((r) => r.id));
      return [...prev, ...((data ?? []) as Lead[]).filter((r) => !seen.has(r.id))];
    });
  }

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (status === "all" || r.status === status) &&
          (origem === "all" || leadOrigem(r) === origem),
      ),
    [rows, status, origem],
  );

  async function changeStatus(lead: Lead, next: string) {
    if (!isLeadStatus(next)) return;
    const previous = lead.status;
    if (next === previous) return;
    // Status fora da lista (dado antigo/manual) não entra nas contagens.
    const known = isLeadStatus(previous);
    // Otimista: UI atualiza imediatamente; rollback em caso de erro.
    setRows((prev) => prev.map((r) => (r.id === lead.id ? { ...r, status: next } : r)));
    if (known) setCounts((prev) => moveStatusCount(prev, previous, next));
    setBusy(lead.id);
    setActionMsg(null);
    const result = await updateLeadStatus(lead.id, known ? previous : null, next);
    setBusy(null);
    if (!result.ok) {
      console.error("[admin/leads] falha ao atualizar status:", result.error);
      setRows((prev) => prev.map((r) => (r.id === lead.id ? { ...r, status: previous } : r)));
      if (known) setCounts((prev) => moveStatusCount(prev, next, previous));
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

  async function deleteLead(lead: Lead) {
    const label = lead.name?.trim() || "este lead";
    if (!window.confirm(`Excluir ${label}? Essa ação não pode ser desfeita.`)) return;
    setBusy(lead.id);
    setActionMsg(null);
    const { data, error } = await supabase.from("leads").delete().eq("id", lead.id).select("id");
    setBusy(null);
    if (error || !data || data.length === 0) {
      console.error("[admin/leads] falha ao excluir lead:", error);
      setActionMsg({
        kind: "err",
        text: `Não foi possível excluir: ${error?.message ?? "nada foi excluído (sem permissão ou já removido)."}`,
      });
      return;
    }
    if (openId === lead.id) setOpenId(null);
    // Atualiza local sem refetch completo.
    setRows((prev) => prev.filter((r) => r.id !== lead.id));
    setTotalCount((n) => Math.max(0, n - 1));
    if (isLeadStatus(lead.status)) {
      setCounts((prev) => ({ ...prev, [lead.status]: Math.max(0, prev[lead.status] - 1) }));
    }
  }

  const hasMore = rows.length < totalCount;

  return (
    <BewildAdminShell
      active="leads"
      eyebrow="Painel"
      title="Leads"
      description="Tudo que chega pelo site em um lugar só: mensagens do /contato, pedidos de orçamento (/diagnostico, /orcamento e LPs /o e /p) e parceiros, com status de resposta e prazo de 24h."
    >
      {actionMsg && (
        <AdminAlert kind={actionMsg.kind} onClose={() => setActionMsg(null)}>
          {actionMsg.text}
        </AdminAlert>
      )}

      <div className="bw-admin__kpi-grid">
        <KpiSimple label="Novos" value={counts.novo} />
        <KpiSimple label="Contatados" value={counts.contatado} />
        <KpiSimple label="Qualificados" value={counts.qualificado} />
        <KpiSimple label="Descartados" value={counts.descartado} />
        <KpiSimple label="Fora do prazo" value={lateCount} />
      </div>
      {countsError && !loading && (
        <p className="bw-admin__card-error" title={countsError} style={{ marginTop: -16, marginBottom: 16 }}>
          contagens incompletas · erro ao carregar
        </p>
      )}

      <div className="bw-admin__period" style={{ marginBottom: 10 }} role="group" aria-label="Filtro por origem">
        {ORIGEM_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={origem === opt.value ? "is-active" : ""}
            onClick={() => setOrigem(opt.value)}
            aria-pressed={origem === opt.value}
          >
            {opt.label}
          </button>
        ))}
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
            <button type="button" className="bw-admin__btn bw-admin__btn--sm" onClick={() => void load()}>
              Tentar de novo
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="bw-admin__empty">
            {totalCount === 0
              ? "Nada recebido ainda. Mensagens do /contato e pedidos de orçamento aparecem aqui."
              : hasMore
                ? "Nenhum contato com esse filtro entre os carregados. Use “Carregar mais” para buscar os mais antigos."
                : "Nenhum contato com esse filtro."}
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
                  <th>Tipo</th>
                  <th>Imóvel / mensagem</th>
                  <th>Status</th>
                  <th>Prazo</th>
                  <th>Recebido</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const wa = waLink(r.whatsapp);
                  const isOpen = openId === r.id;
                  const org = leadOrigem(r);
                  const sla = slaInfo(r);
                  return (
                    <React.Fragment key={r.id}>
                      <tr>
                        <td>
                          <strong>{r.name ?? "(sem nome)"}</strong>
                          <div className="muted" style={{ fontSize: 12 }}>
                            {r.whatsapp ?? r.email ?? "—"}
                          </div>
                        </td>
                        <td className="muted" style={{ whiteSpace: "nowrap" }} title={leadFormLabel(r)}>
                          {LEAD_ORIGEM_LABEL[org]}
                        </td>
                        <td className="muted">
                          {org === "contato"
                            ? r.message?.trim().slice(0, 120) || "—"
                            : [r.objetivo, r.location, r.area_m2 ? `${r.area_m2}m²` : null]
                                .filter(Boolean)
                                .join(" · ") ||
                              r.message?.trim().slice(0, 120) ||
                              "—"}
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
                        <td style={{ whiteSpace: "nowrap" }}>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: sla.done ? "#15803D" : sla.late ? "#B3261E" : "var(--bw-muted)",
                            }}
                          >
                            {sla.label}
                          </span>
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
                            onClick={() => void deleteLead(r)}
                            disabled={busy === r.id}
                            aria-label={`Excluir ${r.name ?? "lead"}`}
                          >
                            excluir
                          </button>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr>
                          <td colSpan={7} style={{ background: "#FBFAF5", fontSize: 13 }}>
                            <dl
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                gap: "10px 24px",
                                margin: 0,
                              }}
                            >
                              <DetailItem label="Formulário" value={leadFormLabel(r)} />
                              <DetailItem label="E-mail" value={r.email} href={mailtoHref(r.email)} />
                              <DetailItem label="Localização" value={r.location} />
                              <DetailItem label="Metragem" value={r.area_m2 ? `${r.area_m2} m²` : null} />
                              <DetailItem label="Objetivo" value={r.objetivo} />
                              <DetailItem label="Como conheceu" value={r.lead_source} />
                              <DetailItem label="Mora em SP capital" value={r.lives_in_sp === null ? null : r.lives_in_sp ? "Sim" : "Não"} />
                              <DetailItem label="Chaves" value={r.chaves} />
                              <DetailItem label="Planta" value={r.planta} />
                              <DetailItem label="1ª página da sessão" value={r.landing_path} />
                              <DetailItem label="Referrer" value={r.referrer} />
                              <DetailItem
                                label="UTM"
                                value={joinUtm(r.utm_source, r.utm_medium, r.utm_campaign)}
                              />
                              <DetailItem label="Termo · conteúdo" value={joinUtm(r.utm_term, r.utm_content)} />
                              <DetailItem
                                label="1º toque"
                                value={
                                  joinUtm(r.first_utm_source, r.first_utm_medium, r.first_utm_campaign) !==
                                  joinUtm(r.utm_source, r.utm_medium, r.utm_campaign)
                                    ? joinUtm(r.first_utm_source, r.first_utm_medium, r.first_utm_campaign)
                                    : null
                                }
                              />
                              <DetailItem label="Clique de anúncio" value={adClickLabel(r)} />
                              <DetailItem
                                label="Cookies de marketing"
                                value={
                                  r.consent_marketing == null
                                    ? null
                                    : r.consent_marketing
                                      ? "aceitos"
                                      : "recusados — não vai para Meta nem Google Ads"
                                }
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
          </>
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

function KpiSimple({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="bw-admin__kpi-card">
      <p className="bw-admin__kpi-label">{label}</p>
      <div className={"bw-admin__kpi-value" + (value === null ? " bw-admin__kpi-empty" : "")}>
        {value === null ? "—" : value}
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  href,
}: {
  label: string;
  value: string | null;
  href?: string | null;
}) {
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
      <dd style={{ margin: 0, color: "var(--bw-ink)", overflowWrap: "anywhere" }}>
        {href ? <a href={href}>{value}</a> : value}
      </dd>
    </div>
  );
}
