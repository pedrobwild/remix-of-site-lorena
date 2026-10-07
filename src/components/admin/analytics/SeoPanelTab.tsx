/**
 * SeoPanelTab — aba "SEO" do /admin/analytics.
 *
 * Junta três fontes:
 * - Search Console (edge function `search-console-stats`, modo "panel"):
 *   cliques, impressões, CTR e posição do período e do anterior, por dia,
 *   busca, página, busca × página, dispositivo, país e sitemaps;
 * - `bewild_posts`: lista de artigos publicados, para mostrar também os que
 *   ainda não aparecem no Google;
 * - rastreamento próprio (`analytics_breakdown`): sessões vindas de
 *   assistentes de IA (ChatGPT, Perplexity, Gemini…) e de buscadores.
 *
 * A lógica de cálculo fica em `src/lib/seoPanel.ts` (testada).
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Bar,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { fmtLocalDay } from "@/lib/analyticsTimeseries";
import {
  aggregateSources,
  cannibalization,
  compareRows,
  ctrGaps,
  deltaDir,
  isBrandQuery,
  pathOf,
  pctChange,
  postPerformance,
  previousDays,
  strikingDistance,
  type Compared,
  type KeyRow,
  type Metrics,
  type PostInfo,
  type QueryPageRow,
  type SourceRow,
} from "@/lib/seoPanel";
import type { DateRange } from "./types";

type Sitemap = {
  path?: string;
  lastSubmitted?: string;
  lastDownloaded?: string;
  isPending?: boolean;
  errors?: string | number;
  warnings?: string | number;
  contents?: { type?: string; submitted?: string | number; indexed?: string | number }[];
};

type Panel = {
  version: number;
  start_date: string;
  end_date: string;
  prev_start_date: string;
  prev_end_date: string;
  totals: KeyRow;
  prev_totals: KeyRow;
  series: KeyRow[];
  prev_series: KeyRow[];
  queries: KeyRow[];
  prev_queries: KeyRow[];
  pages: KeyRow[];
  prev_pages: KeyRow[];
  query_pages: QueryPageRow[];
  devices: KeyRow[];
  countries: KeyRow[];
  sitemaps: Sitemap[];
};

type Data = { panel: Panel; posts: PostInfo[]; referrers: SourceRow[]; utm: SourceRow[] };

const nf = new Intl.NumberFormat("pt-BR");
const pct = (v: number) => `${(v * 100).toFixed(1).replace(".", ",")}%`;
const pos = (v: number) => (v ? v.toFixed(1).replace(".", ",") : "—");
const fmtDay = (iso?: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "—");
const short = (iso: string) => iso.slice(8, 10) + "/" + iso.slice(5, 7);

const DEVICE: Record<string, string> = { MOBILE: "celular", DESKTOP: "computador", TABLET: "tablet" };
const COUNTRY: Record<string, string> = {
  bra: "Brasil", usa: "Estados Unidos", prt: "Portugal", gbr: "Reino Unido", esp: "Espanha",
  ita: "Itália", fra: "França", deu: "Alemanha", can: "Canadá", arg: "Argentina", jpn: "Japão",
  che: "Suíça", irl: "Irlanda", aus: "Austrália", nld: "Países Baixos", mex: "México",
  ago: "Angola", moz: "Moçambique", cpv: "Cabo Verde", ind: "Índia", bgd: "Bangladesh", chn: "China",
  chl: "Chile", col: "Colômbia", per: "Peru", ury: "Uruguai", pry: "Paraguai", bol: "Bolívia",
  bel: "Bélgica", aut: "Áustria", swe: "Suécia", nor: "Noruega", dnk: "Dinamarca", pol: "Polônia",
  are: "Emirados Árabes", isr: "Israel", zaf: "África do Sul", kor: "Coreia do Sul", sgp: "Singapura",
  phl: "Filipinas", idn: "Indonésia", pak: "Paquistão", nga: "Nigéria", tur: "Turquia", rus: "Rússia",
  ukr: "Ucrânia", vnm: "Vietnã", tha: "Tailândia", mys: "Malásia", egy: "Egito", sau: "Arábia Saudita",
  nzl: "Nova Zelândia", ven: "Venezuela", ecu: "Equador", cri: "Costa Rica", pan: "Panamá", dom: "República Dominicana",
};

function Delta({ cur, prev, lowerIsBetter = false, kind = "pct" }: {
  cur: number;
  prev: number | null | undefined;
  lowerIsBetter?: boolean;
  kind?: "pct" | "abs" | "pp";
}) {
  if (prev === null || prev === undefined) {
    return <span className="aa-kpi__delta" data-dir="flat">{cur ? "novo" : "—"}</span>;
  }
  const dir = deltaDir(cur, prev, lowerIsBetter);
  let label: string;
  if (kind === "abs") {
    const d = cur - prev;
    label = `${d > 0 ? "+" : ""}${d.toFixed(1).replace(".", ",")}`;
  } else if (kind === "pp") {
    const d = (cur - prev) * 100;
    label = `${d > 0 ? "+" : ""}${d.toFixed(1).replace(".", ",")} p.p.`;
  } else {
    const c = pctChange(cur, prev);
    label = c === null ? "novo" : `${c > 0 ? "+" : ""}${Math.round(c * 100)}%`;
  }
  return (
    <span className="aa-kpi__delta" data-dir={dir} title={`antes: ${kind === "pp" ? pct(prev) : kind === "abs" ? pos(prev) : nf.format(prev)}`}>
      {dir === "up" ? "▲" : dir === "down" ? "▼" : "•"} {label}
    </span>
  );
}

function Card({ title, hint, action, children }: { title: string; hint?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="aa-card">
      <div className="aa-card__head">
        <h3 className="aa-card__title">{title}</h3>
        {action}
      </div>
      {hint && (
        <p className="aa-faint" style={{ fontSize: "var(--aa-text-xs)", margin: "0 0 8px" }}>{hint}</p>
      )}
      {children}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="aa-empty">
      <span className="aa-empty__icon">∅</span>
      {children}
    </div>
  );
}

function Seg<T extends string>({ value, options, onChange }: {
  value: T;
  options: { key: T; label: string; count?: number }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="aa-row" role="tablist" style={{ gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          role="tab"
          aria-selected={value === o.key}
          className="aa-chip"
          onClick={() => onChange(o.key)}
          style={value === o.key ? { borderColor: "var(--aa-accent)", color: "var(--aa-accent)" } : undefined}
        >
          {o.label}
          {o.count !== undefined && <span className="aa-faint"> {nf.format(o.count)}</span>}
        </button>
      ))}
    </div>
  );
}

type Col<R> = {
  key: string;
  label: string;
  num?: boolean;
  render: (r: R) => ReactNode;
  sort?: (r: R) => number | string;
};

function Table<R>({ rows, cols, initialSort, limit = 15, rowKey }: {
  rows: R[];
  cols: Col<R>[];
  initialSort?: string;
  limit?: number;
  rowKey: (r: R) => string;
}) {
  const [sortKey, setSortKey] = useState(initialSort ?? "");
  const [asc, setAsc] = useState(false);
  const [all, setAll] = useState(false);
  const sorted = useMemo(() => {
    const col = cols.find((c) => c.key === sortKey);
    if (!col?.sort) return rows;
    const get = col.sort;
    return [...rows].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      const d = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
      return asc ? d : -d;
    });
  }, [rows, cols, sortKey, asc]);
  const shown = all ? sorted : sorted.slice(0, limit);
  return (
    <>
      <div style={{ overflowX: "auto" }}>
        <table className="aa-table">
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.key} className={c.num ? "num" : undefined}>
                  {c.sort ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (sortKey === c.key) setAsc(!asc);
                        else {
                          setSortKey(c.key);
                          setAsc(false);
                        }
                      }}
                      style={{ all: "inherit", cursor: "pointer" }}
                      aria-sort={sortKey === c.key ? (asc ? "ascending" : "descending") : "none"}
                    >
                      {c.label}
                      {sortKey === c.key ? (asc ? " ↑" : " ↓") : ""}
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={rowKey(r)}>
                {cols.map((c, i) => (
                  <td
                    key={c.key}
                    className={c.num ? "num" : undefined}
                    style={c.num ? { whiteSpace: "nowrap" } : { overflowWrap: "anywhere", minWidth: i === 0 ? 180 : undefined }}
                  >
                    {c.render(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.length > limit && (
        <p style={{ margin: "8px 0 0", fontSize: "var(--aa-text-xs)" }}>
          <button type="button" onClick={() => setAll(!all)}>
            {all ? "mostrar menos" : `mostrar todas (${nf.format(sorted.length)})`}
          </button>
        </p>
      )}
    </>
  );
}

const linkPath = (url: string) => {
  const p = pathOf(url);
  return (
    <a href={p} target="_blank" rel="noreferrer">
      {p}
    </a>
  );
};

function metricCols<R>(get: (r: R) => Metrics, getPrev?: (r: R) => Metrics | null): Col<R>[] {
  return [
    {
      key: "impressions",
      label: "impressões",
      num: true,
      sort: (r) => get(r).impressions,
      render: (r) => (
        <>
          {nf.format(get(r).impressions)}{" "}
          {getPrev && <Delta cur={get(r).impressions} prev={getPrev(r)?.impressions ?? null} />}
        </>
      ),
    },
    { key: "clicks", label: "cliques", num: true, sort: (r) => get(r).clicks, render: (r) => nf.format(get(r).clicks) },
    { key: "ctr", label: "CTR", num: true, sort: (r) => get(r).ctr, render: (r) => pct(get(r).ctr) },
    {
      key: "position",
      label: "posição",
      num: true,
      sort: (r) => -(get(r).position || 999),
      render: (r) => (
        <>
          {pos(get(r).position)}{" "}
          {getPrev && getPrev(r) && get(r).position > 0 && (
            <Delta cur={get(r).position} prev={getPrev(r)!.position} lowerIsBetter kind="abs" />
          )}
        </>
      ),
    },
  ];
}

export default function SeoPanelTab({ range }: { range: DateRange }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outdated, setOutdated] = useState(false);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const endDay = range.to.getTime() > today.getTime() ? today : range.to;
  const start = fmtLocalDay(range.from);
  const end = fmtLocalDay(endDay);
  const prev = previousDays(start, end);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setOutdated(false);
    const since = new Date(`${start}T00:00:00`).toISOString();
    const until = new Date(new Date(`${end}T00:00:00`).getTime() + 86_400_000).toISOString();
    try {
      const [gsc, posts, refs, utm] = await Promise.all([
        supabase.functions.invoke("search-console-stats", {
          body: { mode: "panel", start_date: start, end_date: end, prev_start_date: prev.start, prev_end_date: prev.end },
        }),
        supabase
          .from("bewild_posts" as never)
          .select("slug,title,published_at,content_updated_at,focus_keyword")
          .eq("published", true),
        supabase.rpc("analytics_breakdown" as never, { p_since: since, p_until: until, p_dim: "referrer_host", p_limit: 500 } as never),
        supabase.rpc("analytics_breakdown" as never, { p_since: since, p_until: until, p_dim: "utm_source", p_limit: 500 } as never),
      ]);
      if (gsc.error) throw new Error("Não foi possível ler o Search Console.");
      const panel = gsc.data as Panel;
      if (!panel || panel.version !== 2) {
        setOutdated(true);
        setData(null);
        return;
      }
      // content_updated_at pode não existir num banco antigo: tenta sem ele.
      let postRows = (posts.data ?? []) as unknown as PostInfo[];
      if (posts.error) {
        const retry = await supabase
          .from("bewild_posts" as never)
          .select("slug,title,published_at,focus_keyword")
          .eq("published", true);
        postRows = (retry.data ?? []) as unknown as PostInfo[];
      }
      setData({
        panel,
        posts: postRows,
        referrers: ((refs as { data: SourceRow[] | null }).data ?? []) as SourceRow[],
        utm: ((utm as { data: SourceRow[] | null }).data ?? []) as SourceRow[],
      });
    } catch (e) {
      setError((e as Error).message || "Falha ao carregar o painel de SEO.");
    } finally {
      setLoading(false);
    }
  }, [start, end, prev.start, prev.end]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="aa-grid">
        <div className="aa-col-12 aa-skel" style={{ height: 92 }} />
        <div className="aa-col-12 aa-skel" style={{ height: 260 }} />
        <div className="aa-col-12 aa-skel" style={{ height: 300 }} />
      </div>
    );
  }
  if (outdated) {
    return (
      <div className="aa-card">
        <div className="aa-empty">
          <span className="aa-empty__icon">!</span>
          A função de dados do Search Console ainda está na versão anterior. Publique o projeto para ativar o
          painel de SEO. <button type="button" onClick={load}>tentar de novo</button>
        </div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="aa-card">
        <div className="aa-empty">
          <span className="aa-empty__icon">!</span>
          {error ?? "sem dados"} <button type="button" onClick={load}>tentar de novo</button>
        </div>
      </div>
    );
  }

  return <SeoPanelView data={data} loading={loading} onReload={load} />;
}

type QFilter = "todas" | "naomarca" | "marca" | "novas" | "perdidas";
type OppTab = "quase" | "ctr" | "canibal";
type PostFilter = "todos" | "sem" | "editados";

export function SeoPanelView({ data, loading, onReload }: { data: Data; loading: boolean; onReload: () => void }) {
  const { panel, posts } = data;
  const t = panel.totals;
  const pt = panel.prev_totals;
  const [qf, setQf] = useState<QFilter>("naomarca");
  const [opp, setOpp] = useState<OppTab>("quase");
  const [pf, setPf] = useState<PostFilter>("todos");

  const queries = useMemo(() => compareRows(panel.queries, panel.prev_queries), [panel]);
  const pages = useMemo(() => compareRows(panel.pages, panel.prev_pages), [panel]);
  const brandCur = useMemo(() => panel.queries.filter((r) => isBrandQuery(r.key)), [panel]);
  const brandClicks = brandCur.reduce((s, r) => s + r.clicks, 0);
  const qCounts = useMemo(() => {
    const c = { todas: 0, naomarca: 0, marca: 0, novas: 0, perdidas: 0 };
    for (const r of queries) {
      if (r.status !== "perdida") {
        c.todas++;
        if (isBrandQuery(r.key)) c.marca++;
        else c.naomarca++;
      }
      if (r.status === "nova") c.novas++;
      if (r.status === "perdida") c.perdidas++;
    }
    return c;
  }, [queries]);
  const qRows = useMemo(() => {
    return queries.filter((r) => {
      if (qf === "perdidas") return r.status === "perdida";
      if (r.status === "perdida") return false;
      if (qf === "novas") return r.status === "nova";
      if (qf === "marca") return isBrandQuery(r.key);
      if (qf === "naomarca") return !isBrandQuery(r.key);
      return true;
    });
  }, [queries, qf]);

  const striking = useMemo(() => strikingDistance(panel.queries.filter((r) => !isBrandQuery(r.key))), [panel]);
  const gaps = useMemo(() => ctrGaps(panel.pages), [panel]);
  const cannibals = useMemo(() => cannibalization(panel.query_pages), [panel]);

  const postRows = useMemo(
    () => postPerformance(posts, panel.pages, panel.prev_pages, panel.query_pages),
    [posts, panel],
  );
  const blogTotals = useMemo(() => {
    const blog = panel.pages.filter((r) => pathOf(r.key).startsWith("/conteudos/"));
    const clicks = blog.reduce((s, r) => s + r.clicks, 0);
    const impressions = blog.reduce((s, r) => s + r.impressions, 0);
    return { clicks, impressions, withImpr: postRows.filter((p) => p.cur.impressions > 0).length };
  }, [panel, postRows]);
  const postFiltered = useMemo(() => {
    const since = panel.start_date;
    if (pf === "sem") return postRows.filter((p) => p.cur.impressions === 0);
    if (pf === "editados") return postRows.filter((p) => (p.content_updated_at ?? "").slice(0, 10) >= since);
    return postRows;
  }, [postRows, pf, panel.start_date]);

  const sources = useMemo(() => aggregateSources(data.referrers, data.utm), [data]);

  const chart = useMemo(() => {
    const prevByIdx = panel.prev_series;
    return panel.series.map((r, i) => ({
      day: r.key,
      clicks: r.clicks,
      impressions: r.impressions,
      prevImpressions: prevByIdx[i]?.impressions ?? null,
    }));
  }, [panel]);

  const kpis: { label: string; value: string; delta: ReactNode }[] = [
    { label: "cliques na busca", value: nf.format(t.clicks), delta: <Delta cur={t.clicks} prev={pt.clicks} /> },
    { label: "impressões", value: nf.format(t.impressions), delta: <Delta cur={t.impressions} prev={pt.impressions} /> },
    { label: "CTR", value: pct(t.ctr), delta: <Delta cur={t.ctr} prev={pt.ctr} kind="pp" /> },
    {
      label: "posição média",
      value: pos(t.position),
      delta: <Delta cur={t.position} prev={pt.position} lowerIsBetter kind="abs" />,
    },
    {
      label: "buscas com impressão",
      value: nf.format(panel.queries.length),
      delta: <Delta cur={panel.queries.length} prev={panel.prev_queries.length} />,
    },
    {
      label: "cliques fora da marca",
      value: nf.format(t.clicks - brandClicks),
      delta: (
        <span className="aa-kpi__delta" data-dir="flat">
          {t.clicks ? `${Math.round(((t.clicks - brandClicks) / t.clicks) * 100)}% do total` : "—"}
        </span>
      ),
    },
    {
      label: "artigos com impressão",
      value: `${blogTotals.withImpr}/${postRows.length}`,
      delta: (
        <span className="aa-kpi__delta" data-dir="flat">
          {nf.format(blogTotals.impressions)} impressões no blog
        </span>
      ),
    },
    {
      label: "sessões vindas de IAs",
      value: nf.format(sources.iaTotal),
      delta: (
        <span className="aa-kpi__delta" data-dir="flat">
          {sources.buscaTotal ? `${nf.format(sources.buscaTotal)} de buscadores` : "rastreamento próprio"}
        </span>
      ),
    },
  ];

  const qCols: Col<Compared<KeyRow>>[] = [
    {
      key: "key",
      label: "busca",
      sort: (r) => r.key,
      render: (r) => (
        <>
          {r.key}
          {r.status === "nova" && <span className="aa-faint"> · nova</span>}
        </>
      ),
    },
    ...metricCols<Compared<KeyRow>>(
      (r) => (r.status === "perdida" ? r.prev! : r),
      (r) => (r.status === "perdida" ? null : r.prev),
    ),
  ];

  const sm = panel.sitemaps ?? [];

  return (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(0, 1fr)" }}>
      <p className="aa-faint" style={{ fontSize: "var(--aa-text-xs)", margin: 0 }}>
        {fmtDay(panel.start_date)} a {fmtDay(panel.end_date)} · comparado com {fmtDay(panel.prev_start_date)} a{" "}
        {fmtDay(panel.prev_end_date)} · inclui dados preliminares dos últimos 2 a 3 dias ·{" "}
        <button type="button" onClick={onReload} disabled={loading}>
          {loading ? "atualizando…" : "atualizar"}
        </button>{" "}
        · <a href="/admin/indexacao">indexação</a> · <a href="/admin/seo">SEO das páginas</a>
      </p>

      <div className="aa-kpi-grid">
        {kpis.map((k) => (
          <div key={k.label} className="aa-kpi">
            <span className="aa-kpi__label">{k.label}</span>
            <span className="aa-kpi__value num">{k.value}</span>
            {k.delta}
          </div>
        ))}
      </div>

      <Card title="cliques e impressões por dia" hint="barras: cliques · linha: impressões · tracejado: impressões do período anterior, dia a dia">
        {chart.length === 0 ? (
          <Empty>o Google ainda não informou dados para o período</Empty>
        ) : (
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chart} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="var(--aa-border)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tickFormatter={(d: string) => short(d)}
                  tick={{ fontSize: "var(--aa-text-2xs)", fontFamily: "var(--aa-font-mono)", fill: "var(--aa-fg-faint)" }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis
                  yAxisId="c"
                  allowDecimals={false}
                  width={32}
                  tick={{ fontSize: "var(--aa-text-2xs)", fontFamily: "var(--aa-font-mono)", fill: "var(--aa-fg-faint)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="i"
                  orientation="right"
                  allowDecimals={false}
                  width={40}
                  tick={{ fontSize: "var(--aa-text-2xs)", fontFamily: "var(--aa-font-mono)", fill: "var(--aa-fg-faint)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--aa-bg-elev)",
                    border: "1px solid var(--aa-border)",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                  labelFormatter={(d) => fmtDay(String(d))}
                  formatter={(v, name) => [
                    nf.format(Number(v)),
                    name === "clicks" ? "cliques" : name === "impressions" ? "impressões" : "impressões (anterior)",
                  ]}
                />
                <Bar yAxisId="c" dataKey="clicks" fill="var(--aa-accent-conversions)" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                <Line yAxisId="i" type="monotone" dataKey="impressions" stroke="var(--aa-accent)" strokeWidth={1.6} dot={false} isAnimationActive={false} />
                <Line
                  yAxisId="i"
                  type="monotone"
                  dataKey="prevImpressions"
                  stroke="var(--aa-fg-faint)"
                  strokeDasharray="4 3"
                  strokeWidth={1}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card
        title="oportunidades"
        hint="calculado a partir do Search Console. Potencial = cliques a mais estimados por uma curva de CTR de referência, só para priorizar."
      >
        <Seg<OppTab>
          value={opp}
          onChange={setOpp}
          options={[
            { key: "quase", label: "quase no topo (posição 4 a 20)", count: striking.length },
            { key: "ctr", label: "CTR abaixo do esperado", count: gaps.length },
            { key: "canibal", label: "canibalização", count: cannibals.length },
          ]}
        />
        {opp === "quase" &&
          (striking.length === 0 ? (
            <Empty>nenhuma busca fora da marca entre a posição 4 e a 20 com 3+ impressões</Empty>
          ) : (
            <Table
              rows={striking}
              rowKey={(r) => r.key}
              initialSort="potential"
              cols={[
                { key: "key", label: "busca", render: (r) => r.key, sort: (r) => r.key },
                ...metricCols<(typeof striking)[number]>((r) => r),
                { key: "potential", label: "potencial", num: true, sort: (r) => r.potentialClicks, render: (r) => `+${nf.format(r.potentialClicks)}` },
              ]}
            />
          ))}
        {opp === "ctr" &&
          (gaps.length === 0 ? (
            <Empty>nenhuma página do top 10 com CTR muito abaixo da referência</Empty>
          ) : (
            <>
              <p className="aa-faint" style={{ fontSize: "var(--aa-text-xs)", margin: "0 0 8px" }}>
                Páginas que já aparecem bem, mas recebem poucos cliques: revise meta title e meta description.
              </p>
              <Table
                rows={gaps}
                rowKey={(r) => r.key}
                initialSort="potential"
                cols={[
                  { key: "key", label: "página", render: (r) => linkPath(r.key), sort: (r) => r.key },
                  ...metricCols<(typeof gaps)[number]>((r) => r),
                  { key: "potential", label: "potencial", num: true, sort: (r) => r.potentialClicks, render: (r) => `+${nf.format(r.potentialClicks)}` },
                ]}
              />
            </>
          ))}
        {opp === "canibal" &&
          (cannibals.length === 0 ? (
            <Empty>nenhuma busca dividida entre duas ou mais páginas</Empty>
          ) : (
            <Table
              rows={cannibals}
              rowKey={(r) => r.query}
              initialSort="impr"
              cols={[
                { key: "query", label: "busca", render: (r) => r.query, sort: (r) => r.query },
                { key: "impr", label: "impressões", num: true, sort: (r) => r.impressions, render: (r) => nf.format(r.impressions) },
                {
                  key: "pages",
                  label: "páginas que disputam (fatia · posição)",
                  render: (r) => (
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {r.pages.map((p) => (
                        <li key={p.page}>
                          {linkPath(p.page)} <span className="aa-faint">{pct(p.share)} · {pos(p.position)}</span>
                        </li>
                      ))}
                    </ul>
                  ),
                },
              ]}
            />
          ))}
      </Card>

      <Card
        title="artigos do blog"
        hint={`${nf.format(blogTotals.clicks)} cliques e ${nf.format(blogTotals.impressions)} impressões em /conteudos no período. "Editados no período" usa a data real de edição do conteúdo.`}
      >
        <Seg<PostFilter>
          value={pf}
          onChange={setPf}
          options={[
            { key: "todos", label: "todos", count: postRows.length },
            { key: "sem", label: "sem impressão", count: postRows.filter((p) => p.cur.impressions === 0).length },
            {
              key: "editados",
              label: "editados no período",
              count: postRows.filter((p) => (p.content_updated_at ?? "").slice(0, 10) >= panel.start_date).length,
            },
          ]}
        />
        {postFiltered.length === 0 ? (
          <Empty>nenhum artigo neste filtro</Empty>
        ) : (
          <Table
            rows={postFiltered}
            rowKey={(r) => r.slug}
            initialSort="impressions"
            limit={20}
            cols={[
              {
                key: "title",
                label: "artigo",
                sort: (r) => r.title,
                render: (r) => (
                  <>
                    <a href={r.path} target="_blank" rel="noreferrer">{r.title}</a>
                    {r.topQuery && <div className="aa-faint" style={{ fontSize: "var(--aa-text-xs)" }}>busca principal: {r.topQuery}</div>}
                  </>
                ),
              },
              { key: "pub", label: "publicado", sort: (r) => r.published_at ?? "", render: (r) => fmtDay(r.published_at) },
              { key: "upd", label: "editado", sort: (r) => r.content_updated_at ?? "", render: (r) => fmtDay(r.content_updated_at) },
              ...metricCols<(typeof postRows)[number]>((r) => r.cur, (r) => r.prev),
            ]}
          />
        )}
      </Card>

      <Card title="buscas" hint="marca = buscas com Bewild/Bwild. Variação comparada ao período anterior.">
        <Seg<QFilter>
          value={qf}
          onChange={setQf}
          options={[
            { key: "naomarca", label: "fora da marca", count: qCounts.naomarca },
            { key: "marca", label: "marca", count: qCounts.marca },
            { key: "todas", label: "todas", count: qCounts.todas },
            { key: "novas", label: "novas", count: qCounts.novas },
            { key: "perdidas", label: "perdidas", count: qCounts.perdidas },
          ]}
        />
        {qRows.length === 0 ? (
          <Empty>nenhuma busca neste filtro</Empty>
        ) : (
          <Table rows={qRows} rowKey={(r) => r.key} cols={qCols} initialSort="impressions" />
        )}
      </Card>

      <Card title="páginas" hint="todas as páginas do site que apareceram na busca do Google.">
        {pages.length === 0 ? (
          <Empty>nenhuma página com impressão no período</Empty>
        ) : (
          <Table
            rows={pages.filter((r) => r.status !== "perdida")}
            rowKey={(r) => r.key}
            initialSort="impressions"
            cols={[
              { key: "key", label: "página", sort: (r) => pathOf(r.key), render: (r) => linkPath(r.key) },
              ...metricCols<Compared<KeyRow>>((r) => r, (r) => r.prev),
            ]}
          />
        )}
      </Card>

      <div className="aa-grid">
        <div className="aa-col-6">
          <Card
            title="visitas vindas de IAs"
            hint="sessões do rastreamento próprio cujo referenciador (ou utm_source) é um assistente de IA. Respostas sem clique não aparecem aqui."
          >
            {sources.ia.length === 0 ? (
              <Empty>nenhuma visita de assistente de IA no período</Empty>
            ) : (
              <Table
                rows={sources.ia}
                rowKey={(r) => r.name}
                initialSort="s"
                cols={[
                  { key: "name", label: "assistente", render: (r) => r.name, sort: (r) => r.name },
                  { key: "s", label: "sessões", num: true, sort: (r) => r.sessions, render: (r) => nf.format(r.sessions) },
                  { key: "c", label: "conversões", num: true, sort: (r) => r.conversions, render: (r) => nf.format(r.conversions) },
                ]}
              />
            )}
          </Card>
        </div>
        <div className="aa-col-6">
          <Card title="visitas vindas de buscadores" hint="sessões do rastreamento próprio por buscador de origem.">
            {sources.busca.length === 0 ? (
              <Empty>nenhuma visita de buscador no período</Empty>
            ) : (
              <Table
                rows={sources.busca}
                rowKey={(r) => r.name}
                initialSort="s"
                cols={[
                  { key: "name", label: "buscador", render: (r) => r.name, sort: (r) => r.name },
                  { key: "s", label: "sessões", num: true, sort: (r) => r.sessions, render: (r) => nf.format(r.sessions) },
                  { key: "c", label: "conversões", num: true, sort: (r) => r.conversions, render: (r) => nf.format(r.conversions) },
                ]}
              />
            )}
          </Card>
        </div>
        <div className="aa-col-6">
          <Card title="dispositivos">
            {panel.devices.length === 0 ? (
              <Empty>sem dados</Empty>
            ) : (
              <Table
                rows={panel.devices}
                rowKey={(r) => r.key}
                initialSort="impressions"
                cols={[
                  { key: "key", label: "dispositivo", render: (r) => DEVICE[r.key] ?? r.key.toLowerCase() },
                  ...metricCols<KeyRow>((r) => r),
                ]}
              />
            )}
          </Card>
        </div>
        <div className="aa-col-6">
          <Card title="países">
            {panel.countries.length === 0 ? (
              <Empty>sem dados</Empty>
            ) : (
              <Table
                rows={panel.countries}
                rowKey={(r) => r.key}
                initialSort="impressions"
                limit={8}
                cols={[
                  { key: "key", label: "país", render: (r) => COUNTRY[r.key] ?? r.key.toUpperCase() },
                  ...metricCols<KeyRow>((r) => r),
                ]}
              />
            )}
          </Card>
        </div>
      </div>

      <Card title="sitemaps no Search Console">
        {sm.length === 0 ? (
          <Empty>nenhum sitemap enviado</Empty>
        ) : (
          <Table
            rows={sm}
            rowKey={(r) => r.path ?? ""}
            cols={[
              { key: "path", label: "sitemap", render: (r) => r.path ?? "—" },
              { key: "sub", label: "enviado", render: (r) => fmtDay(r.lastSubmitted) },
              { key: "down", label: "lido pelo Google", render: (r) => fmtDay(r.lastDownloaded) },
              { key: "pend", label: "situação", render: (r) => (r.isPending ? "aguardando leitura" : "processado") },
              {
                key: "urls",
                label: "URLs enviadas",
                num: true,
                render: (r) => nf.format((r.contents ?? []).reduce((s, c) => s + Number(c.submitted ?? 0), 0)),
              },
              {
                key: "err",
                label: "erros / avisos",
                num: true,
                render: (r) => `${Number(r.errors ?? 0)} / ${Number(r.warnings ?? 0)}`,
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
