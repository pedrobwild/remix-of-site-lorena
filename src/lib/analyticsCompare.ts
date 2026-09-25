/**
 * Comparação justa de períodos e visão por dia do painel de Analytics
 * (funções puras, testadas em src/lib/__tests__/analyticsCompare.test.ts).
 *
 * 1. Período em curso. "Hoje" às 15:42 tem 15h42 de dados; comparar com
 *    ontem INTEIRO faz o dia parecer sempre pior. A janela efetiva do período
 *    termina em "agora", e o período anterior é deslocado pela mesma duração
 *    e cortado no mesmo ponto: hoje até 15:42 × ontem até 15:42; últimos
 *    7 dias até agora × os 7 dias anteriores até o mesmo horário. Períodos já
 *    encerrados comparam inteiros, como antes.
 *
 * 2. Buckets no fuso do usuário. A RPC `analytics_timeseries_v2` recebe o
 *    fuso IANA do navegador (`browserTimeZone()`) e devolve cada bucket como
 *    o INÍCIO do bucket local, em timestamptz. Aqui a grade de buckets é
 *    montada em horário local (hora, dia, semana ISO, mês) e casada pelo
 *    instante — o mesmo dia que os presets "Hoje"/"Ontem" e as datas da URL
 *    usam. Buckets que não caiam na grade são mantidos: nunca descartamos dado.
 *
 * Janelas são semiabertas [from, until), como as RPCs (`started_at < p_until`).
 */
import { fmtLocalDay } from "./analyticsTimeseries";

export type DateRange = { from: Date; to: Date };
export type Window = { from: Date; until: Date };
export type Counts = { sessions: number; visitors: number; pageviews: number; conversions: number };
export type LocalGrain = "hour" | "day" | "week" | "month";

export const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

export const EMPTY_COUNTS: Counts = { sessions: 0, visitors: 0, pageviews: 0, conversions: 0 };

/** Fuso IANA do navegador, para a RPC (`America/Sao_Paulo`); "UTC" se indisponível. */
export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

// ---------------------------------------------------------------------------
// Janelas
// ---------------------------------------------------------------------------

/** Duração do período em ms; `to` é inclusivo (23:59:59.999). */
export function rangeLengthMs(range: DateRange): number {
  return range.to.getTime() + 1 - range.from.getTime();
}

/**
 * Janela efetiva do período: termina no fim do período ou em `now`, o que
 * vier primeiro. `partial` marca período ainda em curso.
 */
export function effectiveWindow(
  range: DateRange,
  now: Date = new Date()
): Window & { partial: boolean } {
  const untilFull = range.to.getTime() + 1;
  const partial = untilFull > now.getTime();
  const until = Math.max(range.from.getTime(), Math.min(untilFull, now.getTime()));
  return { from: new Date(range.from.getTime()), until: new Date(until), partial };
}

/**
 * Período anterior alinhado: mesma duração, imediatamente antes e — quando o
 * atual ainda está em curso — cortado no mesmo ponto.
 */
export function alignedPreviousWindow(
  range: DateRange,
  now: Date = new Date()
): Window & { partial: boolean } {
  const len = rangeLengthMs(range);
  const cur = effectiveWindow(range, now);
  return {
    from: new Date(range.from.getTime() - len),
    until: new Date(cur.until.getTime() - len),
    partial: cur.partial,
  };
}

/** Período anterior inteiro (para a linha tracejada do gráfico). */
export function fullPreviousWindow(range: DateRange): Window {
  const len = rangeLengthMs(range);
  return { from: new Date(range.from.getTime() - len), until: new Date(range.from.getTime()) };
}

/** Meia-noite local de `d`. */
export function startOfLocalDay(d: Date): Date {
  const x = new Date(d.getTime());
  x.setHours(0, 0, 0, 0);
  return x;
}

/** `d` deslocado em `n` dias de calendário local (atravessa mudança de horário sem pular hora). */
export function addLocalDays(d: Date, n: number): Date {
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() + n,
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
    d.getMilliseconds()
  );
}

/** Ontem, das 00:00 locais até o mesmo horário de `now`. */
export function yesterdaySameTimeWindow(now: Date = new Date()): Window {
  return { from: startOfLocalDay(addLocalDays(now, -1)), until: addLocalDays(now, -1) };
}

/** Ontem inteiro (00:00 até a meia-noite seguinte, em horário local). */
export function yesterdayFullWindow(now: Date = new Date()): Window {
  const today = startOfLocalDay(now);
  return { from: addLocalDays(today, -1), until: today };
}

/** Hoje, das 00:00 locais até `now`. */
export function todaySoFarWindow(now: Date = new Date()): Window {
  return { from: startOfLocalDay(now), until: new Date(now.getTime()) };
}

// ---------------------------------------------------------------------------
// Grade de buckets em horário local
// ---------------------------------------------------------------------------

/** Início do bucket local que contém `d` (semana ISO: começa na segunda). */
export function truncLocal(d: Date, grain: LocalGrain): Date {
  const x = new Date(d.getTime());
  if (grain === "hour") {
    x.setMinutes(0, 0, 0);
    return x;
  }
  x.setHours(0, 0, 0, 0);
  if (grain === "day") return x;
  if (grain === "week") {
    const dow = (x.getDay() + 6) % 7;
    return addLocalDays(x, -dow);
  }
  x.setDate(1);
  return x;
}

/** `d` deslocado em `n` buckets locais. */
export function addLocalGrain(d: Date, grain: LocalGrain, n = 1): Date {
  if (grain === "hour") return new Date(d.getTime() + n * HOUR_MS);
  if (grain === "day") return addLocalDays(d, n);
  if (grain === "week") return addLocalDays(d, 7 * n);
  const x = new Date(d.getTime());
  x.setMonth(x.getMonth() + n);
  return x;
}

/** Inícios de bucket (ms) que tocam [since, until). Limitado para não travar a UI. */
export function localBucketGrid(
  since: Date,
  until: Date,
  grain: LocalGrain,
  max = 2_000
): number[] {
  const out: number[] = [];
  let cur = truncLocal(since, grain);
  while (cur.getTime() < until.getTime() && out.length < max) {
    out.push(cur.getTime());
    cur = addLocalGrain(cur, grain, 1);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Série da RPC v2
// ---------------------------------------------------------------------------

/** Linha crua de `analytics_timeseries_v2` (bigint chega como number ou string). */
export type SeriesV2Row = {
  bucket: string;
  sessions?: number | string | null;
  visitors?: number | string | null;
  pageviews?: number | string | null;
  conversions?: number | string | null;
};

/** Ponto de série em horário local: `t` = início do bucket, em ms. */
export type LocalPoint = Counts & { t: number };

function num(v: number | string | null | undefined): number {
  return Number(v ?? 0) || 0;
}

/**
 * Série completa de [since, until): buckets sem sessão entram com 0 e os
 * buckets da RPC são casados pelo instante de início. Um bucket fora da grade
 * (fuso diferente do pedido, por exemplo) é mantido — nunca descartamos dado.
 */
export function fillLocalSeries(
  rows: readonly SeriesV2Row[],
  since: Date,
  until: Date,
  grain: LocalGrain
): LocalPoint[] {
  const map = new Map<number, LocalPoint>();
  for (const t of localBucketGrid(since, until, grain)) map.set(t, { ...EMPTY_COUNTS, t });
  for (const r of rows) {
    const t = new Date(r.bucket).getTime();
    if (Number.isNaN(t)) continue;
    const cur = map.get(t) ?? { ...EMPTY_COUNTS, t };
    cur.sessions += num(r.sessions);
    cur.visitors += num(r.visitors);
    cur.pageviews += num(r.pageviews);
    cur.conversions += num(r.conversions);
    map.set(t, cur);
  }
  return [...map.values()].sort((a, b) => a.t - b.t);
}

/**
 * Soma de contagens. Atenção: somar `visitors` de vários buckets conta a mesma
 * pessoa mais de uma vez — use o total só para sessões, pageviews e conversões
 * (visitantes únicos do período vêm de `analytics_overview_kpis`).
 */
export function sumCounts(items: readonly Counts[]): Counts {
  return items.reduce(
    (acc, c) => ({
      sessions: acc.sessions + c.sessions,
      visitors: acc.visitors + c.visitors,
      pageviews: acc.pageviews + c.pageviews,
      conversions: acc.conversions + c.conversions,
    }),
    { ...EMPTY_COUNTS }
  );
}

// ---------------------------------------------------------------------------
// Tendência
// ---------------------------------------------------------------------------

export type TrendDir = "up" | "down" | "flat";
export type Trend = { pct: number | null; dir: TrendDir; label: string };

/**
 * Variação percentual de `cur` sobre `prev`. Sem base (prev = 0): "novo" se
 * apareceu algo, "—" se continua zerado. Até ±0,5% conta como estável.
 */
export function trend(cur: number, prev: number): Trend {
  if (!prev) {
    return cur > 0
      ? { pct: null, dir: "up", label: "novo" }
      : { pct: null, dir: "flat", label: "—" };
  }
  const pct = ((cur - prev) / prev) * 100;
  const dir: TrendDir = pct > 0.5 ? "up" : pct < -0.5 ? "down" : "flat";
  return { pct, dir, label: `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%` };
}

/** Direção "boa": para métricas em que cair é bom (bounce rate), inverte a cor. */
export function invertDir(dir: TrendDir): TrendDir {
  return dir === "up" ? "down" : dir === "down" ? "up" : "flat";
}

// ---------------------------------------------------------------------------
// Rótulos
// ---------------------------------------------------------------------------

function fmtDayMonth(d: Date, withYear = false): string {
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    ...(withYear ? { year: "2-digit" } : {}),
  });
}
function fmtHourMinute(d: Date): string {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Descreve uma janela em horário local: "23/09" (dia inteiro), "23/09 até
 * 15:42", "01/09 – 07/09" (dias inteiros) ou "11/09 – 17/09 15:42". Quando a
 * janela cruza o ano, as datas levam o ano ("30/09/25 – 28/03/26 15:42").
 */
export function formatWindowLabel(win: Window): string {
  const lastInstant = new Date(win.until.getTime() - 1);
  const endsAtMidnight = startOfLocalDay(win.until).getTime() === win.until.getTime();
  const sameDay = fmtLocalDay(win.from) === fmtLocalDay(lastInstant);
  const withYear = win.from.getFullYear() !== lastInstant.getFullYear();
  const day = (d: Date) => fmtDayMonth(d, withYear);
  if (endsAtMidnight) {
    return sameDay ? day(win.from) : `${day(win.from)} – ${day(lastInstant)}`;
  }
  return sameDay
    ? `${day(win.from)} até ${fmtHourMinute(win.until)}`
    : `${day(win.from)} – ${day(win.until)} ${fmtHourMinute(win.until)}`;
}

/** "qui., 24/09" — rótulo curto de um dia local. */
export function formatDayLabel(t: number | Date, long = false): string {
  const d = typeof t === "number" ? new Date(t) : t;
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    ...(long ? { year: "numeric" } : {}),
  });
}

/** Rótulo de um bucket local na tabela e no tooltip ("qui., 24/09", "sem. 21/09"). */
export function formatLocalBucketLabel(t: number, grain: LocalGrain, long = false): string {
  const d = new Date(t);
  if (grain === "hour") {
    return long ? `${fmtDayMonth(d)} ${fmtHourMinute(d)}` : fmtHourMinute(d);
  }
  if (grain === "day") return formatDayLabel(d, long);
  if (grain === "week") return `sem. ${fmtDayMonth(d, long)}`;
  return d.toLocaleDateString("pt-BR", { month: "short", year: long ? "numeric" : "2-digit" });
}

/**
 * Rótulo curto do eixo X ("15:00", "24/09", "set. 26"): até 7 caracteres, para
 * o primeiro e o último tick caberem nas bordas do gráfico sem corte. O
 * tooltip e a tabela usam `formatLocalBucketLabel`, com dia da semana.
 */
export function formatLocalAxisLabel(t: number, grain: LocalGrain): string {
  const d = new Date(t);
  if (grain === "hour") return fmtHourMinute(d);
  if (grain === "day" || grain === "week") return fmtDayMonth(d);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

// ---------------------------------------------------------------------------
// Tabela por dia
// ---------------------------------------------------------------------------

export type DayTableRow = LocalPoint & {
  /** "YYYY-MM-DD" local. */
  day: string;
  /** Dia em curso: só tem dados até `now`. */
  partial: boolean;
  /**
   * Base da variação: o dia anterior inteiro ou, no dia em curso, ontem até
   * o mesmo horário. `null` quando não há base (1º dia sem dia anterior).
   */
  base: Counts | null;
};

/**
 * Monta as linhas da tabela por dia a partir da série diária. `points` deve
 * começar UM dia antes do período (lead-in), usado só como base do 1º dia. O
 * dia em curso usa `todayBase` (ontem até o mesmo horário) em vez do dia
 * anterior inteiro.
 */
export function buildDayTable(
  points: readonly LocalPoint[],
  opts: { from: Date; now: Date; todayBase?: Counts | null }
): DayTableRow[] {
  const fromKey = fmtLocalDay(opts.from);
  const todayKey = fmtLocalDay(opts.now);
  const out: DayTableRow[] = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const day = fmtLocalDay(new Date(p.t));
    if (day < fromKey) continue; // lead-in: só serve de base
    if (day > todayKey) continue; // futuro: sem dados
    const partial = day === todayKey;
    const prev = i > 0 ? points[i - 1] : null;
    const base: Counts | null = partial
      ? (opts.todayBase ?? null)
      : prev
        ? {
            sessions: prev.sessions,
            visitors: prev.visitors,
            pageviews: prev.pageviews,
            conversions: prev.conversions,
          }
        : null;
    out.push({ ...p, day, partial, base });
  }
  return out;
}
