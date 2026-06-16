/**
 * /admin/leads — Listagem de leads do formulário de diagnóstico.
 *
 * Fonte: tabela `leads` (alimentada pela edge function `notify-lead`,
 * chamada a partir do formulário em /diagnostico). A tabela legada
 * `diagnostic_leads` não é mais usada — ficou só por compatibilidade
 * histórica.
 *
 * Permite filtrar por status, ver origem (UTM/landing/referrer) e
 * marcar como contatado/qualificado/descartado direto da tabela.
 */
import { useEffect, useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import BewildAdminShell from "@/components/admin/BewildAdminShell";
import { supabase } from "@/integrations/supabase/client";

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
  status: string | null;
  created_at: string;
};

const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "novo", label: "Novos" },
  { value: "contatado", label: "Contatados" },
  { value: "qualificado", label: "Qualificados" },
  { value: "descartado", label: "Descartados" },
];

const STATUS_VALUES = ["novo", "contatado", "qualificado", "descartado"] as const;

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
  if (digits.length < 10) return null;
  const withCountry = digits.length === 11 || digits.length === 10 ? `55${digits}` : digits;
  return `https://wa.me/${withCountry}`;
}

export default function BewildLeadsAdminPage() {
  const [rows, setRows] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("leads")
      .select(
        "id, name, whatsapp, email, location, area_m2, objetivo, chaves, planta, message, utm_source, utm_medium, utm_campaign, referrer, landing_path, status, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(200);
    setRows((data ?? []) as Lead[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (status === "all") return rows;
    return rows.filter((r) => (r.status ?? "novo") === status);
  }, [rows, status]);

  async function changeStatus(lead: Lead, next: string) {
    if (next === (lead.status ?? "novo")) return;
    setBusy(lead.id);
    await supabase.from("leads").update({ status: next }).eq("id", lead.id);
    setBusy(null);
    load();
  }

  async function deleteLead(lead: Lead) {
    const label = lead.name?.trim() || "este lead";
    if (!window.confirm(`Excluir ${label}? Essa ação não pode ser desfeita.`)) return;
    setBusy(lead.id);
    const { error } = await supabase.from("leads").delete().eq("id", lead.id);
    setBusy(null);
    if (error) {
      window.alert(`Não foi possível excluir: ${error.message}`);
      return;
    }
    if (openId === lead.id) setOpenId(null);
    load();
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { novo: 0, contatado: 0, qualificado: 0, descartado: 0 };
    for (const r of rows) {
      const s = r.status ?? "novo";
      if (s in c) c[s] += 1;
    }
    return c;
  }, [rows]);

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
        ) : filtered.length === 0 ? (
          <p className="bw-admin__empty">
            {rows.length === 0
              ? "Nenhum lead ainda. Quando alguém enviar o formulário de /diagnostico, ele aparece aqui."
              : "Nenhum lead com esse status."}
          </p>
        ) : (
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
                  <>
                    <tr key={r.id}>
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
                          value={r.status ?? "novo"}
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
                      <tr key={`${r.id}-detail`}>
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
                  </>
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
