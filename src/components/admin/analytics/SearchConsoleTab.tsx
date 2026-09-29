/**
 * SearchConsoleTab — aba "Busca do Google" do Analytics.
 * Lê cliques, impressões, CTR e posição do Search Console pela edge function
 * `search-console-stats` (só admin). Os dados do Google chegam com ~2 dias de atraso.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { DateRange } from "./types";

type Row = { key: string; clicks: number; impressions: number; ctr: number; position: number };
type Payload = { rows: Row[]; totals: Omit<Row, "key">; start_date: string; end_date: string };

const nf = new Intl.NumberFormat("pt-BR");
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const pos = (v: number) => (v ? v.toFixed(1) : "—");
const fmtDay = (iso: string) => iso.split("-").reverse().join("/");

function daysOf(range: DateRange) {
  return Math.max(1, Math.min(180, Math.round((Date.now() - range.from.getTime()) / 86_400_000)));
}

export default function SearchConsoleTab({ range }: { range: DateRange }) {
  const [pages, setPages] = useState<Payload | null>(null);
  const [queries, setQueries] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const days = daysOf(range);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [p, q] = await Promise.all([
      supabase.functions.invoke("search-console-stats", { body: { days, dimension: "page", rowLimit: 20 } }),
      supabase.functions.invoke("search-console-stats", { body: { days, dimension: "query", rowLimit: 20 } }),
    ]);
    if (p.error || q.error) setError("Não foi possível ler o Search Console.");
    else {
      setPages(p.data as Payload);
      setQueries(q.data as Payload);
    }
    setLoading(false);
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !pages) {
    return (
      <div className="aa-grid">
        <div className="aa-col-12 aa-skel" style={{ height: 92 }} />
        <div className="aa-col-12 aa-skel" style={{ height: 300 }} />
      </div>
    );
  }
  if (error || !pages || !queries) {
    return (
      <div className="aa-card">
        <div className="aa-empty">
          <span className="aa-empty__icon">!</span>
          {error ?? "sem dados"} <button type="button" onClick={load}>tentar de novo</button>
        </div>
      </div>
    );
  }

  const t = pages.totals;
  const kpis = [
    { label: "cliques na busca", value: nf.format(t.clicks) },
    { label: "impressões", value: nf.format(t.impressions) },
    { label: "CTR", value: pct(t.ctr) },
    { label: "posição média", value: pos(t.position) },
  ];

  const table = (title: string, first: string, rows: Row[], isPage: boolean) => (
    <div className="aa-card">
      <div className="aa-card__head"><h3 className="aa-card__title">{title}</h3></div>
      {rows.length === 0 ? (
        <div className="aa-empty"><span className="aa-empty__icon">∅</span>nenhum dado informado pelo Google no período</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="aa-table">
            <thead><tr><th>{first}</th><th>cliques</th><th>impressões</th><th>CTR</th><th>posição</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <td style={{ wordBreak: "break-word" }}>{isPage ? r.key.replace(/^https?:\/\/(www\.)?bewild\.com\.br/, "") || "/" : r.key}</td>
                  <td className="num">{nf.format(r.clicks)}</td>
                  <td className="num">{nf.format(r.impressions)}</td>
                  <td className="num">{pct(r.ctr)}</td>
                  <td className="num">{pos(r.position)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <p className="aa-faint" style={{ fontSize: "var(--aa-text-xs)", margin: 0 }}>
        {fmtDay(pages.start_date)} a {fmtDay(pages.end_date)} · o Google leva cerca de 2 dias para mostrar os dados ·{" "}
        <button type="button" onClick={load} disabled={loading}>{loading ? "atualizando…" : "atualizar"}</button>
      </p>
      <div className="aa-kpi-grid">
        {kpis.map((k) => (
          <div key={k.label} className="aa-kpi">
            <span className="aa-kpi__label">{k.label}</span>
            <span className="aa-kpi__value num">{k.value}</span>
          </div>
        ))}
      </div>
      {table("principais buscas", "busca", queries.rows, false)}
      {table("páginas mais vistas na busca", "página", pages.rows, true)}
    </div>
  );
}
