/**
 * OverviewTab — aba "Visão executiva" (server-side).
 *
 * Usa duas RPCs:
 *   - analytics_overview_kpis(since, until, ...filters): KPIs + sparkline (14d)
 *   - analytics_timeseries(since, until, grain): série para o gráfico e a
 *     tabela por dia
 *
 * O cliente nunca puxa eventos brutos. Os filtros de segmento são traduzidos
 * em parâmetros nomeados da RPC de KPIs; `analytics_timeseries` ainda NÃO
 * aceita segmentos — com segmento ativo o gráfico e a tabela mostram o
 * tráfego total e a tela avisa.
 *
 * Comparação justa (lib/analyticsCompare.ts): um período em curso só tem
 * dados até agora, então o "período anterior" dos KPIs é deslocado pela mesma
 * duração e cortado no mesmo horário (hoje até 15:42 × ontem até 15:42). O
 * gráfico sobrepõe o período anterior inteiro, e a tabela compara cada dia com
 * o anterior — o dia em curso, com ontem até o mesmo horário.
 *
 * Dias no fuso do navegador: até 90 dias a série vem por HORA e é somada por
 * dia local aqui (o `date_trunc('day')` do servidor é em UTC e corta o dia às
 * 21h de São Paulo). Acima disso, semanas/meses do servidor, como antes.
 */
import { useEffect, useMemo, useState } from "react";
import {
  alignPrevious,
  fillTimeseries,
  fmtLocalDay,
  formatBucketLabel,
  pickGrain,
  truncUtc,
  type Grain,
  type SeriesPoint,
} from "@/lib/analyticsTimeseries";
import {
  addLocalDays,
  aggregateHourlyByLocalDay,
  alignedPreviousWindow,
  buildDayTable,
  effectiveWindow,
  formatDayLabel,
  formatWindowLabel,
  fullPreviousWindow,
  invertDir,
  localDayGrid,
  startOfLocalDay,
  trend,
  yesterdaySameTimeWindow,
  type Counts,
  type HourlyRow,
  type Window,
} from "@/lib/analyticsCompare";
import {
  Area,
  AreaChart,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { devError } from "@/lib/devLog";
import type { DateRange, Segment, SegmentDim } from "./types";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
type Kpis = {
  sessions: number;
  unique_visitors: number;
  pageviews: number;
  pages_per_session: number;
  avg_engagement_ms: number;
  bounce_rate: number;
  conversions: number;
  conversion_rate: number;
  spark: { d: string; sessions: number; pageviews: number }[];
};

const EMPTY_KPIS: Kpis = {
  sessions: 0,
  unique_visitors: 0,
  pageviews: 0,
  pages_per_session: 0,
  avg_engagement_ms: 0,
  bounce_rate: 0,
  conversions: 0,
  conversion_rate: 0,
  spark: [],
};

/** Ponto do gráfico: `null` nos buckets futuros do período em curso (a linha para em "agora"). */
type ChartPoint = {
  t: number;
  sessions: number | null;
  pageviews: number | null;
  prevSessions?: number;
  prevPageviews?: number;
};

/** Linha da tabela por dia (ou por semana/mês em períodos longos). */
type TableRow = Counts & {
  key: string;
  label: string;
  /** Dia/bucket em curso: só tem dados até agora. */
  partial: boolean;
  /** Base da variação (dia anterior; ontem até o mesmo horário no dia em curso). */
  base: Counts | null;
};

type Meta = {
  fetchedAt: Date;
  cur: Window & { partial: boolean };
  prev: (Window & { partial: boolean }) | null;
  /** Total do período anterior inteiro (contexto quando o atual está em curso). */
  prevFullTotals: Counts | null;
  mode: "day" | "week" | "month";
};

type RpcRes<T> = { data: T | null; error: { message: string } | null };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmtNum(n: number): string {
  return Math.round(n).toLocaleString("pt-BR");
}
function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}
function fmtMs(ms: number): string {
  if (!ms) return "0:00";
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
function fmtTime(d: Date): string {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** Converte segmentos ativos em parâmetros nomeados da RPC. */
function segmentsToRpcArgs(segments: Segment[]): Record<string, string | null> {
  const map: Partial<Record<SegmentDim, string>> = {};
  for (const s of segments) map[s.dim] = s.value;
  return {
    p_device: map.device ?? null,
    p_country: map.country ?? null,
    p_utm_source: map.utm_source ?? null,
    p_utm_medium: map.utm_medium ?? null,
    p_utm_campaign: map.utm_campaign ?? null,
    p_landing_path: map.landing_path ?? null,
    p_referrer_host: map.referrer_host ?? null,
  };
}

function parseKpis(res: RpcRes<Kpis[]>): Kpis {
  if (res.error) throw new Error(res.error.message);
  const k = res.data?.[0] ?? EMPTY_KPIS;
  // spark vem como jsonb; pode chegar como objeto já parseado
  const sparkRaw = (k as unknown as { spark?: unknown }).spark;
  const spark = Array.isArray(sparkRaw)
    ? (sparkRaw as Kpis["spark"])
    : typeof sparkRaw === "string"
      ? (JSON.parse(sparkRaw) as Kpis["spark"])
      : [];
  return { ...k, spark };
}

function parseRows(res: RpcRes<HourlyRow[]>): HourlyRow[] {
  if (res.error) throw new Error(res.error.message);
  return res.data ?? [];
}

function countsOf(k: Kpis): Counts {
  return { sessions: k.sessions, pageviews: k.pageviews, conversions: k.conversions };
}

function sumCounts(items: readonly Counts[]): Counts {
  return items.reduce(
    (acc, c) => ({
      sessions: acc.sessions + c.sessions,
      pageviews: acc.pageviews + c.pageviews,
      conversions: acc.conversions + c.conversions,
    }),
    { sessions: 0, pageviews: 0, conversions: 0 },
  );
}

/** Buckets depois do que contém "agora" viram `null`: a linha do gráfico para em agora. */
function toChart(points: readonly SeriesPoint[], lastLiveBucket: number): ChartPoint[] {
  return points.map((p) =>
    p.t > lastLiveBucket ? { ...p, sessions: null, pageviews: null } : { ...p },
  );
}

/** Soma dos buckets brutos da RPC (sessões, pageviews, conversões). */
function sumRows(rows: readonly HourlyRow[]): Counts {
  return sumCounts(
    rows.map((r) => ({
      sessions: Number(r.sessions ?? 0) || 0,
      pageviews: Number(r.pageviews ?? 0) || 0,
      conversions: Number(r.conversions ?? 0) || 0,
    })),
  );
}

function Delta({ cur, prev, invert = false }: { cur: number; prev: number | null; invert?: boolean }) {
  if (prev === null) {
    return (
      <span className="aa-kpi__delta" data-dir="flat">
        —
      </span>
    );
  }
  const t = trend(cur, prev);
  const dir = invert ? invertDir(t.dir) : t.dir;
  return (
    <span className="aa-kpi__delta" data-dir={dir} title={`antes: ${fmtNum(prev)}`}>
      {t.dir === "up" ? "↑" : t.dir === "down" ? "↓" : "·"} {t.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
type Props = {
  range: DateRange;
  segments: Segment[];
  comparePrev: boolean;
};

export default function OverviewTab({ range, segments, comparePrev }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<Kpis>(EMPTY_KPIS);
  const [prevKpis, setPrevKpis] = useState<Kpis>(EMPTY_KPIS);
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const [rows, setRows] = useState<TableRow[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [metric, setMetric] = useState<"sessions" | "pageviews">("sessions");
  const [refreshKey, setRefreshKey] = useState(0);
  const grain = useMemo(() => pickGrain(range.from, range.to), [range]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const now = new Date();
    const cur = effectiveWindow(range, now);
    const prevAligned = comparePrev ? alignedPreviousWindow(range, now) : null;
    const prevFull = comparePrev ? fullPreviousWindow(range) : null;
    // Até 90 dias: buckets por hora, somados por dia local aqui.
    const dayMode = grain === "hour" || grain === "day";
    const seriesGrain: Grain = dayMode ? "hour" : grain;
    // No modo dia a série começa 1 dia antes: base da variação do 1º dia.
    const seriesFrom = dayMode ? addLocalDays(range.from, -1) : range.from;
    const includesToday = dayMode && cur.partial && range.from.getTime() <= now.getTime();

    const segArgs = segmentsToRpcArgs(segments);
    const rpc = (name: "analytics_overview_kpis" | "analytics_timeseries", args: Record<string, unknown>) =>
      Promise.resolve(supabase.rpc(name, args as never));

    const calls: Promise<unknown>[] = [
      rpc("analytics_overview_kpis", {
        p_since: cur.from.toISOString(),
        p_until: cur.until.toISOString(),
        ...segArgs,
      }),
      rpc("analytics_timeseries", {
        p_since: seriesFrom.toISOString(),
        p_until: cur.until.toISOString(),
        p_grain: seriesGrain,
      }),
      prevAligned
        ? rpc("analytics_overview_kpis", {
            p_since: prevAligned.from.toISOString(),
            p_until: prevAligned.until.toISOString(),
            ...segArgs,
          })
        : Promise.resolve(null),
      prevFull
        ? rpc("analytics_timeseries", {
            p_since: prevFull.from.toISOString(),
            p_until: prevFull.until.toISOString(),
            p_grain: seriesGrain,
          })
        : Promise.resolve(null),
      // Ontem até o mesmo horário, sem segmentos (a tabela também não tem):
      // base do dia em curso.
      includesToday
        ? (() => {
            const y = yesterdaySameTimeWindow(now);
            return rpc("analytics_overview_kpis", {
              p_since: y.from.toISOString(),
              p_until: y.until.toISOString(),
            });
          })()
        : Promise.resolve(null),
    ];

    Promise.all(calls)
      .then((results) => {
        if (cancelled) return;

        const k = parseKpis(results[0] as RpcRes<Kpis[]>);
        const seriesRows = parseRows(results[1] as RpcRes<HourlyRow[]>);
        const pk = results[2] ? parseKpis(results[2] as RpcRes<Kpis[]>) : EMPTY_KPIS;
        const prevRows = results[3] ? parseRows(results[3] as RpcRes<HourlyRow[]>) : null;
        const todayBase = results[4] ? countsOf(parseKpis(results[4] as RpcRes<Kpis[]>)) : null;

        setKpis(k);
        setPrevKpis(pk);

        const untilFull = new Date(range.to.getTime() + 1);
        let nextChart: ChartPoint[];
        let nextRows: TableRow[];
        let prevFullTotals: Counts | null = null;
        const todayKey = fmtLocalDay(now);

        if (dayMode) {
          const days = aggregateHourlyByLocalDay(seriesRows, seriesFrom, cur.until);
          const table = buildDayTable(days, { from: range.from, now, todayBase });
          const yesterdayKey = fmtLocalDay(addLocalDays(now, -1));
          nextRows = table.map((r) => ({
            key: r.day,
            label:
              r.day === todayKey
                ? `hoje · ${formatDayLabel(r.t)}`
                : r.day === yesterdayKey
                  ? `ontem · ${formatDayLabel(r.t)}`
                  : formatDayLabel(r.t),
            sessions: r.sessions,
            pageviews: r.pageviews,
            conversions: r.conversions,
            partial: r.partial,
            base: r.base,
          }));

          const prevDays = prevRows && prevFull ? aggregateHourlyByLocalDay(prevRows, prevFull.from, prevFull.until) : null;
          if (prevDays) prevFullTotals = sumCounts(prevDays);

          if (grain === "hour") {
            // Gráfico por hora: só os buckets do período (a série trouxe 1 dia a mais).
            const fromMs = range.from.getTime();
            const own = seriesRows.filter((r) => new Date(r.bucket).getTime() >= fromMs);
            let main = fillTimeseries(own, range.from, untilFull, "hour");
            if (prevRows && prevFull) {
              main = alignPrevious(main, fillTimeseries(prevRows, prevFull.from, prevFull.until, "hour"));
            }
            nextChart = toChart(main, truncUtc(now, "hour").getTime());
          } else {
            // Gráfico por dia LOCAL, grade até o fim do período (futuro = null).
            const byDay = new Map(days.map((d) => [d.day, d]));
            const grid = localDayGrid(range.from, untilFull);
            const todayStart = startOfLocalDay(now).getTime();
            nextChart = grid.map((d, i) => {
              const p = byDay.get(fmtLocalDay(d));
              const future = d.getTime() > todayStart;
              const prev = prevDays?.[i];
              return {
                t: d.getTime(),
                sessions: future ? null : (p?.sessions ?? 0),
                pageviews: future ? null : (p?.pageviews ?? 0),
                ...(prev ? { prevSessions: prev.sessions, prevPageviews: prev.pageviews } : {}),
              };
            });
          }
        } else {
          // Semanas/meses do servidor (UTC), como antes.
          let main = fillTimeseries(seriesRows, range.from, untilFull, grain);
          if (prevRows && prevFull) {
            main = alignPrevious(main, fillTimeseries(prevRows, prevFull.from, prevFull.until, grain));
            prevFullTotals = sumRows(prevRows);
          }
          const lastLive = truncUtc(now, grain).getTime();
          nextChart = toChart(main, lastLive);
          const conv = new Map<number, number>();
          for (const r of seriesRows) {
            const t = new Date(r.bucket).getTime();
            conv.set(t, (conv.get(t) ?? 0) + (Number(r.conversions ?? 0) || 0));
          }
          const live = main.filter((p) => p.t <= lastLive);
          nextRows = live.map((p, i) => {
            const prev = i > 0 ? live[i - 1] : null;
            return {
              key: String(p.t),
              label: formatBucketLabel(p.t, grain, true),
              sessions: p.sessions,
              pageviews: p.pageviews,
              conversions: conv.get(p.t) ?? 0,
              partial: cur.partial && p.t === lastLive,
              base: prev
                ? { sessions: prev.sessions, pageviews: prev.pageviews, conversions: conv.get(prev.t) ?? 0 }
                : null,
            };
          });
        }

        setChart(nextChart);
        setRows(nextRows);
        setMeta({
          fetchedAt: now,
          cur,
          prev: prevAligned,
          prevFullTotals,
          mode: dayMode ? "day" : grain === "week" ? "week" : "month",
        });
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        devError("[analytics overview] rpc error", err);
        if (!cancelled) setError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [range, segments, grain, comparePrev, refreshKey]);

  // ----- render -----
  if (loading) {
    return (
      <div className="aa-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aa-col-3 aa-skel" style={{ height: 92 }} />
        ))}
        <div className="aa-col-12 aa-skel" style={{ height: 320 }} />
        <div className="aa-col-12 aa-skel" style={{ height: 200 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="aa-empty">
        <span className="aa-empty__icon">!</span>
        erro ao carregar · <span className="aa-mono">{error}</span>
      </div>
    );
  }

  if (!kpis.sessions && !prevKpis.sessions) {
    return (
      <div className="aa-empty">
        <span className="aa-empty__icon">∅</span>
        sem eventos no período · tente ajustar o intervalo ou os segmentos
      </div>
    );
  }

  const kpiList: { label: string; value: string; cur: number; prev: number; sparkKey: "sessions" | "pageviews"; invert?: boolean }[] = [
    { label: "sessões",            value: fmtNum(kpis.sessions),           cur: kpis.sessions,           prev: prevKpis.sessions,           sparkKey: "sessions" },
    { label: "visitantes únicos",  value: fmtNum(kpis.unique_visitors),    cur: kpis.unique_visitors,    prev: prevKpis.unique_visitors,    sparkKey: "sessions" },
    { label: "pageviews",          value: fmtNum(kpis.pageviews),          cur: kpis.pageviews,          prev: prevKpis.pageviews,          sparkKey: "pageviews" },
    { label: "pv / sessão",        value: kpis.pages_per_session.toFixed(2), cur: kpis.pages_per_session, prev: prevKpis.pages_per_session, sparkKey: "pageviews" },
    { label: "tempo engajado",     value: fmtMs(kpis.avg_engagement_ms),   cur: kpis.avg_engagement_ms,  prev: prevKpis.avg_engagement_ms,  sparkKey: "sessions" },
    // bounce rate: cair é bom — inverte a cor do delta
    { label: "bounce rate",        value: fmtPct(kpis.bounce_rate),        cur: kpis.bounce_rate,        prev: prevKpis.bounce_rate,        sparkKey: "sessions", invert: true },
    { label: "conversões",         value: fmtNum(kpis.conversions),        cur: kpis.conversions,        prev: prevKpis.conversions,        sparkKey: "sessions" },
    { label: "taxa de conversão",  value: fmtPct(kpis.conversion_rate),    cur: kpis.conversion_rate,    prev: prevKpis.conversion_rate,    sparkKey: "sessions" },
  ];

  const isLocalDayChart = meta?.mode === "day" && grain === "day";
  const tableTitle = meta?.mode === "day" ? "por dia" : meta?.mode === "week" ? "por semana" : "por mês";
  const unitLabel = meta?.mode === "day" ? "dia" : meta?.mode === "week" ? "semana" : "mês";
  const tableRows = [...rows].reverse(); // mais recente primeiro

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* KPI strip */}
      <div className="aa-kpi-grid">
        {kpiList.map((k) => (
          <div key={k.label} className="aa-kpi">
            <span className="aa-kpi__label">{k.label}</span>
            <span className="aa-kpi__value">{k.value}</span>
            {comparePrev && <Delta cur={k.cur} prev={k.prev} invert={k.invert} />}
            <div className="aa-kpi__spark">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={kpis.spark}>
                  <Area
                    type="monotone"
                    dataKey={k.sparkKey}
                    stroke="var(--aa-accent)"
                    fill="var(--aa-accent)"
                    fillOpacity={0.15}
                    strokeWidth={1.2}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Base da comparação */}
      {meta && (
        <div
          className="aa-row aa-mono"
          role="note"
          style={{ fontSize: "var(--aa-text-xs)", color: "var(--aa-fg-faint)", gap: 6, flexWrap: "wrap" }}
        >
          <span>
            {meta.cur.partial ? (
              <>
                período em curso · dados até <b style={{ color: "var(--aa-fg)" }}>{fmtTime(meta.fetchedAt)}</b>
              </>
            ) : (
              <>período encerrado · {formatWindowLabel(meta.cur)}</>
            )}
          </span>
          {comparePrev && meta.prev && (
            <span>
              · Δ vs. <b style={{ color: "var(--aa-fg)" }}>{formatWindowLabel(meta.prev)}</b>
              {meta.prev.partial && " (até o mesmo horário)"}
            </span>
          )}
          {comparePrev && meta.cur.partial && meta.prevFullTotals && (
            <span>
              · período anterior inteiro: {fmtNum(meta.prevFullTotals.sessions)} sessões ·{" "}
              {fmtNum(meta.prevFullTotals.pageviews)} pageviews
            </span>
          )}
          <button
            type="button"
            className="admin-analytics__btn"
            data-variant="ghost"
            onClick={() => setRefreshKey((k) => k + 1)}
            style={{ fontSize: "var(--aa-text-xs)", padding: "2px 8px" }}
          >
            atualizar
          </button>
        </div>
      )}

      {/* Main chart */}
      <div className="aa-card">
        {segments.length > 0 && (
          <div
            className="aa-faint aa-mono"
            role="note"
            style={{
              fontSize: "var(--aa-text-xs)",
              padding: "8px 12px",
              marginBottom: 10,
              border: "1px dashed var(--aa-border)",
              borderRadius: 6,
              background: "var(--aa-bg-soft)",
            }}
          >
            ⓘ série temporal e tabela {tableTitle} com todo o tráfego do período · os segmentos
            ativos filtram só os indicadores acima (ainda)
          </div>
        )}
        <div className="aa-card__head">
          <h3 className="aa-card__title">série temporal</h3>
          <div className="aa-row" style={{ gap: 4 }}>
            <button
              type="button"
              className="admin-analytics__btn"
              data-variant="ghost"
              aria-pressed={metric === "sessions"}
              onClick={() => setMetric("sessions")}
              style={{ fontSize: "var(--aa-text-xs)", padding: "3px 8px" }}
            >
              sessões
            </button>
            <button
              type="button"
              className="admin-analytics__btn"
              data-variant="ghost"
              aria-pressed={metric === "pageviews"}
              onClick={() => setMetric("pageviews")}
              style={{ fontSize: "var(--aa-text-xs)", padding: "3px 8px" }}
            >
              pageviews
            </button>
          </div>
        </div>
        <div style={{ height: 300, color: "var(--aa-fg)" }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chart} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="g-cur" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--aa-accent)" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="var(--aa-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--aa-border)" vertical={false} />
              <XAxis
                dataKey="t"
                tickFormatter={(t: number) =>
                  isLocalDayChart ? formatDayLabel(Number(t)) : formatBucketLabel(Number(t), grain)
                }
                tick={{ fontSize: "var(--aa-text-2xs)", fontFamily: "var(--aa-font-mono)", fill: "var(--aa-fg-faint)" }}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis
                tick={{ fontSize: "var(--aa-text-2xs)", fontFamily: "var(--aa-font-mono)", fill: "var(--aa-fg-faint)" }}
                tickLine={false}
                axisLine={false}
                width={36}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--aa-bg-elev)",
                  border: "1px solid var(--aa-border)",
                  borderRadius: 6,
                  fontFamily: "var(--aa-font-mono)",
                  fontSize: "var(--aa-text-xs)",
                  color: "var(--aa-fg)",
                }}
                labelFormatter={(t) =>
                  isLocalDayChart ? formatDayLabel(Number(t), true) : formatBucketLabel(Number(t), grain, true)
                }
              />
              <Area
                type="monotone"
                dataKey={metric}
                stroke="var(--aa-accent)"
                strokeWidth={1.6}
                fill="url(#g-cur)"
                name="atual"
                isAnimationActive={false}
              />
              {comparePrev && (
                <Line
                  type="monotone"
                  dataKey={metric === "sessions" ? "prevSessions" : "prevPageviews"}
                  stroke="var(--aa-fg-faint)"
                  strokeWidth={1.2}
                  strokeDasharray="3 4"
                  dot={false}
                  name="anterior"
                  isAnimationActive={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela por dia */}
      <div className="aa-card">
        <div className="aa-card__head">
          <h3 className="aa-card__title" style={{ whiteSpace: "nowrap" }}>{tableTitle}</h3>
          <span className="aa-faint aa-mono" style={{ fontSize: "var(--aa-text-xs)", textAlign: "right" }}>
            Δ vs. {unitLabel} anterior
            {meta?.mode === "day" && " · hoje vs. ontem até o mesmo horário"}
          </span>
        </div>
        {tableRows.length === 0 ? (
          <div className="aa-empty">
            <span className="aa-empty__icon">∅</span>
            sem dias com dados no período
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="aa-table" data-testid="daily-table">
              <thead>
                <tr>
                  <th>{unitLabel}</th>
                  <th className="num">sessões</th>
                  <th className="num">Δ</th>
                  <th className="num">pageviews</th>
                  <th className="num">Δ</th>
                  <th className="num">conversões</th>
                  <th className="num">Δ</th>
                  <th className="num">pv / sessão</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((r) => (
                  <tr key={r.key} data-partial={r.partial || undefined}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <span style={{ fontWeight: r.partial ? "var(--aa-fw-semibold)" : undefined }}>{r.label}</span>
                      {r.partial && meta && (
                        <>
                          {" "}
                          <span className="aa-faint aa-mono" style={{ fontSize: "var(--aa-text-2xs)", marginLeft: 4 }}>
                            até {fmtTime(meta.fetchedAt)}
                          </span>
                        </>
                      )}
                    </td>
                    <td className="num">{fmtNum(r.sessions)}</td>
                    <td className="num" style={{ whiteSpace: "nowrap" }}>
                      <Delta cur={r.sessions} prev={r.base ? r.base.sessions : null} />
                    </td>
                    <td className="num">{fmtNum(r.pageviews)}</td>
                    <td className="num" style={{ whiteSpace: "nowrap" }}>
                      <Delta cur={r.pageviews} prev={r.base ? r.base.pageviews : null} />
                    </td>
                    <td className="num">{fmtNum(r.conversions)}</td>
                    <td className="num" style={{ whiteSpace: "nowrap" }}>
                      <Delta cur={r.conversions} prev={r.base ? r.base.conversions : null} />
                    </td>
                    <td className="num">{r.sessions ? (r.pageviews / r.sessions).toFixed(2) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
