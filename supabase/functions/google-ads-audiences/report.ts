// Pure reporting logic, shared by the edge handler and regression tests.
export type Range = { from: string; to: string };
export type ReportRequest = Range & {
  segments: { dim: string; value: string }[];
  previous: Range | null;
};
export type Row = Record<string, any>;
export type Search = (query: string) => Promise<Row[]>;

export class InvalidFilter extends Error {}

function day(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new InvalidFilter("Use datas válidas no formato AAAA-MM-DD.");
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value)
    throw new InvalidFilter("O período contém uma data inexistente.");
  return value;
}

function range(value: Record<string, unknown>): Range {
  const from = day(value.from);
  const to = day(value.to);
  if (from > to) throw new InvalidFilter("A data inicial deve ser anterior ou igual à final.");
  return { from, to };
}

export function accountDay(now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** Compare exact paths, never substring-match /guide with /guide/other. */
export function normalizeLandingPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\"))
    throw new InvalidFilter(
      "A página de entrada deve ser um caminho do site, como /guia-do-investidor."
    );
  const path = new URL(value, "https://bewild.com.br").pathname;
  try {
    return decodeURIComponent(path).replace(/\/+$/, "") || "/";
  } catch {
    throw new InvalidFilter("A página de entrada contém uma codificação inválida.");
  }
}

export function parseRequest(input: unknown, today: string): ReportRequest {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new InvalidFilter("Filtros inválidos.");
  const body = input as Record<string, unknown>;
  // Backwards compatibility for the old frontend: 30 completed account days.
  const shift = (days: number) => {
    const d = new Date(`${today}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  };
  const selected =
    body.from === undefined && body.to === undefined
      ? { from: shift(-30), to: shift(-1) }
      : range(body);
  const segments = body.segments ?? [];
  if (!Array.isArray(segments)) throw new InvalidFilter("Segmentos inválidos.");
  if (segments.length > 1 || segments.some((s) => !s || s.dim !== "landing_path"))
    throw new InvalidFilter(
      "Nesta aba, use somente o segmento landing_path. Remova os demais filtros do site."
    );
  for (const s of segments) {
    if (typeof s.value !== "string" || s.value.length > 2048)
      throw new InvalidFilter("Página de entrada inválida.");
    normalizeLandingPath(s.value);
  }
  if (body.previous != null && (typeof body.previous !== "object" || Array.isArray(body.previous)))
    throw new InvalidFilter("Período de comparação inválido.");
  return {
    ...selected,
    segments: segments.map((s) => ({ dim: s.dim, value: s.value })),
    previous: body.previous == null ? null : range(body.previous as Record<string, unknown>),
  };
}

export function matchesLandingUrl(value: unknown, landingPath: string | null): boolean {
  if (landingPath === null) return true;
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      !["bewild.com.br", "www.bewild.com.br"].includes(url.hostname)
    )
      return false;
    return normalizeLandingPath(url.pathname) === landingPath;
  } catch {
    return false;
  }
}

/** URL values are matched after pagination, never interpolated into GAQL. */
export function reportQueries(period: Range, scoped: boolean) {
  const { from, to } = range(period);
  const dates = `segments.date BETWEEN '${from}' AND '${to}'`;
  const url = scoped ? "expanded_landing_page_view.expanded_final_url, " : "";
  const resource = scoped ? "expanded_landing_page_view" : "campaign";
  return {
    campaigns: `SELECT ${url}campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type,
      metrics.impressions, metrics.clicks, metrics.conversions, metrics.cost_micros
      FROM ${resource} WHERE ${dates}`,
    actions: `SELECT ${url}segments.conversion_action, metrics.conversions, metrics.all_conversions, metrics.conversions_value
      FROM ${scoped ? resource : "customer"} WHERE ${dates}`,
  };
}

const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export async function readPeriod(
  search: Search,
  period: Range,
  landingPath: string | null,
  actions: Row[]
) {
  const queries = reportQueries(period, landingPath !== null);
  const [campaignRows, actionRows] = await Promise.all([
    search(queries.campaigns),
    search(queries.actions),
  ]);
  const inScope = (row: Row) =>
    matchesLandingUrl(row.expandedLandingPageView?.expandedFinalUrl, landingPath);
  const campaigns = new Map<
    string,
    {
      id: string;
      name: string;
      status: string;
      channel: string;
      impressions: number;
      clicks: number;
      conversions: number;
      cost: number;
    }
  >();
  for (const row of campaignRows.filter(inScope)) {
    const c = row.campaign;
    if (!c?.id) continue;
    const id = String(c.id);
    const cur = campaigns.get(id) ?? {
      id,
      name: c.name ?? "",
      status: c.status ?? "",
      channel: c.advertisingChannelType ?? "",
      impressions: 0,
      clicks: 0,
      conversions: 0,
      cost: 0,
    };
    cur.impressions += n(row.metrics?.impressions);
    cur.clicks += n(row.metrics?.clicks);
    cur.conversions += n(row.metrics?.conversions);
    cur.cost += n(row.metrics?.costMicros) / 1_000_000;
    campaigns.set(id, cur);
  }
  // Join by immutable resource ID, not the mutable/non-unique action name.
  const metrics = new Map<string, { conversions: number; allConversions: number; value: number }>();
  for (const row of actionRows.filter(inScope)) {
    const id = String(row.segments?.conversionAction ?? "")
      .split("/")
      .pop()!;
    const cur = metrics.get(id) ?? { conversions: 0, allConversions: 0, value: 0 };
    cur.conversions += n(row.metrics?.conversions);
    cur.allConversions += n(row.metrics?.allConversions);
    cur.value += n(row.metrics?.conversionsValue);
    metrics.set(id, cur);
  }
  const conversions = actions
    .map((row) => {
      const action = row.conversionAction ?? {};
      const id = String(action.id);
      const values = metrics.get(id) ?? { conversions: 0, allConversions: 0, value: 0 };
      return {
        id,
        name: action.name ?? "",
        category: action.category ?? "",
        status: action.status ?? "",
        primary: !!action.primaryForGoal,
        ...values,
        // Transitional aliases for the currently published frontend.
        conversions30d: values.conversions,
        value30d: values.value,
      };
    })
    .sort((a, b) => b.conversions - a.conversions);
  const rows = [...campaigns.values()].sort((a, b) => b.cost - a.cost);
  return {
    range: { from: period.from, to: period.to },
    campaigns: rows,
    conversions,
    totals: rows.reduce(
      (total, c) => ({
        clicks: total.clicks + c.clicks,
        cost: total.cost + c.cost,
        impressions: total.impressions + c.impressions,
        conversions: total.conversions + c.conversions,
      }),
      { clicks: 0, cost: 0, impressions: 0, conversions: 0 }
    ),
  };
}
