/**
 * LeadsTrafficPanel — aba "Tráfego" de /admin/leads.
 *
 * Acompanha de onde vêm os pedidos de orçamento (/diagnostico, /orcamento e
 * LPs /o e /p): gráfico de origens (Google Ads, Meta, busca orgânica, redes,
 * direto) e ranking de bairros. Só leitura; a regra de canal é a mesma do
 * filtro da lista (src/lib/leadSource.ts).
 */
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import AdminAlert from "@/components/admin/AdminAlert";
import { DIAGNOSTICO_FORMS, leadFormOrFilter } from "@/lib/adminLeads";
import { buildBairroData, buildOrigemData, type TrafficLead } from "@/lib/leadsTraffic";
import type { LeadCanal } from "@/lib/leadSource";

const PAGE = 1000; // teto do PostgREST — paginar com .range até acabar

/** Paleta por canal, nos tokens do painel (fallbacks da identidade Bewild). */
const CANAL_COR: Record<LeadCanal, string> = {
  google_ads: "var(--bw-navy, #11355B)",
  meta: "var(--bw-sky, #2F5E85)",
  organico: "#2F86B8",
  social: "#C99A3C",
  direto: "#8A93A3",
};

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; rows: TrafficLead[] };

export default function LeadsTrafficPanel() {
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const filtro = leadFormOrFilter(DIAGNOSTICO_FORMS);
      const rows: TrafficLead[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
          .from("leads")
          .select("id, location, gclid, fbclid, utm_source, utm_medium, first_utm_source, first_utm_medium, referrer")
          .or(filtro)
          .order("created_at", { ascending: false })
          .range(from, from + PAGE - 1);
        if (error) {
          console.error("[admin/leads/trafego] falha ao carregar:", error);
          if (!cancelled) {
            setState({ kind: "error", message: error.message || "Não foi possível carregar o tráfego." });
          }
          return;
        }
        rows.push(...((data ?? []) as TrafficLead[]));
        if (!data || data.length < PAGE) break;
      }
      if (!cancelled) setState({ kind: "ready", rows });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "loading") {
    return (
      <div className="bw-admin__kpi-card" role="status" aria-live="polite">
        <p className="bw-admin__kpi-label">Tráfego do /orcamento</p>
        <div className="bw-admin__kpi-value bw-admin__kpi-empty">Carregando…</div>
      </div>
    );
  }

  if (state.kind === "error") {
    return <AdminAlert kind="err">{state.message}</AdminAlert>;
  }

  const { rows } = state;
  const origens = buildOrigemData(rows);
  const bairros = buildBairroData(rows, 10);
  const total = rows.length;

  if (total === 0) {
    return (
      <div className="bw-admin__kpi-card">
        <p className="bw-admin__kpi-label">Tráfego do /orcamento</p>
        <div className="bw-admin__kpi-value bw-admin__kpi-empty">
          Nenhum pedido de orçamento até agora.
        </div>
      </div>
    );
  }

  return (
    <section aria-label="Tráfego dos pedidos de orçamento">
      <div className="bw-admin__kpi-grid" style={{ marginBottom: 18 }}>
        <div className="bw-admin__kpi-card">
          <p className="bw-admin__kpi-label">Pedidos de orçamento</p>
          <div className="bw-admin__kpi-value">{total}</div>
        </div>
        <div className="bw-admin__kpi-card">
          <p className="bw-admin__kpi-label">Bairros distintos</p>
          <div className="bw-admin__kpi-value">
            {bairros.filter((b) => b.bairro !== "Outros" && b.bairro !== "Não informado").length}
          </div>
        </div>
        <div className="bw-admin__kpi-card">
          <p className="bw-admin__kpi-label">Origem principal</p>
          <div className="bw-admin__kpi-value" style={{ fontSize: 18 }}>
            {[...origens].sort((a, b) => b.leads - a.leads)[0]?.label ?? "—"}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        }}
      >
        <div className="bw-admin__kpi-card">
          <p className="bw-admin__kpi-label">Origens dos pedidos</p>
          <div style={{ width: "100%", height: 280 }} role="img" aria-label="Gráfico de origens dos pedidos de orçamento">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={origens}
                  dataKey="leads"
                  nameKey="label"
                  innerRadius="55%"
                  outerRadius="85%"
                  paddingAngle={2}
                  isAnimationActive={false}
                >
                  {origens.map((o) => (
                    <Cell key={o.canal} fill={CANAL_COR[o.canal]} />
                  ))}
                  <LabelList
                    dataKey="leads"
                    position="outside"
                    formatter={(v: unknown) => String(v)}
                    style={{ fill: "var(--bw-ink)", fontSize: 12 }}
                  />
                </Pie>
                <Tooltip
                  formatter={(value: unknown, name: unknown) => [`${value} leads`, String(name)]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0, display: "grid", gap: 6 }}>
            {origens.map((o) => (
              <li
                key={o.canal}
                style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--bw-ink)" }}
              >
                <span
                  aria-hidden
                  style={{ width: 10, height: 10, borderRadius: 2, background: CANAL_COR[o.canal], flex: "none" }}
                />
                <span style={{ flex: 1 }}>{o.label}</span>
                <strong>
                  {o.leads} ({Math.round((o.leads / total) * 100)}%)
                </strong>
              </li>
            ))}
          </ul>
        </div>

        <div className="bw-admin__kpi-card">
          <p className="bw-admin__kpi-label">Leads por bairro</p>
          <div style={{ width: "100%", height: Math.max(280, bairros.length * 34) }} role="img" aria-label="Gráfico de leads por bairro">
            <ResponsiveContainer>
              <BarChart data={bairros} layout="vertical" margin={{ left: 8, right: 32 }}>
                <CartesianGrid stroke="var(--bw-line)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "var(--bw-muted)" }} />
                <YAxis
                  type="category"
                  dataKey="bairro"
                  width={130}
                  tick={{ fontSize: 12, fill: "var(--bw-ink)" }}
                />
                <Tooltip formatter={(value: unknown) => [`${value} leads`, "Leads"]} />
                <Bar dataKey="leads" fill="var(--bw-navy, #11355B)" radius={[0, 3, 3, 0]} isAnimationActive={false}>
                  <LabelList
                    dataKey="leads"
                    position="right"
                    style={{ fill: "var(--bw-ink)", fontSize: 12 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
