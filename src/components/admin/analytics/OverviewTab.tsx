/**
 * OverviewTab — aba "Visão executiva" (server-side).
 *
 * Usa duas RPCs:
 *   - analytics_overview_kpis(since, until, ...filters): KPIs + sparkline (14d)
 *   - analytics_timeseries_v2(since, until, grain, tz, ...filters): série para
 *     o gráfico e para a tabela por dia, com buckets no fuso do navegador,
 *     filtros de segmento e visitantes únicos por bucket
 *
 * O cliente nunca puxa eventos brutos. Os segmentos ativos valem para tudo
 * (KPIs, gráfico e tabela): viram parâmetros nomeados das duas RPCs.
 *
 * Comparação justa (lib/analyticsCompare.ts): um período em curso só tem
 * dados até agora, então o "período anterior" dos KPIs é deslocado pela mesma
 * duração e cortado no mesmo horário (hoje até 15:42 × ontem até 15:42). O
 * gráfico sobrepõe o período anterior inteiro e marca o bucket em curso; a
 * tabela compara cada dia com o anterior — o dia em curso, com ontem até o
 * mesmo horário.
 *
 * Granularidade pela duração (pickGrain): hora até 2 dias, dia até 90,
 * semana até 1 ano, mês acima. A tabela é por dia sempre que o gráfico é por
 * hora ou por dia; por semana/mês nos períodos longos.
 */
import { useEffect, useMemo, useState } from "react";
import { fmtLocalDay, pickGrain } from "@/lib/analyticsTimeseries";
import {
  addLocalDays,
  alignedPreviousWindow,
  browserTimeZone,
  buildDayTable,
  effectiveWindow,
  fillLocalSeries,
  formatLocalAxisLabel,
  formatLocalBucketLabel,
  formatWindowLabel,
  fullPreviousWindow,
  invertDir,
  sumCounts,
  trend,
  truncLocal,
  yesterdaySameTimeWindow,
  type Counts,
  type LocalGrain,
  type LocalPoint,
  type SeriesV2Row,
  type Window,
} from "@/lib/analyticsCompare";
import {
  Area,
  AreaChart,
  ComposedChart,
  Line,
  ReferenceLine,
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

type Metric = "sessions" | "visitors" | "pageviews";

/** Ponto do gráfico: `null` nos buckets futuros do período em curso (a linha para em "agora"). */
type ChartPoint = {
  t: number;
  sessions: number | null;
  visitors: number | null;
  pageviews: number | null;
  prevSessions?: number;
  prevVisitors?: number;
  prevPageviews?: number;
};

/** Linha da tabela por dia (ou por semana/mês em períodos longos). */
type TableRow = Counts & {
  key: string;
  label: string;
  /** Dia/bucket em curso: só tem dados até agora. */
  partial: boolean;
  /** Base da variação (bucket anterior; ontem até o mesmo horário no dia em curso). */
  base: Counts | null;
};

type Meta = {
  fetchedAt: Date;
  cur: Window & { partial: boolean };
  prev: (Window & { partial: boolean }) | null;
  /** Total do período anterior inteiro (contexto quando o atual está em curso). */
  prevFullTotals: Counts | null;
  /** Início do bucket do gráfico que contém "agora" (só em período em curso). */
  partialT: number | null;
  tableGrain: LocalGrain;
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

/** Converte segmentos ativos em parâmetros nomeados das RPCs. */
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

function parseRows(res: RpcRes<SeriesV2Row[]>): SeriesV2Row[] {
  if (res.error) throw new Error(res.error.message);
  return res.data ?? [];
}

function countsOf(k: Kpis): Counts {
  return {
    sessions: k.sessions,
    visitors: k.unique_visitors,
    pageviews: k.pageviews,
    conversions: k.conversions,
  };
}

/** Buckets depois do que contém "agora" viram `null`: a linha do gráfico para em agora. */
function toChart(points: readonly LocalPoint[], lastLiveBucket: number, prev?: readonly LocalPoint[]): ChartPoint[] {
  return points.map((p, i) => {
    const future = p.t > lastLiveBucket;
    const q = prev?.[i];
    return {
      t: p.t,
      sessions: future ? null : p.sessions,
      visitors: future ? null : p.visitors,
      pageviews: future ? null : p.pageviews,
      ...(q ? { prevSessions: q.sessions, prevVisitors: q.visitors, prevPageviews: q.pageviews } : {}),
    };
  });
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
  const [metric, setMetric] = useState<Metric>("sessions");
  const [refreshKey, setRefreshKey] = useState(0);
  const grain = useMemo<LocalGrain>(() => pickGrain(range.from, range.to), [range]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const now = new Date();
    const tz = browserTimeZone();
    const cur = effectiveWindow(range, now);
    const prevAligned = comparePrev ? alignedPreviousWindow(range, now) : null;
    const prevFull = comparePrev ? fullPreviousWindow(range) : null;
    // Tabela por dia sempre que o gráfico é por hora ou por dia; em períodos
    // longos, por semana/mês. No modo dia a série da tabela começa 1 dia
    // antes: base da variação do 1º dia.
    const tableGrain: LocalGrain = grain === "hour" ? "day" : grain;
    const tableFrom = tableGrain === "day" ? addLocalDays(range.from, -1) : range.from;
    // Mesma granularidade no gráfico e na tabela: uma só consulta serve aos dois.
    const chartNeedsOwnSeries = grain !== tableGrain;
    const includesToday =
      tableGrain === "day" && cur.partial && range.from.getTime() <= now.getTime();
    // Base do dia em curso: ontem até o mesmo horário. Em "Hoje" é exatamente
    // a janela do período anterior — reaproveita a consulta dos KPIs.
    const yesterdayWin = includesToday ? yesterdaySameTimeWindow(now) : null;
    const todayBaseIsPrev =
      !!yesterdayWin &&
      !!prevAligned &&
      yesterdayWin.from.getTime() === prevAligned.from.getTime() &&
      yesterdayWin.until.getTime() === prevAligned.until.getTime();

    const segArgs = segmentsToRpcArgs(segments);
    const rpc = (name: string, args: Record<string, unknown>) =>
      Promise.resolve(supabase.rpc(name as never, args as never));
    const series = (win: Window, g: LocalGrain) =>
      rpc("analytics_timeseries_v2", {
        p_since: win.from.toISOString(),
        p_until: win.until.toISOString(),
        p_grain: g,
        p_tz: tz,
        ...segArgs,
      });

    const calls: Promise<unknown>[] = [
      rpc("analytics_overview_kpis", {
        p_since: cur.from.toISOString(),
        p_until: cur.until.toISOString(),
        ...segArgs,
      }),
      chartNeedsOwnSeries ? series(cur, grain) : Promise.resolve(null),
      series({ from: tableFrom, until: cur.until }, tableGrain),
      prevAligned
        ? rpc("analytics_overview_kpis", {
            p_since: prevAligned.from.toISOString(),
            p_until: prevAligned.until.toISOString(),
            ...segArgs,
          })
        : Promise.resolve(null),
      prevFull ? series(prevFull, grain) : Promise.resolve(null),
      // Ontem até o mesmo horário (com os mesmos segmentos): base do dia em curso.
      yesterdayWin && !todayBaseIsPrev
        ? rpc("analytics_overview_kpis", {
            p_since: yesterdayWin.from.toISOString(),
            p_until: yesterdayWin.until.toISOString(),
            ...segArgs,
          })
        : Promise.resolve(null),
    ];

    Promise.all(calls)
      .then((results) => {
        if (cancelled) return;

        const k = parseKpis(results[0] as RpcRes<Kpis[]>);
        const tableRowsRaw = parseRows(results[2] as RpcRes<SeriesV2Row[]>);
        // Sem consulta própria, o gráfico usa a da tabela sem o dia de lead-in.
        const chartStart = truncLocal(range.from, grain).getTime();
        const seriesRows = results[1]
          ? parseRows(results[1] as RpcRes<SeriesV2Row[]>)
          : tableRowsRaw.filter((r) => new Date(r.bucket).getTime() >= chartStart);
        const pk = results[3] ? parseKpis(results[3] as RpcRes<Kpis[]>) : EMPTY_KPIS;
        const prevRows = results[4] ? parseRows(results[4] as RpcRes<SeriesV2Row[]>) : null;
        const todayBase = results[5]
          ? countsOf(parseKpis(results[5] as RpcRes<Kpis[]>))
          : todayBaseIsPrev
            ? countsOf(pk)
            : null;

        setKpis(k);
        setPrevKpis(pk);

        const untilFull = new Date(range.to.getTime() + 1);
        const lastLive = truncLocal(now, grain).getTime();

        // Gráfico: grade do período inteiro (futuro = null), período anterior
        // inteiro alinhado pelo deslocamento do bucket.
        const main = fillLocalSeries(seriesRows, range.from, untilFull, grain);
        const prevSeries =
          prevRows && prevFull ? fillLocalSeries(prevRows, prevFull.from, prevFull.until, grain) : null;
        const nextChart = toChart(main, lastLive, prevSeries ?? undefined);
        const prevFullTotals = prevSeries ? sumCounts(prevSeries) : null;

        // Tabela
        let nextRows: TableRow[];
        if (tableGrain === "day") {
          const days = fillLocalSeries(tableRowsRaw, tableFrom, cur.until, "day");
          const todayKey = fmtLocalDay(now);
          const yesterdayKey = fmtLocalDay(addLocalDays(now, -1));
          nextRows = buildDayTable(days, { from: range.from, now, todayBase }).map((r) => ({
            key: r.day,
            label:
              r.day === todayKey
                ? `hoje · ${formatLocalBucketLabel(r.t, "day")}`
                : r.day === yesterdayKey
                  ? `ontem · ${formatLocalBucketLabel(r.t, "day")}`
                  : formatLocalBucketLabel(r.t, "day"),
            sessions: r.sessions,
            visitors: r.visitors,
            pageviews: r.pageviews,
            conversions: r.conversions,
            partial: r.partial,
            base: r.base,
          }));
        } else {
          const lastLiveTable = truncLocal(now, tableGrain).getTime();
          const live = fillLocalSeries(tableRowsRaw, tableFrom, cur.until, tableGrain).filter(
            (p) => p.t <= lastLiveTable
          );
          nextRows = live.map((p, i) => {
            const prev = i > 0 ? live[i - 1] : null;
            return {
              key: String(p.t),
              label: formatLocalBucketLabel(p.t, tableGrain, true),
              sessions: p.sessions,
              visitors: p.visitors,
              pageviews: p.pageviews,
              conversions: p.conversions,
              partial: cur.partial && p.t === lastLiveTable,
              base: prev
                ? { sessions: prev.sessions, visitors: prev.visitors, pageviews: prev.pageviews, conversions: prev.conversions }
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
          partialT: cur.partial && main.some((p) => p.t === lastLive) ? lastLive : null,
          tableGrain,
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

  const tableGrain = meta?.tableGrain ?? "day";
  const tableTitle = tableGrain === "day" ? "por dia" : tableGrain === "week" ? "por semana" : "por mês";
  const unitLabel = tableGrain === "day" ? "dia" : tableGrain === "week" ? "semana" : "mês";
  const tableRows = [...rows].reverse(); // mais recente primeiro
  const prevKey: Record<Metric, keyof ChartPoint> = {
    sessions: "prevSessions",
    visitors: "prevVisitors",
    pageviews: "prevPageviews",
  };
  const metricLabel: Record<Metric, string> = { sessions: "sessões", visitors: "visitantes", pageviews: "pageviews" };
  // Largura do eixo Y pelo maior valor visível (atual e anterior): com 36px
  // fixos e margem negativa, 3 dígitos saíam cortados ("685" virava "85").
  // A folga de 25% cobre o arredondamento dos ticks (ex.: máx. 950 → 1000).
  const yMax = chart.reduce((m, p) => {
    const prev = p[prevKey[metric]];
    return Math.max(m, p[metric] ?? 0, typeof prev === "number" ? prev : 0);
  }, 0);
  const yAxisWidth = Math.max(24, String(Math.ceil(yMax * 1.25)).length * 7 + 10);

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
          {segments.length > 0 && <span>· segmentos aplicados aos indicadores, ao gráfico e à tabela</span>}
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
        <div className="aa-card__head" style={{ flexWrap: "wrap" }}>
          <h3 className="aa-card__title" style={{ whiteSpace: "nowrap" }}>série temporal</h3>
          <div className="aa-row" style={{ gap: 4 }}>
            {(["sessions", "visitors", "pageviews"] as Metric[]).map((m) => (
              <button
                key={m}
                type="button"
                className="admin-analytics__btn"
                data-variant="ghost"
                aria-pressed={metric === m}
                onClick={() => setMetric(m)}
                style={{ fontSize: "var(--aa-text-xs)", padding: "3px 8px" }}
              >
                {metricLabel[m]}
              </button>
            ))}
          </div>
        </div>
        <div style={{ height: 300, color: "var(--aa-fg)" }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chart} margin={{ top: 4, right: 20, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="g-cur" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--aa-accent)" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="var(--aa-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--aa-border)" vertical={false} />
              <XAxis
                dataKey="t"
                tickFormatter={(t: number) => formatLocalAxisLabel(Number(t), grain)}
                tick={{ fontSize: "var(--aa-text-2xs)", fontFamily: "var(--aa-font-mono)", fill: "var(--aa-fg-faint)" }}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis
                tick={{ fontSize: "var(--aa-text-2xs)", fontFamily: "var(--aa-font-mono)", fill: "var(--aa-fg-faint)" }}
                tickLine={false}
                axisLine={false}
                width={yAxisWidth}
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
                  formatLocalBucketLabel(Number(t), grain, true) +
                  (meta?.partialT === Number(t) ? ` · em curso (até ${fmtTime(meta.fetchedAt)})` : "")
                }
              />
              {/* Bucket em curso: só tem dados até agora — marcado para não parecer queda. */}
              {meta?.partialT != null && (
                <ReferenceLine
                  x={meta.partialT}
                  stroke="var(--aa-accent-goal)"
                  strokeDasharray="3 3"
                  label={{
                    value: `em curso · até ${fmtTime(meta.fetchedAt)}`,
                    position: "insideTopRight",
                    fontSize: 10,
                    fontFamily: "var(--aa-font-mono)",
                    fill: "var(--aa-accent-goal)",
                  }}
                />
              )}
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
                  dataKey={prevKey[metric]}
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
            {tableGrain === "day" && " · hoje vs. ontem até o mesmo horário"}
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
                  <th className="num">visitantes</th>
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
                    <td className="num">{fmtNum(r.visitors)}</td>
                    <td className="num" style={{ whiteSpace: "nowrap" }}>
                      <Delta cur={r.visitors} prev={r.base ? r.base.visitors : null} />
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
