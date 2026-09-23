import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  id: string;
  partner_name: string;
  partner_type: string | null;
  company: string | null;
  document: string | null;
  whatsapp: string;
  email: string | null;
  region: string | null;
  units: string | null;
  origin: string | null;
  message: string | null;
  client_name: string | null;
  status: string;
  commission_status: string;
  contract_value: number | null;
  commission_amount: number | null;
  internal_notes: string | null;
  confirmed_at: string | null;
  created_at: string;
};

const STATUS = [
  { v: "nova", label: "Nova" },
  { v: "em_contato", label: "Em contato" },
  { v: "proposta", label: "Proposta enviada" },
  { v: "fechada", label: "Contrato fechado" },
  { v: "perdida", label: "Perdida" },
];

const COMISSAO = [
  { v: "pendente", label: "Pendente" },
  { v: "confirmada", label: "Confirmada" },
  { v: "paga", label: "Paga" },
  { v: "nao_aplicavel", label: "Não se aplica" },
];

const brl = (n: number | null) =>
  n == null
    ? "—"
    : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default function IndicacoesAdminPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<string>("todas");
  const [busca, setBusca] = useState("");
  const [aberta, setAberta] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("partner_referrals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    setLoading(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setErro(null);
    setRows((data ?? []) as Row[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function patch(id: string, values: Partial<Row>) {
    setBusy(id);
    const { error } = await supabase
      .from("partner_referrals")
      .update(values)
      .eq("id", id);
    setBusy(null);
    if (error) {
      alert("Não foi possível salvar: " + error.message);
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...values } : r)));
  }

  async function confirmarComissao(r: Row) {
    const valor = prompt(
      `Valor da comissão para ${r.partner_name} (somente números, ex.: 3500)`,
      r.commission_amount != null ? String(r.commission_amount) : "",
    );
    if (valor === null) return;
    const numero = Number(valor.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(numero) || numero < 0) {
      alert("Informe um valor válido.");
      return;
    }
    await patch(r.id, {
      commission_amount: numero,
      commission_status: "confirmada",
      confirmed_at: new Date().toISOString(),
    });
  }

  const filtradas = useMemo(() => {
    const s = busca.trim().toLowerCase();
    return rows.filter((r) => {
      if (filtro !== "todas" && r.status !== filtro) return false;
      if (!s) return true;
      return [r.partner_name, r.company, r.whatsapp, r.email, r.region, r.client_name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s));
    });
  }, [rows, filtro, busca]);

  const totalConfirmado = rows
    .filter((r) => r.commission_status === "confirmada" || r.commission_status === "paga")
    .reduce((acc, r) => acc + (r.commission_amount ?? 0), 0);
  const totalPago = rows
    .filter((r) => r.commission_status === "paga")
    .reduce((acc, r) => acc + (r.commission_amount ?? 0), 0);

  return (
    <AdminLayout
      active="indicacoes"
      title="Indicações"
      description="Solicitações recebidas na página de parceiros e confirmação das comissões."
      actions={
        <button className="admin-btn" onClick={load} disabled={loading}>
          Atualizar
        </button>
      }
    >
      <div className="admin-cards" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div className="admin-card" style={{ padding: 12, minWidth: 160 }}>
          <div className="mono" style={{ opacity: 0.6, fontSize: 12 }}>Solicitações</div>
          <strong className="num" style={{ fontSize: 22 }}>{rows.length}</strong>
        </div>
        <div className="admin-card" style={{ padding: 12, minWidth: 160 }}>
          <div className="mono" style={{ opacity: 0.6, fontSize: 12 }}>Comissões confirmadas</div>
          <strong className="num" style={{ fontSize: 22 }}>{brl(totalConfirmado)}</strong>
        </div>
        <div className="admin-card" style={{ padding: 12, minWidth: 160 }}>
          <div className="mono" style={{ opacity: 0.6, fontSize: 12 }}>Comissões pagas</div>
          <strong className="num" style={{ fontSize: 22 }}>{brl(totalPago)}</strong>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <input
          className="admin-input"
          placeholder="Buscar por nome, empresa, WhatsApp…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ flex: "1 1 220px", minWidth: 0 }}
        />
        <select
          className="admin-input"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        >
          <option value="todas">Todas as situações</option>
          {STATUS.map((s) => (
            <option key={s.v} value={s.v}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="mono">carregando…</p>}
      {erro && <p className="mono">Não foi possível carregar: {erro}</p>}
      {!loading && !erro && filtradas.length === 0 && (
        <p className="mono">Nenhuma solicitação por aqui ainda.</p>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {filtradas.map((r) => {
          const open = aberta === r.id;
          return (
            <article key={r.id} className="admin-card" style={{ padding: 14 }}>
              <header
                style={{ display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}
              >
                <strong style={{ fontSize: 16 }}>{r.partner_name}</strong>
                <span className="mono" style={{ opacity: 0.7, fontSize: 12 }}>
                  {r.partner_type ?? "—"} · {r.company || "sem empresa"} · {dataHora(r.created_at)}
                </span>
                <button
                  className="admin-btn"
                  style={{ marginLeft: "auto" }}
                  onClick={() => setAberta(open ? null : r.id)}
                >
                  {open ? "Fechar" : "Detalhes"}
                </button>
              </header>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  alignItems: "center",
                  marginTop: 10,
                }}
              >
                <select
                  className="admin-input"
                  value={r.status}
                  disabled={busy === r.id}
                  onChange={(e) => patch(r.id, { status: e.target.value })}
                >
                  {STATUS.map((s) => (
                    <option key={s.v} value={s.v}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <select
                  className="admin-input"
                  value={r.commission_status}
                  disabled={busy === r.id}
                  onChange={(e) =>
                    patch(r.id, {
                      commission_status: e.target.value,
                      confirmed_at:
                        e.target.value === "pendente" ? null : r.confirmed_at ?? new Date().toISOString(),
                    })
                  }
                >
                  {COMISSAO.map((s) => (
                    <option key={s.v} value={s.v}>
                      Comissão: {s.label}
                    </option>
                  ))}
                </select>
                <span className="num" style={{ fontSize: 14 }}>
                  {brl(r.commission_amount)}
                </span>
                <button
                  className="admin-btn"
                  disabled={busy === r.id}
                  onClick={() => confirmarComissao(r)}
                >
                  Confirmar comissão
                </button>
                <a
                  className="admin-btn"
                  href={`https://wa.me/${r.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
              </div>

              {open && (
                <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                  <p className="mono" style={{ fontSize: 13, opacity: 0.85 }}>
                    WhatsApp: {r.whatsapp} · E-mail: {r.email || "—"} · Região: {r.region || "—"} ·
                    Volume: {r.units || "—"} · Como conheceu: {r.origin || "—"}
                  </p>
                  {r.message && (
                    <p style={{ whiteSpace: "pre-wrap", fontSize: 14 }}>{r.message}</p>
                  )}
                  <label className="mono" style={{ fontSize: 12 }}>
                    Cliente indicado
                    <input
                      className="admin-input"
                      defaultValue={r.client_name ?? ""}
                      onBlur={(e) =>
                        e.target.value !== (r.client_name ?? "") &&
                        patch(r.id, { client_name: e.target.value || null })
                      }
                    />
                  </label>
                  <label className="mono" style={{ fontSize: 12 }}>
                    Valor do contrato (R$)
                    <input
                      className="admin-input"
                      inputMode="decimal"
                      defaultValue={r.contract_value ?? ""}
                      onBlur={(e) => {
                        const n = Number(e.target.value.replace(/\./g, "").replace(",", "."));
                        const value = e.target.value.trim() === "" ? null : n;
                        if (value !== null && !Number.isFinite(value)) return;
                        if (value !== r.contract_value) patch(r.id, { contract_value: value });
                      }}
                    />
                  </label>
                  <label className="mono" style={{ fontSize: 12 }}>
                    Observações internas
                    <textarea
                      className="admin-input"
                      rows={3}
                      defaultValue={r.internal_notes ?? ""}
                      onBlur={(e) =>
                        e.target.value !== (r.internal_notes ?? "") &&
                        patch(r.id, { internal_notes: e.target.value || null })
                      }
                    />
                  </label>
                  {r.confirmed_at && (
                    <p className="mono" style={{ fontSize: 12, opacity: 0.7 }}>
                      Comissão confirmada em {dataHora(r.confirmed_at)}
                    </p>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </AdminLayout>
  );
}
