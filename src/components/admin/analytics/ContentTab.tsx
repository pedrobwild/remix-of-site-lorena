/**
 * ContentTab — aba "Conteúdo": acessos de CADA artigo do blog e de CADA
 * projeto do portfólio no período, inclusive os que não tiveram acesso.
 *
 * Fonte: pageviews próprios (`analytics_top_paths_v2`) agrupados por caminho
 * em `src/lib/contentViews.ts`; cadastro em `bewild_posts` e `projects`.
 * Respeita o período, os segmentos ativos e o "comparar com período anterior"
 * do shell. Como todo o painel, só conta visitantes que aceitaram os cookies.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { devError } from "@/lib/devLog";
import { alignedPreviousWindow, trend } from "@/lib/analyticsCompare";
import {
  buildContentRows,
  contentRowsToCsv,
  contentTotals,
  type ContentItem,
  type ContentKind,
  type ContentRow,
  type PathViews,
} from "@/lib/contentViews";
import type { DateRange, Segment } from "./types";
import { ALL_PATHS_LIMIT, segArgs } from "./segmentArgs";

type Props = {
  range: DateRange;
  segments: Segment[];
  comparePrev: boolean;
};

type SortKey = "pageviews" | "sessions" | "delta" | "title";

type Loaded = {
  paths: PathViews[];
  prevPaths: PathViews[] | null;
  posts: ContentItem[];
  projects: ContentItem[];
};

type RpcRes<T> = { data: T | null; error: { message: string } | null };

const fmtNum = (n: number) => Math.round(n).toLocaleString("pt-BR");
const fmtPct = (n: number) => `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");

function toPaths(res: unknown): PathViews[] {
  const r = res as RpcRes<{ path: string; pageviews: number; sessions: number }[]>;
  if (r.error) throw new Error(r.error.message);
  return (r.data ?? []).map((x) => ({
    path: x.path,
    pageviews: Number(x.pageviews ?? 0),
    sessions: Number(x.sessions ?? 0),
  }));
}

export default function ContentTab({ range, segments, comparePrev }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Loaded | null>(null);
  const [kind, setKind] = useState<ContentKind>("post");
  const [query, setQuery] = useState("");
  const [hideZero, setHideZero] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "pageviews", desc: true });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const sa = segArgs(segments);
    const prev = comparePrev ? alignedPreviousWindow(range) : null;

    const pathsRpc = (since: Date, until: Date) =>
      Promise.resolve(
        supabase.rpc("analytics_top_paths_v2", {
          p_since: since.toISOString(),
          p_until: until.toISOString(),
          p_limit: ALL_PATHS_LIMIT,
          ...sa,
        }),
      );

    Promise.all([
      pathsRpc(range.from, range.to),
      prev ? pathsRpc(prev.from, prev.until) : Promise.resolve(null),
      Promise.resolve(supabase.from("bewild_posts").select("slug,title,published,published_at")),
      Promise.resolve(supabase.from("projects").select("slug,title,published,neighborhood")),
    ])
      .then(([cur, prv, posts, projects]) => {
        if (cancelled) return;
        if (posts.error) throw new Error(posts.error.message);
        if (projects.error) throw new Error(projects.error.message);
        setData({
          paths: toPaths(cur),
          prevPaths: prv ? toPaths(prv) : null,
          posts: (posts.data ?? []) as ContentItem[],
          projects: (projects.data ?? []) as ContentItem[],
        });
      })
      .catch((err: unknown) => {
        devError("[content] load error", err);
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [range, segments, comparePrev]);

  const all = useMemo(() => {
    if (!data) return { post: [] as ContentRow[], project: [] as ContentRow[] };
    return {
      post: buildContentRows("post", data.posts, data.paths, data.prevPaths),
      project: buildContentRows("project", data.projects, data.paths, data.prevPaths),
    };
  }, [data]);

  const totals = useMemo(() => ({ post: contentTotals(all.post), project: contentTotals(all.project) }), [all]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = all[kind].filter(
      (r) =>
        (!hideZero || r.pageviews > 0) &&
        (!q || r.title.toLowerCase().includes(q) || r.slug.includes(q) || (r.neighborhood ?? "").toLowerCase().includes(q)),
    );
    const dir = sort.desc ? -1 : 1;
    const val = (r: ContentRow) =>
      sort.key === "delta" ? r.pageviews - (r.prevPageviews ?? 0) : sort.key === "title" ? 0 : r[sort.key];
    return [...list].sort((a, b) =>
      sort.key === "title" ? dir * a.title.localeCompare(b.title, "pt-BR") : dir * (val(a) - val(b)) || b.pageviews - a.pageviews,
    );
  }, [all, kind, query, hideZero, sort]);

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, desc: !s.desc } : { key, desc: key !== "title" }));
  }

  function downloadCsv() {
    const blob = new Blob(["\uFEFF" + contentRowsToCsv(rows, window.location.origin)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const day = (d: Date) => d.toLocaleDateString("sv-SE");
    a.download = `acessos-${kind === "post" ? "artigos" : "projetos"}-${day(range.from)}_${day(range.to)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (loading) {
    return (
      <div className="aa-grid">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="aa-col-3 aa-skel" style={{ height: 96 }} />
        ))}
        <div className="aa-col-12 aa-skel" style={{ height: 420 }} />
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

  const t = totals[kind];
  const label = kind === "post" ? "artigos" : "projetos";
  const max = rows.reduce((m, r) => Math.max(m, r.pageviews), 0) || 1;
  const prevTotal = comparePrev ? all[kind].reduce((s, r) => s + (r.prevPageviews ?? 0), 0) : null;
  const arrow = (key: SortKey) => (sort.key === key ? (sort.desc ? " ↓" : " ↑") : "");

  const kpis = [
    { label: "acessos a artigos", value: fmtNum(totals.post.pageviews), hint: `${fmtNum(totals.post.sessions)} sessões` },
    { label: "artigos com acesso", value: `${totals.post.withViews} de ${totals.post.items}`, hint: "no período" },
    { label: "acessos a projetos", value: fmtNum(totals.project.pageviews), hint: `${fmtNum(totals.project.sessions)} sessões` },
    { label: "projetos com acesso", value: `${totals.project.withViews} de ${totals.project.items}`, hint: "no período" },
  ];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="aa-kpi-grid">
        {kpis.map((k) => (
          <div key={k.label} className="aa-kpi">
            <span className="aa-kpi__label">{k.label}</span>
            <span className="aa-kpi__value">{k.value}</span>
            <span className="aa-kpi__hint aa-faint aa-mono" style={{ fontSize: "var(--aa-text-2xs)" }}>
              {k.hint}
            </span>
          </div>
        ))}
      </div>

      <div className="aa-card">
        <div className="aa-card__head" style={{ flexWrap: "wrap", gap: 8 }}>
          <div role="tablist" aria-label="tipo de conteúdo" style={{ display: "flex", gap: 2 }}>
            {(["post", "project"] as ContentKind[]).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={kind === k}
                className="aa-daterange__preset"
                data-active={kind === k}
                onClick={() => setKind(k)}
              >
                {k === "post" ? `Artigos do blog (${totals.post.items})` : `Projetos do portfólio (${totals.project.items})`}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginLeft: "auto" }}>
            <input
              className="aa-input"
              style={{ width: 220 }}
              placeholder={kind === "post" ? "buscar artigo" : "buscar projeto ou bairro"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="buscar"
            />
            <label className="aa-faint" style={{ display: "flex", gap: 6, alignItems: "center", fontSize: "var(--aa-text-sm)" }}>
              <input type="checkbox" checked={hideZero} onChange={(e) => setHideZero(e.target.checked)} />
              ocultar sem acesso
            </label>
            <button type="button" className="aa-daterange__preset" onClick={downloadCsv} disabled={rows.length === 0}>
              exportar CSV
            </button>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="aa-empty" style={{ padding: "24px 0", border: "none" }}>
            <span className="aa-empty__icon">∅</span>
            nenhum {kind === "post" ? "artigo" : "projeto"} encontrado
          </div>
        ) : (
          <div style={{ overflow: "auto" }}>
            <table className="aa-table">
              <thead>
                <tr>
                  <th style={{ cursor: "pointer" }} onClick={() => toggleSort("title")}>
                    {kind === "post" ? "artigo" : "projeto"}
                    {arrow("title")}
                  </th>
                  <th>{kind === "post" ? "publicado em" : "bairro"}</th>
                  <th className="num" style={{ cursor: "pointer" }} onClick={() => toggleSort("pageviews")}>
                    pv{arrow("pageviews")}
                  </th>
                  <th className="num" style={{ cursor: "pointer" }} onClick={() => toggleSort("sessions")}>
                    sessões{arrow("sessions")}
                  </th>
                  <th className="num">% dos {label}</th>
                  {comparePrev && (
                    <th className="num" style={{ cursor: "pointer" }} onClick={() => toggleSort("delta")}>
                      vs anterior{arrow("delta")}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const tr = r.prevPageviews === null ? null : trend(r.pageviews, r.prevPageviews);
                  return (
                    <tr key={`${r.kind}:${r.slug}`}>
                      <td>
                        <div style={{ display: "grid", gap: 4, minWidth: 220 }}>
                          <a
                            href={r.href}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "inherit", textDecoration: "none", ...ellipsis }}
                            title={`${r.title} — abrir ${r.href}`}
                          >
                            {r.title}
                          </a>
                          <span className="aa-faint aa-mono" style={{ fontSize: "var(--aa-text-2xs)", ...ellipsis }}>
                            {r.href}
                            {r.orphan ? " · fora do cadastro" : !r.published ? " · não publicado" : ""}
                          </span>
                          <Bar value={r.pageviews} max={max} />
                        </div>
                      </td>
                      <td className="aa-faint" style={{ whiteSpace: "nowrap" }}>
                        {kind === "post" ? fmtDate(r.published_at) : r.neighborhood || "—"}
                      </td>
                      <td className="num aa-mono">{fmtNum(r.pageviews)}</td>
                      <td className="num aa-mono">{fmtNum(r.sessions)}</td>
                      <td className="num aa-mono aa-faint">{t.pageviews ? fmtPct((r.pageviews / t.pageviews) * 100) : "—"}</td>
                      {comparePrev && (
                        <td className="num">
                          {tr && (
                            <span
                              className="aa-kpi__delta"
                              data-dir={tr.dir}
                              title={`antes: ${fmtNum(r.prevPageviews ?? 0)}`}
                            >
                              {tr.dir === "up" ? "↑" : tr.dir === "down" ? "↓" : "·"} {tr.label}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td className="aa-faint">
                    total · {rows.length} {rows.length === 1 ? "item" : "itens"}
                  </td>
                  <td />
                  <td className="num aa-mono">{fmtNum(rows.reduce((s, r) => s + r.pageviews, 0))}</td>
                  <td className="num aa-mono">{fmtNum(rows.reduce((s, r) => s + r.sessions, 0))}</td>
                  <td />
                  {comparePrev && (
                    <td className="num aa-mono aa-faint">{prevTotal !== null ? `antes: ${fmtNum(prevTotal)}` : ""}</td>
                  )}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <p className="aa-faint" style={{ fontSize: "var(--aa-text-2xs)", margin: "10px 0 0" }}>
          pv = visualizações de página em {kind === "post" ? "/conteudos/<slug> (inclui o antigo /blog/<slug>)" : "/portfolio/<slug>"} ·
          só conta visitantes que aceitaram os cookies, como o resto do painel.
        </p>
      </div>
    </div>
  );
}

const ellipsis: React.CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  maxWidth: 420,
  display: "inline-block",
};

function Bar({ value, max }: { value: number; max: number }) {
  return (
    <div
      aria-hidden
      style={{
        height: 3,
        width: `${(value / max) * 100}%`,
        background: "var(--aa-accent)",
        opacity: 0.55,
        borderRadius: 2,
      }}
    />
  );
}
