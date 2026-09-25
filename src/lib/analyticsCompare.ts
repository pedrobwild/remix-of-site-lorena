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
 * 2. Dias no fuso do usuário. A RPC `analytics_timeseries` agrupa com
 *    `date_trunc` em UTC, então um "dia" do servidor vai das 21h às 21h de
 *    São Paulo. Aqui os buckets HORÁRIOS (que cabem inteiros em qualquer fuso
 *    de offset inteiro) são somados no dia local do navegador — o mesmo dia
 *    que os presets "Hoje"/"Ontem" e as datas da URL usam.
 *
 * Janelas são semiabertas [from, until), como as RPCs (`started_at < p_until`).
 */
import { fmtLocalDay, type RawTimeseriesRow } from "./analyticsTimeseries";

export type DateRange = { from: Date; to: Date };
export type Window = { from: Date; until: Date };
export type Counts = { sessions: number; pageviews: number; conversions: number };

export const DAY_MS = 86_400_000;

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

/** "qui 24/09" — rótulo curto de um dia local. */
export function formatDayLabel(t: number | Date, long = false): string {
  const d = typeof t === "number" ? new Date(t) : t;
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    ...(long ? { year: "numeric" } : {}),
  });
}

// ---------------------------------------------------------------------------
// Agregação por dia local
// ---------------------------------------------------------------------------

export type HourlyRow = RawTimeseriesRow & { conversions?: number | string | null };

export type DayPoint = Counts & {
  /** "YYYY-MM-DD" local. */
  day: string;
  /** Meia-noite local do dia, em ms. */
  t: number;
};

/** Meias-noites locais dos dias que tocam [since, until). Limitado para não travar a UI. */
export function localDayGrid(since: Date, until: Date, max = 1_000): Date[] {
  const out: Date[] = [];
  let cur = startOfLocalDay(since);
  while (cur.getTime() < until.getTime() && out.length < max) {
    out.push(cur);
    cur = addLocalDays(cur, 1);
  }
  return out;
}

/**
 * Soma buckets horários (UTC, de `analytics_timeseries(..., 'hour')`) por dia
 * do fuso do navegador. Dias sem sessão entram com 0; buckets fora da grade
 * são mantidos (nunca descartamos dado).
 */
export function aggregateHourlyByLocalDay(
  rows: readonly HourlyRow[],
  since: Date,
  until: Date
): DayPoint[] {
  const map = new Map<string, DayPoint>();
  for (const d of localDayGrid(since, until)) {
    const day = fmtLocalDay(d);
    map.set(day, { day, t: d.getTime(), sessions: 0, pageviews: 0, conversions: 0 });
  }
  for (const r of rows) {
    const at = new Date(r.bucket);
    if (Number.isNaN(at.getTime())) continue;
    const day = fmtLocalDay(at);
    const cur = map.get(day) ?? {
      day,
      t: startOfLocalDay(at).getTime(),
      sessions: 0,
      pageviews: 0,
      conversions: 0,
    };
    cur.sessions += Number(r.sessions ?? 0) || 0;
    cur.pageviews += Number(r.pageviews ?? 0) || 0;
    cur.conversions += Number(r.conversions ?? 0) || 0;
    map.set(day, cur);
  }
  return [...map.values()].sort((a, b) => a.t - b.t);
}

// ---------------------------------------------------------------------------
// Tabela por dia
// ---------------------------------------------------------------------------

export type DayTableRow = DayPoint & {
  /** Dia em curso: só tem dados até `now`. */
  partial: boolean;
  /**
   * Base da variação: o dia anterior inteiro ou, no dia em curso, ontem até
   * o mesmo horário. `null` quando não há base (1º dia sem dia anterior).
   */
  base: Counts | null;
};

/**
 * Monta as linhas da tabela por dia. `days` deve começar UM dia antes do
 * período (`leadIn`), usado só como base do 1º dia. O dia em curso usa
 * `todayBase` (ontem até o mesmo horário) em vez do dia anterior inteiro.
 */
export function buildDayTable(
  days: readonly DayPoint[],
  opts: { from: Date; now: Date; todayBase?: Counts | null }
): DayTableRow[] {
  const fromKey = fmtLocalDay(opts.from);
  const todayKey = fmtLocalDay(opts.now);
  const out: DayTableRow[] = [];
  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    if (d.day < fromKey) continue; // lead-in: só serve de base
    if (d.day > todayKey) continue; // futuro: sem dados
    const partial = d.day === todayKey;
    const prevDay = i > 0 ? days[i - 1] : null;
    const base: Counts | null = partial
      ? (opts.todayBase ?? null)
      : prevDay
        ? {
            sessions: prevDay.sessions,
            pageviews: prevDay.pageviews,
            conversions: prevDay.conversions,
          }
        : null;
    out.push({ ...d, partial, base });
  }
  return out;
}
