/**
 * TodayVsYesterdayCard — bloco "Hoje × ontem" da Visão geral (/admin/dashboard).
 *
 * Hoje só tem dados até agora; comparar com ontem INTEIRO faria o dia parecer
 * sempre pior. A base da variação é ontem ATÉ O MESMO HORÁRIO
 * (lib/analyticsCompare.ts); o total de ontem aparece como referência.
 *
 * Fontes (as mesmas dos outros cards): sessões, visitantes e pageviews da RPC
 * `analytics_overview_kpis`; leads da tabela `leads`. Nada é estimado — cada
 * consulta confere o `{ error }` e mostra "—" quando falha.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtLocalDay } from "@/lib/analyticsTimeseries";
import {
  formatWindowLabel,
  invertDir,
  todaySoFarWindow,
  trend,
  yesterdayFullWindow,
  yesterdaySameTimeWindow,
  type Window,
} from "@/lib/analyticsCompare";

type Snapshot = {
  sessions: number;
  unique_visitors: number;
  pageviews: number;
  leads: number | null;
};

type Loaded = {
  fetchedAt: Date;
  today: Snapshot;
  yesterdaySameTime: Snapshot;
  yesterdayFull: Snapshot;
};

type MetricKey = keyof Snapshot;

const METRICS: { key: MetricKey; label: string; invert?: boolean }[] = [
  { key: "sessions", label: "Sessões" },
  { key: "unique_visitors", label: "Visitantes únicos" },
  { key: "pageviews", label: "Pageviews" },
  { key: "leads", label: "Leads" },
];

function fmtInt(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("pt-BR").format(Math.round(n));
}
function fmtTime(d: Date): string {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

async function loadSnapshot(win: Window): Promise<{ snap: Snapshot; error: string | null }> {
  const [kpiRes, leadsRes] = await Promise.all([
    supabase.rpc(
      "analytics_overview_kpis" as never,
      {
        p_since: win.from.toISOString(),
        p_until: win.until.toISOString(),
      } as never
    ),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", win.from.toISOString())
      .lt("created_at", win.until.toISOString()),
  ]);

  const kpi = (Array.isArray(kpiRes.data) ? kpiRes.data[0] : null) as Record<
    string,
    unknown
  > | null;
  const snap: Snapshot = {
    sessions: Number(kpi?.sessions) || 0,
    unique_visitors: Number(kpi?.unique_visitors) || 0,
    pageviews: Number(kpi?.pageviews) || 0,
    leads: leadsRes.error ? null : (leadsRes.count ?? 0),
  };
  return { snap, error: kpiRes.error?.message ?? leadsRes.error?.message ?? null };
}

export default function TodayVsYesterdayCard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Loaded | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const now = new Date();
    Promise.all([
      loadSnapshot(todaySoFarWindow(now)),
      loadSnapshot(yesterdaySameTimeWindow(now)),
      loadSnapshot(yesterdayFullWindow(now)),
    ])
      .then(([today, same, full]) => {
        if (cancelled) return;
        setError(today.error ?? same.error ?? full.error);
        setData({
          fetchedAt: now,
          today: today.snap,
          yesterdaySameTime: same.snap,
          yesterdayFull: full.snap,
        });
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const now = data?.fetchedAt ?? new Date();
  const todayKey = fmtLocalDay(now);
  const analyticsHref = `/admin/analytics?tab=overview&from=${todayKey}&to=${todayKey}&cmp=1`;

  return (
    <section className="bw-admin__section bw-admin__today" aria-labelledby="bw-today-title">
      <header className="bw-admin__section-head">
        <div>
          <h2 className="bw-admin__section-title" id="bw-today-title">
            Hoje até {fmtTime(now)}
          </h2>
          <p className="bw-admin__section-desc">
            Variação vs. ontem até o mesmo horário (
            {data ? formatWindowLabel(yesterdaySameTimeWindow(data.fetchedAt)) : "…"}) · total de
            ontem como referência
          </p>
        </div>
        <div className="bw-admin__today-actions">
          <button
            type="button"
            className="bw-admin__btn bw-admin__btn--sm"
            onClick={refresh}
            disabled={loading}
          >
            {loading ? "Atualizando…" : "Atualizar"}
          </button>
          <a className="bw-admin__section-link" href={analyticsHref}>
            ver por dia
          </a>
        </div>
      </header>

      {error && (
        <p className="bw-admin__card-error" role="status" title={error}>
          erro ao carregar
        </p>
      )}

      <div className="bw-admin__today-grid">
        {METRICS.map((m) => {
          const cur = data?.today[m.key] ?? null;
          const base = data?.yesterdaySameTime[m.key] ?? null;
          const full = data?.yesterdayFull[m.key] ?? null;
          const t = cur != null && base != null ? trend(cur, base) : null;
          const dir = t ? (m.invert ? invertDir(t.dir) : t.dir) : "flat";
          return (
            <div key={m.key} className="bw-admin__today-item" data-testid={`today-${m.key}`}>
              <p className="bw-admin__kpi-label">{m.label}</p>
              <div className="bw-admin__today-row">
                <span
                  className={"bw-admin__kpi-value" + (cur == null ? " bw-admin__kpi-empty" : "")}
                >
                  {loading && !data ? "…" : fmtInt(cur)}
                </span>
                {t && (
                  <span
                    className="bw-admin__trend"
                    data-dir={dir}
                    title="vs. ontem até o mesmo horário"
                  >
                    {t.dir === "up" ? "↑" : t.dir === "down" ? "↓" : "·"} {t.label}
                  </span>
                )}
              </div>
              <p className="bw-admin__kpi-sub">
                {data ? (
                  <>
                    ontem até {fmtTime(data.fetchedAt)}: <strong>{fmtInt(base)}</strong> · ontem
                    inteiro: <strong>{fmtInt(full)}</strong>
                  </>
                ) : (
                  "Carregando…"
                )}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
