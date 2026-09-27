/**
 * RealtimeTab — aba "Tempo real".
 * Visitas por dia, páginas visitadas e origens (Google, Mapa, redes sociais…),
 * atualizado ao vivo via Realtime em analytics_events + RPC analytics_live_panel.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { devError } from "@/lib/devLog";

type Panel = {
  live_now: number;
  today_visitors: number;
  total_visitors: number;
  total_pageviews: number;
  daily: { day: string; visitors: number; pageviews: number }[];
  pages: { path: string; visitors: number; pageviews: number }[];
  sources: { source: string; visitors: number }[];
};

const fmt = (n: number) => Math.round(n).toLocaleString("pt-BR");
const fmtDay = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

export default function RealtimeTab() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Panel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    // A função é nova e não está em types.ts gerado.
    const { data: res, error: err } = await (supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: Panel | null; error: { message: string } | null }>)("analytics_live_panel", { p_days: days });
    if (err) {
      devError("[realtime] panel", err);
      setError("Não foi possível carregar as visitas.");
      return;
    }
    setError(null);
    setData(res);
    setUpdatedAt(new Date());
  }, [days]);

  useEffect(() => {
    setData(null);
    load();
    const schedule = () => {
      if (timer.current) return;
      timer.current = setTimeout(() => {
        timer.current = null;
        load();
      }, 2000);
    };
    const ch = supabase
      .channel("admin-analytics-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "analytics_events" }, schedule)
      .subscribe();
    const poll = setInterval(load, 60_000); // garante "ao vivo" caindo mesmo sem novos eventos
    return () => {
      supabase.removeChannel(ch);
      clearInterval(poll);
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    };
  }, [load]);

  if (error) return <div className="aa-empty">{error}</div>;
  if (!data) return <div className="aa-empty">Carregando visitas…</div>;

  const maxSource = Math.max(1, ...data.sources.map((s) => s.visitors));
  const totalSrc = data.sources.reduce((a, s) => a + s.visitors, 0) || 1;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span aria-live="polite" style={{ fontSize: 13, color: "var(--aa-fg-muted, inherit)" }}>
          ● Atualiza sozinho{updatedAt ? ` · última às ${updatedAt.toLocaleTimeString("pt-BR")}` : ""}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              className="aa-card__action"
              aria-pressed={days === d}
              style={{ fontWeight: days === d ? 700 : 400, minHeight: 36, padding: "0 10px" }}
              onClick={() => setDays(d)}
            >
              {d} dias
            </button>
          ))}
        </div>
      </div>

      <div className="aa-kpi-grid">
        <div className="aa-kpi">
          <div className="aa-kpi__label">No site agora (5 min)</div>
          <div className="aa-kpi__value">{fmt(data.live_now)}</div>
        </div>
        <div className="aa-kpi">
          <div className="aa-kpi__label">Pessoas hoje</div>
          <div className="aa-kpi__value">{fmt(data.today_visitors)}</div>
        </div>
        <div className="aa-kpi">
          <div className="aa-kpi__label">Pessoas em {days} dias</div>
          <div className="aa-kpi__value">{fmt(data.total_visitors)}</div>
        </div>
        <div className="aa-kpi">
          <div className="aa-kpi__label">Páginas vistas</div>
          <div className="aa-kpi__value">{fmt(data.total_pageviews)}</div>
        </div>
      </div>

      <section className="aa-card">
        <div className="aa-card__head"><h3 className="aa-card__title">Visitas por dia</h3></div>
        {data.daily.length === 0 ? (
          <div className="aa-empty">Nenhuma visita no período.</div>
        ) : (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={data.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--aa-line, #e5e5e5)" vertical={false} />
                <XAxis dataKey="day" tickFormatter={fmtDay} fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} width={36} />
                <Tooltip
                  labelFormatter={(d) => fmtDay(String(d))}
                  formatter={(v, n) => [fmt(Number(v)), n === "visitors" ? "Pessoas" : "Páginas vistas"]}
                />
                <Bar dataKey="visitors" fill="var(--aa-accent, #2F86B8)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))" }}>
        <section className="aa-card">
          <div className="aa-card__head"><h3 className="aa-card__title">De onde vêm</h3></div>
          {data.sources.length === 0 ? (
            <div className="aa-empty">Sem dados.</div>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
              {data.sources.map((s) => (
                <li key={s.source}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span>{s.source}</span>
                    <span className="num">{fmt(s.visitors)} · {Math.round((s.visitors / totalSrc) * 100)}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "var(--aa-line, #eee)", marginTop: 4 }}>
                    <div style={{ width: `${(s.visitors / maxSource) * 100}%`, height: "100%", borderRadius: 3, background: "var(--aa-accent, #2F86B8)" }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="aa-card">
          <div className="aa-card__head"><h3 className="aa-card__title">Páginas mais visitadas</h3></div>
          {data.pages.length === 0 ? (
            <div className="aa-empty">Sem dados.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="aa-table" style={{ width: "100%" }}>
                <thead><tr><th>Página</th><th style={{ textAlign: "right" }}>Pessoas</th><th style={{ textAlign: "right" }}>Vistas</th></tr></thead>
                <tbody>
                  {data.pages.map((p) => (
                    <tr key={p.path}>
                      <td style={{ wordBreak: "break-all" }}>{p.path}</td>
                      <td style={{ textAlign: "right" }}>{fmt(p.visitors)}</td>
                      <td style={{ textAlign: "right" }}>{fmt(p.pageviews)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
