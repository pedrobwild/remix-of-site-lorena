import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

type LeadStatus = "novo" | "contatado" | "qualificado" | "perdido" | "ganho";

type Lead = {
  id: string;
  name: string;
  whatsapp: string;
  email: string | null;
  neighborhood: string | null;
  square_meters: number | null;
  property_type: string | null;
  timeframe: string | null;
  budget_range: string | null;
  scope: string[] | null;
  message: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  landing_path: string | null;
  user_agent: string | null;
  status: LeadStatus;
  internal_notes: string | null;
  created_at: string;
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  novo: "Novo",
  contatado: "Contatado",
  qualificado: "Qualificado",
  ganho: "Ganho",
  perdido: "Perdido",
};

const STATUS_OPTIONS: LeadStatus[] = ["novo", "contatado", "qualificado", "ganho", "perdido"];

function fmtPhone(d: string) {
  const digits = d.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return d;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"todos" | LeadStatus>("todos");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [notes, setNotes] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("diagnostic_leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (!error) setLeads((data ?? []) as Lead[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setNotes(selected?.internal_notes ?? "");
  }, [selected?.id]);

  const filtered = useMemo(
    () => (filter === "todos" ? leads : leads.filter((l) => l.status === filter)),
    [leads, filter]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: leads.length };
    for (const s of STATUS_OPTIONS) c[s] = 0;
    for (const l of leads) c[l.status] = (c[l.status] ?? 0) + 1;
    return c;
  }, [leads]);

  async function updateStatus(id: string, status: LeadStatus) {
    const { error } = await supabase.from("diagnostic_leads").update({ status }).eq("id", id);
    if (!error) {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
      setSelected((s) => (s && s.id === id ? { ...s, status } : s));
    }
  }

  async function saveNotes() {
    if (!selected) return;
    const { error } = await supabase
      .from("diagnostic_leads")
      .update({ internal_notes: notes })
      .eq("id", selected.id);
    if (!error) {
      setLeads((prev) =>
        prev.map((l) => (l.id === selected.id ? { ...l, internal_notes: notes } : l))
      );
      setSelected((s) => (s ? { ...s, internal_notes: notes } : s));
    }
  }

  async function removeLead(id: string) {
    if (!window.confirm("Excluir este lead? Esta ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("diagnostic_leads").delete().eq("id", id);
    if (!error) {
      setLeads((prev) => prev.filter((l) => l.id !== id));
      setSelected(null);
    }
  }

  function exportCsv() {
    const headers = [
      "created_at","name","whatsapp","email","neighborhood","square_meters",
      "property_type","timeframe","status","utm_source","utm_medium","utm_campaign",
      "referrer","landing_path","message","internal_notes",
    ];
    const rows = leads.map((l) =>
      headers.map((h) => {
        const v = (l as unknown as Record<string, unknown>)[h];
        if (v == null) return "";
        const s = Array.isArray(v) ? v.join("|") : String(v);
        return `"${s.replace(/"/g, '""')}"`;
      }).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminLayout
      active="leads"
      title="Leads do diagnóstico"
      description="Solicitações enviadas pelo formulário em /diagnostico."
      actions={
        <button type="button" className="admin-btn admin-btn--ghost" onClick={exportCsv}>
          Exportar CSV
        </button>
      }
    >
      <section className="admin-section">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          <FilterChip
            active={filter === "todos"}
            label={`Todos (${counts.todos})`}
            onClick={() => setFilter("todos")}
          />
          {STATUS_OPTIONS.map((s) => (
            <FilterChip
              key={s}
              active={filter === s}
              label={`${STATUS_LABELS[s]} (${counts[s] ?? 0})`}
              onClick={() => setFilter(s)}
            />
          ))}
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Recebido</th>
                <th>Nome</th>
                <th>WhatsApp</th>
                <th>Bairro / m²</th>
                <th>Origem</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="mono" style={{ opacity: 0.6 }}>carregando…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="mono" style={{ opacity: 0.6 }}>nenhum lead nesse filtro</td></tr>
              )}
              {filtered.map((l) => (
                <tr key={l.id}>
                  <td className="mono">{new Date(l.created_at).toLocaleString("pt-BR")}</td>
                  <td><strong>{l.name}</strong></td>
                  <td className="mono">
                    <a
                      href={`https://wa.me/${l.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-link"
                    >
                      {fmtPhone(l.whatsapp)}
                    </a>
                  </td>
                  <td>
                    {l.neighborhood || "—"}
                    {l.square_meters ? ` · ${l.square_meters}m²` : ""}
                  </td>
                  <td className="mono" style={{ fontSize: 12 }}>
                    {l.utm_source || l.referrer || "direto"}
                  </td>
                  <td>
                    <select
                      value={l.status}
                      onChange={(e) => updateStatus(l.id, e.target.value as LeadStatus)}
                      className="admin-input"
                      style={{ padding: "4px 8px", fontSize: 12 }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      className="admin-link"
                      onClick={() => setSelected(l)}
                    >
                      ver →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <>
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setSelected(null)}
            style={{
              position: "fixed", inset: 0, background: "rgba(10,37,64,0.45)",
              border: 0, padding: 0, cursor: "pointer", zIndex: 50,
            }}
          />
          <aside
            role="dialog"
            aria-label="Detalhes do lead"
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0, width: "min(520px, 100%)",
              background: "#fff", zIndex: 51, overflowY: "auto", padding: 24,
              boxShadow: "-20px 0 60px -20px rgba(10,37,64,0.4)",
            }}
          >
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
              <div>
                <p className="mono" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".18em", opacity: .6 }}>
                  {new Date(selected.created_at).toLocaleString("pt-BR")}
                </p>
                <h2 style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>{selected.name}</h2>
              </div>
              <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setSelected(null)}>fechar</button>
            </header>

            <div style={{ display: "grid", gap: 12, fontSize: 14 }}>
              <Row label="WhatsApp">
                <a
                  className="admin-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://wa.me/${selected.whatsapp.replace(/\D/g, "")}`}
                >
                  {fmtPhone(selected.whatsapp)} →
                </a>
              </Row>
              <Row label="E-mail">{selected.email || "—"}</Row>
              <Row label="Bairro">{selected.neighborhood || "—"}</Row>
              <Row label="Metragem">{selected.square_meters ? `${selected.square_meters} m²` : "—"}</Row>
              <Row label="Objetivo">{selected.property_type || "—"}</Row>
              <Row label="Recebeu chaves">{selected.timeframe || "—"}</Row>
              <Row label="Escopo">{selected.scope?.length ? selected.scope.join(", ") : "—"}</Row>
              <Row label="Mensagem">
                <p style={{ whiteSpace: "pre-wrap" }}>{selected.message || "—"}</p>
              </Row>
              <Row label="Origem">
                {selected.utm_source ? (
                  <span className="mono" style={{ fontSize: 12 }}>
                    {selected.utm_source} / {selected.utm_medium || "—"} / {selected.utm_campaign || "—"}
                  </span>
                ) : selected.referrer ? (
                  <span className="mono" style={{ fontSize: 12 }}>{selected.referrer}</span>
                ) : (
                  "direto"
                )}
              </Row>
              <Row label="Landing">{selected.landing_path || "—"}</Row>

              <div>
                <label className="mono" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".18em", opacity: .6 }}>
                  Notas internas
                </label>
                <textarea
                  className="admin-input"
                  rows={5}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: "100%", marginTop: 4 }}
                />
                <button type="button" className="admin-btn" onClick={saveNotes} style={{ marginTop: 8 }}>
                  Salvar notas
                </button>
              </div>

              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between" }}>
                <button
                  type="button"
                  className="admin-link"
                  style={{ color: "#b91c1c" }}
                  onClick={() => removeLead(selected.id)}
                >
                  excluir lead
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </AdminLayout>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 12, alignItems: "start" }}>
      <span className="mono" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".18em", opacity: .6 }}>{label}</span>
      <div>{children}</div>
    </div>
  );
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mono"
      style={{
        padding: "6px 14px",
        borderRadius: 999,
        border: "1px solid",
        borderColor: active ? "#004C7F" : "#e5e7eb",
        background: active ? "#004C7F" : "#fff",
        color: active ? "#fff" : "#0A2540",
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: ".18em",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
