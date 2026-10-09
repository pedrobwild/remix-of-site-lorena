/**
 * Acessos por artigo do blog e por projeto do portfólio (aba "Conteúdo" do
 * /admin/analytics e cartão "top projetos" da aba Comportamento).
 *
 * Fonte: os `pageview` próprios do site (`analytics_events`, via
 * `analytics_top_paths_v2`), agrupados pelo caminho:
 *   - artigo  → `/conteudos/<slug>` (e o legado `/blog/<slug>`, que hoje
 *               redireciona com 301 para `/conteudos/<slug>`)
 *   - projeto → `/portfolio/<slug>`
 *
 * Não usa o evento `project_view`: nenhum código do site o emite mais, e o
 * cartão "top projetos" que dependia dele ficou vazio.
 *
 * Sessões: a RPC conta sessões distintas POR CAMINHO. Quando um item tem mais
 * de um caminho no período (ex.: `/blog/x` e `/conteudos/x`, ou com barra no
 * fim), as sessões são somadas — uma mesma sessão que abriu as duas variantes
 * conta duas vezes. É raro e só afeta itens com caminho legado.
 */

export type ContentKind = "post" | "project";

export type PathViews = { path: string; pageviews: number; sessions: number };

export type ContentItem = {
  slug: string;
  title: string;
  published: boolean;
  /** Data de publicação (artigos) — ISO. */
  published_at?: string | null;
  /** Bairro (projetos). */
  neighborhood?: string | null;
};

export type ContentRow = ContentItem & {
  kind: ContentKind;
  pageviews: number;
  sessions: number;
  /** Pageviews no período anterior (null quando a comparação está desligada). */
  prevPageviews: number | null;
  /** Caminho público canônico do item. */
  href: string;
  /** true quando o slug apareceu nos acessos mas não existe no cadastro. */
  orphan: boolean;
};

const PREFIXES: { prefix: string; kind: ContentKind }[] = [
  { prefix: "/conteudos/", kind: "post" },
  { prefix: "/blog/", kind: "post" },
  { prefix: "/portfolio/", kind: "project" },
];

/** Caminho público canônico de um item. */
export function contentHref(kind: ContentKind, slug: string): string {
  return `${kind === "post" ? "/conteudos/" : "/portfolio/"}${slug}`;
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/**
 * Identifica o item de um caminho. Só vale um segmento depois do prefixo
 * (`/conteudos/x`); índices (`/conteudos`), tags (`/conteudos/tag/x`) e
 * subpáginas ficam de fora. Barra no fim e maiúsculas são normalizadas.
 */
export function contentKeyFromPath(path: string | null | undefined): { kind: ContentKind; slug: string } | null {
  if (!path) return null;
  const clean = path.split(/[?#]/)[0].toLowerCase();
  for (const { prefix, kind } of PREFIXES) {
    if (!clean.startsWith(prefix)) continue;
    const rest = clean.slice(prefix.length).replace(/\/+$/, "");
    if (!rest || rest.includes("/")) return null;
    if (kind === "post" && (rest === "tag" || rest === "tags")) return null;
    return { kind, slug: safeDecode(rest) };
  }
  return null;
}

type Agg = { pageviews: number; sessions: number };

function aggregate(paths: PathViews[]): Map<string, Agg> {
  const out = new Map<string, Agg>();
  for (const p of paths) {
    const key = contentKeyFromPath(p.path);
    if (!key) continue;
    const id = `${key.kind}:${key.slug}`;
    const cur = out.get(id) ?? { pageviews: 0, sessions: 0 };
    cur.pageviews += Number(p.pageviews) || 0;
    cur.sessions += Number(p.sessions) || 0;
    out.set(id, cur);
  }
  return out;
}

/**
 * Uma linha por item do cadastro (inclusive sem acesso no período) mais uma
 * linha "fora do cadastro" para slugs com acesso que não existem mais
 * (renomeados ou apagados). Ordena por pageviews, depois sessões, depois título.
 */
export function buildContentRows(
  kind: ContentKind,
  items: ContentItem[],
  paths: PathViews[],
  prevPaths: PathViews[] | null = null,
): ContentRow[] {
  const cur = aggregate(paths);
  const prev = prevPaths ? aggregate(prevPaths) : null;
  const rows: ContentRow[] = [];
  const known = new Set<string>();

  for (const it of items) {
    const slug = it.slug.toLowerCase();
    if (known.has(slug)) continue;
    known.add(slug);
    const id = `${kind}:${slug}`;
    const a = cur.get(id);
    rows.push({
      ...it,
      kind,
      pageviews: a?.pageviews ?? 0,
      sessions: a?.sessions ?? 0,
      prevPageviews: prev ? prev.get(id)?.pageviews ?? 0 : null,
      href: contentHref(kind, it.slug),
      orphan: false,
    });
  }

  for (const [id, a] of cur) {
    const [k, slug] = [id.slice(0, id.indexOf(":")), id.slice(id.indexOf(":") + 1)];
    if (k !== kind || known.has(slug)) continue;
    rows.push({
      slug,
      title: slug,
      published: false,
      kind,
      pageviews: a.pageviews,
      sessions: a.sessions,
      prevPageviews: prev ? prev.get(id)?.pageviews ?? 0 : null,
      href: contentHref(kind, slug),
      orphan: true,
    });
  }

  return rows.sort(
    (x, y) => y.pageviews - x.pageviews || y.sessions - x.sessions || x.title.localeCompare(y.title, "pt-BR"),
  );
}

/** Totais de uma lista de linhas. */
export function contentTotals(rows: ContentRow[]): { pageviews: number; sessions: number; withViews: number; items: number } {
  let pageviews = 0;
  let sessions = 0;
  let withViews = 0;
  let items = 0;
  for (const r of rows) {
    pageviews += r.pageviews;
    sessions += r.sessions;
    if (!r.orphan) items += 1;
    if (!r.orphan && r.pageviews > 0) withViews += 1;
  }
  return { pageviews, sessions, withViews, items };
}

/** CSV (separador `;`, como o Excel em pt-BR abre direto). */
export function contentRowsToCsv(rows: ContentRow[], origin = "https://bewild.com.br"): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = ["titulo", "slug", "url", "pageviews", "sessoes", "pageviews_periodo_anterior", "situacao"];
  const lines = rows.map((r) =>
    [
      r.title,
      r.slug,
      `${origin}${r.href}`,
      r.pageviews,
      r.sessions,
      r.prevPageviews ?? "",
      r.orphan ? "fora do cadastro" : r.published ? "publicado" : "não publicado",
    ]
      .map(esc)
      .join(";"),
  );
  return [head.join(";"), ...lines].join("\n");
}
