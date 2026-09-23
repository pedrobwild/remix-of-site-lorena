/**
 * Datas e séries temporais do painel de Analytics (funções puras, testadas
 * em src/lib/__tests__/analyticsTimeseries.test.ts).
 *
 * 1. Datas na URL (`?from=YYYY-MM-DD&to=…`): gravar e ler SEMPRE em data
 *    local. Antes, a gravação usava `toISOString()` (UTC) e a leitura era
 *    local — em São Paulo (UTC−3) `to` = 23:59 local já é o dia seguinte em
 *    UTC, então cada recarga/link compartilhado empurrava o fim do período
 *    um dia para frente.
 *
 * 2. Série do gráfico: a RPC `analytics_timeseries` só devolve buckets com
 *    sessões (`group by date_trunc(...)`), e a série do período anterior era
 *    casada POR POSIÇÃO no array. Um dia sem visitas deslocava toda a
 *    comparação. Aqui a grade de buckets é gerada no cliente (dias vazios
 *    viram 0) e o período anterior é alinhado pelo deslocamento do bucket
 *    desde o início do período.
 *
 *    `date_trunc` roda no fuso da sessão do Postgres (UTC no Supabase), então
 *    a grade é montada em UTC. Se algum bucket do servidor não cair na grade
 *    (fuso diferente), ele é mantido assim mesmo — nunca descartamos dado.
 */

export type Grain = "hour" | "day" | "week" | "month";

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

// ---------------------------------------------------------------------------
// Datas locais (querystring)
// ---------------------------------------------------------------------------

/** "YYYY-MM-DD" na data LOCAL (não UTC). */
export function fmtLocalDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Lê "YYYY-MM-DD" como meia-noite LOCAL; rejeita datas inexistentes (ex.: 2026-02-31). */
export function parseLocalDay(s: string | null | undefined): Date | null {
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const date = new Date(y, mo, d);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== y ||
    date.getMonth() !== mo ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

// ---------------------------------------------------------------------------
// Grade de buckets
// ---------------------------------------------------------------------------

/** Granularidade pela duração do período: ≤2 dias = hora, ≤90 = dia, ≤365 = semana, > = mês. */
export function pickGrain(from: Date, to: Date): Grain {
  const days = (to.getTime() - from.getTime()) / DAY_MS;
  return days <= 2 ? "hour" : days <= 90 ? "day" : days <= 365 ? "week" : "month";
}

/** Início do bucket em UTC, como `date_trunc(grain, ts)` com TimeZone = UTC. */
export function truncUtc(d: Date, grain: Grain): Date {
  const x = new Date(d.getTime());
  if (grain === "hour") {
    x.setUTCMinutes(0, 0, 0);
    return x;
  }
  x.setUTCHours(0, 0, 0, 0);
  if (grain === "day") return x;
  if (grain === "week") {
    // ISO: semana começa na segunda-feira.
    const dow = (x.getUTCDay() + 6) % 7;
    x.setUTCDate(x.getUTCDate() - dow);
    return x;
  }
  x.setUTCDate(1);
  return x;
}

export function addGrain(d: Date, grain: Grain, n = 1): Date {
  if (grain === "hour") return new Date(d.getTime() + n * HOUR_MS);
  if (grain === "day") return new Date(d.getTime() + n * DAY_MS);
  if (grain === "week") return new Date(d.getTime() + n * 7 * DAY_MS);
  const x = new Date(d.getTime());
  x.setUTCMonth(x.getUTCMonth() + n);
  return x;
}

/** Inícios de bucket (ms) que tocam o intervalo [since, until). Limitado para não travar a UI. */
export function bucketGrid(since: Date, until: Date, grain: Grain, max = 2_000): number[] {
  const out: number[] = [];
  let cur = truncUtc(since, grain);
  while (cur.getTime() < until.getTime() && out.length < max) {
    out.push(cur.getTime());
    cur = addGrain(cur, grain);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Preenchimento e alinhamento
// ---------------------------------------------------------------------------

export type RawTimeseriesRow = {
  bucket: string;
  sessions?: number | string | null;
  pageviews?: number | string | null;
};

export type SeriesPoint = {
  /** Início do bucket em ms (UTC). */
  t: number;
  sessions: number;
  pageviews: number;
  prevSessions?: number;
  prevPageviews?: number;
};

/** Série completa do período: buckets sem sessões entram com 0. */
export function fillTimeseries(
  rows: readonly RawTimeseriesRow[],
  since: Date,
  until: Date,
  grain: Grain,
): SeriesPoint[] {
  const map = new Map<number, SeriesPoint>();
  for (const t of bucketGrid(since, until, grain)) map.set(t, { t, sessions: 0, pageviews: 0 });
  for (const r of rows) {
    const t = new Date(r.bucket).getTime();
    if (Number.isNaN(t)) continue;
    const cur = map.get(t) ?? { t, sessions: 0, pageviews: 0 };
    cur.sessions += Number(r.sessions ?? 0) || 0;
    cur.pageviews += Number(r.pageviews ?? 0) || 0;
    map.set(t, cur);
  }
  return [...map.values()].sort((a, b) => a.t - b.t);
}

/**
 * Casa cada bucket do período atual com o bucket do período anterior de
 * mesmo deslocamento (1º com 1º, 2º com 2º…). Como as duas séries vêm de
 * `fillTimeseries`, posição = deslocamento em buckets desde o início.
 */
export function alignPrevious(
  current: readonly SeriesPoint[],
  previous: readonly SeriesPoint[],
): SeriesPoint[] {
  return current.map((p, i) => {
    const prev = previous[i];
    return prev ? { ...p, prevSessions: prev.sessions, prevPageviews: prev.pageviews } : { ...p };
  });
}

/** Rótulo do eixo X para um bucket. Buckets de dia/semana/mês são datas UTC. */
export function formatBucketLabel(t: number, grain: Grain, long = false): string {
  const d = new Date(t);
  if (grain === "hour") {
    return d.toLocaleString("pt-BR", long
      ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }
      : { hour: "2-digit", minute: "2-digit" });
  }
  if (grain === "month") {
    return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" });
  }
  const label = d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    ...(long ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
  return grain === "week" ? `sem. ${label}` : label;
}
