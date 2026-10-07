/**
 * Lógica pura do painel de SEO (/admin/analytics?tab=search).
 *
 * Tudo aqui é determinístico e testável: recebe as linhas que a edge function
 * `search-console-stats` (modo "panel") devolve e as sessões do rastreamento
 * próprio, e calcula variações, oportunidades, canibalização e tráfego de IAs.
 */

export type Metrics = { clicks: number; impressions: number; ctr: number; position: number };
export type KeyRow = Metrics & { key: string };
export type QueryPageRow = Metrics & { query: string; page: string };

export type Compared<T> = T & {
  prev: Metrics | null;
  /** "nova" = sem impressão no período anterior; "perdida" = só no anterior. */
  status: "nova" | "perdida" | "mantida";
};

const ZERO: Metrics = { clicks: 0, impressions: 0, ctr: 0, position: 0 };

/** Caminho relativo de uma URL do site (sem domínio, sem barra final). */
export function pathOf(url: string): string {
  try {
    const u = new URL(url);
    const p = u.pathname.replace(/\/+$/, "");
    return p || "/";
  } catch {
    return url;
  }
}

/** Buscas pela marca: Bewild, Bwild, "be wild" e variações com acento/espaço. */
export function isBrandQuery(q: string): boolean {
  const n = q
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return /\b(be ?wild|bwild|bewild|b ?wild|bewilde|bwil|bewuld|be ?wil)\b/.test(n);
}

/** Variação relativa; null quando não há base (anterior = 0). */
export function pctChange(cur: number, prev: number): number | null {
  if (!prev) return cur ? null : 0;
  return (cur - prev) / prev;
}

/**
 * Direção da variação para colorir: em posição média, menor é melhor.
 * `eps` evita marcar como alta/queda oscilações irrelevantes.
 */
export function deltaDir(
  cur: number,
  prev: number,
  lowerIsBetter = false,
  eps = 0.005,
): "up" | "down" | "flat" {
  if (!prev && !cur) return "flat";
  const rel = prev ? (cur - prev) / Math.abs(prev) : 1;
  if (Math.abs(rel) < eps) return "flat";
  const better = lowerIsBetter ? cur < prev : cur > prev;
  return better ? "up" : "down";
}

/** Junta período atual e anterior pela chave; inclui as que sumiram. */
export function compareRows(cur: KeyRow[], prev: KeyRow[]): Compared<KeyRow>[] {
  const prevMap = new Map(prev.map((r) => [r.key, r]));
  const out: Compared<KeyRow>[] = cur.map((r) => {
    const p = prevMap.get(r.key);
    return { ...r, prev: p ? strip(p) : null, status: p && p.impressions > 0 ? "mantida" : "nova" };
  });
  const seen = new Set(cur.map((r) => r.key));
  for (const p of prev) {
    if (!seen.has(p.key) && p.impressions > 0) {
      out.push({ key: p.key, ...ZERO, prev: strip(p), status: "perdida" });
    }
  }
  return out;
}

function strip(r: Metrics): Metrics {
  return { clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position };
}

/**
 * CTR de referência por posição orgânica (aproximação de curvas públicas de
 * CTR do mercado). Serve só para apontar onde título e descrição rendem menos
 * do que a posição permitiria, não como meta exata.
 */
export function expectedCtr(position: number): number {
  if (!position || position < 1) return 0;
  const table = [0.28, 0.15, 0.1, 0.07, 0.05, 0.04, 0.03, 0.025, 0.02, 0.018];
  const i = Math.round(position) - 1;
  if (i < table.length) return table[i];
  if (position <= 20) return 0.01;
  return 0.004;
}

export type Opportunity = KeyRow & { potentialClicks: number };

/**
 * "Quase na primeira página": buscas entre a posição 4 e a 20 com volume.
 * Potencial = cliques extras se a página subisse para a posição 3.
 */
export function strikingDistance(rows: KeyRow[], minImpressions = 3): Opportunity[] {
  return rows
    .filter((r) => r.position >= 4 && r.position <= 20 && r.impressions >= minImpressions)
    .map((r) => ({
      ...r,
      potentialClicks: Math.max(0, Math.round(r.impressions * expectedCtr(3) - r.clicks)),
    }))
    .sort((a, b) => b.potentialClicks - a.potentialClicks || b.impressions - a.impressions);
}

/**
 * CTR abaixo do esperado para a posição (top 10): candidatos a reescrever
 * meta title e meta description. Potencial = cliques que faltam até a curva.
 */
export function ctrGaps(rows: KeyRow[], minImpressions = 20, tolerance = 0.6): Opportunity[] {
  return rows
    .filter((r) => r.position > 0 && r.position <= 10 && r.impressions >= minImpressions)
    .filter((r) => r.ctr < expectedCtr(r.position) * tolerance)
    .map((r) => ({
      ...r,
      potentialClicks: Math.max(0, Math.round(r.impressions * expectedCtr(r.position) - r.clicks)),
    }))
    .sort((a, b) => b.potentialClicks - a.potentialClicks);
}

export type Cannibal = {
  query: string;
  impressions: number;
  clicks: number;
  pages: { page: string; impressions: number; clicks: number; position: number; share: number }[];
};

/**
 * Canibalização: a mesma busca distribuída entre 2+ páginas do site, cada uma
 * com pelo menos `minShare` das impressões. O Google alterna as páginas e
 * nenhuma acumula autoridade.
 */
export function cannibalization(
  rows: QueryPageRow[],
  minImpressions = 10,
  minShare = 0.15,
): Cannibal[] {
  const byQuery = new Map<string, QueryPageRow[]>();
  for (const r of rows) {
    const list = byQuery.get(r.query) ?? [];
    list.push(r);
    byQuery.set(r.query, list);
  }
  const out: Cannibal[] = [];
  for (const [query, list] of byQuery) {
    const impressions = list.reduce((s, r) => s + r.impressions, 0);
    if (impressions < minImpressions) continue;
    const pages = list
      .map((r) => ({
        page: r.page,
        impressions: r.impressions,
        clicks: r.clicks,
        position: r.position,
        share: impressions ? r.impressions / impressions : 0,
      }))
      .filter((p) => p.share >= minShare)
      .sort((a, b) => b.impressions - a.impressions);
    if (pages.length >= 2) {
      out.push({ query, impressions, clicks: list.reduce((s, r) => s + r.clicks, 0), pages });
    }
  }
  return out.sort((a, b) => b.impressions - a.impressions);
}

export type PostInfo = {
  slug: string;
  title: string;
  published_at: string | null;
  content_updated_at?: string | null;
  focus_keyword?: string | null;
};

export type PostRow = PostInfo & {
  path: string;
  cur: Metrics;
  prev: Metrics | null;
  topQuery: string | null;
};

/** Métricas de busca de cada artigo publicado (inclusive os sem impressão). */
export function postPerformance(
  posts: PostInfo[],
  pages: KeyRow[],
  prevPages: KeyRow[],
  queryPages: QueryPageRow[] = [],
): PostRow[] {
  const cur = new Map(pages.map((r) => [pathOf(r.key), r]));
  const prev = new Map(prevPages.map((r) => [pathOf(r.key), r]));
  const top = new Map<string, QueryPageRow>();
  for (const r of queryPages) {
    const p = pathOf(r.page);
    const t = top.get(p);
    if (!t || r.impressions > t.impressions) top.set(p, r);
  }
  return posts
    .map((p) => {
      const path = `/conteudos/${p.slug}`;
      const c = cur.get(path);
      const pr = prev.get(path);
      return {
        ...p,
        path,
        cur: c ? strip(c) : { ...ZERO },
        prev: pr ? strip(pr) : null,
        topQuery: top.get(path)?.query ?? null,
      };
    })
    .sort((a, b) => b.cur.impressions - a.cur.impressions || a.title.localeCompare(b.title));
}

/** Soma métricas de várias linhas; posição média ponderada por impressões. */
export function sumMetrics(rows: Metrics[]): Metrics {
  const clicks = rows.reduce((s, r) => s + r.clicks, 0);
  const impressions = rows.reduce((s, r) => s + r.impressions, 0);
  const posW = rows.reduce((s, r) => s + r.position * r.impressions, 0);
  return {
    clicks,
    impressions,
    ctr: impressions ? clicks / impressions : 0,
    position: impressions ? posW / impressions : 0,
  };
}

/* ---------- tráfego vindo de assistentes de IA e buscadores ---------- */

export type TrafficKind = "ia" | "busca" | "outro";

const AI_HOSTS: [RegExp, string][] = [
  [/(^|\.)chatgpt\.com$|(^|\.)chat\.openai\.com$|(^|\.)openai\.com$/, "ChatGPT"],
  [/(^|\.)perplexity\.ai$/, "Perplexity"],
  [/(^|\.)gemini\.google\.com$|(^|\.)bard\.google\.com$/, "Gemini"],
  [/(^|\.)copilot\.microsoft\.com$|(^|\.)edgeservices\.bing\.com$/, "Copilot"],
  [/(^|\.)claude\.ai$/, "Claude"],
  [/(^|\.)deepseek\.com$/, "DeepSeek"],
  [/(^|\.)grok\.com$|(^|\.)x\.ai$/, "Grok"],
  [/(^|\.)meta\.ai$/, "Meta AI"],
  [/(^|\.)you\.com$|(^|\.)phind\.com$/, "Outros assistentes"],
];

const SEARCH_HOSTS: [RegExp, string][] = [
  [/(^|\.)google\.[a-z.]+$/, "Google"],
  [/(^|\.)bing\.com$/, "Bing"],
  [/(^|\.)duckduckgo\.com$/, "DuckDuckGo"],
  [/(^|\.)search\.yahoo\.com$|(^|\.)yahoo\.com$/, "Yahoo"],
  [/(^|\.)ecosia\.org$/, "Ecosia"],
  [/(^|\.)search\.brave\.com$/, "Brave"],
  [/(^|\.)yandex\.[a-z.]+$/, "Yandex"],
];

/** Classifica um host de referência (ou utm_source) em IA, buscador ou outro. */
export function classifyReferrer(raw: string | null | undefined): { kind: TrafficKind; name: string } {
  const host = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");
  if (!host) return { kind: "outro", name: "(direto)" };
  // Gemini fica em google.com: precisa vir antes da regra de buscador.
  for (const [re, name] of AI_HOSTS) if (re.test(host)) return { kind: "ia", name };
  for (const [re, name] of SEARCH_HOSTS) if (re.test(host)) return { kind: "busca", name };
  return { kind: "outro", name: host };
}

export type SourceRow = { dim: string | null; sessions: number; conversions: number };
export type SourceAgg = { name: string; sessions: number; conversions: number };

/**
 * Agrega sessões por assistente de IA e por buscador. Usa o host de referência
 * e, como complemento, o utm_source (o ChatGPT marca utm_source=chatgpt.com).
 * Para não contar duas vezes, o utm_source só entra quando o assistente não
 * apareceu pelo referenciador.
 */
export function aggregateSources(
  referrers: SourceRow[],
  utmSources: SourceRow[] = [],
): { ia: SourceAgg[]; busca: SourceAgg[]; iaTotal: number; buscaTotal: number } {
  const ia = new Map<string, SourceAgg>();
  const busca = new Map<string, SourceAgg>();
  const add = (m: Map<string, SourceAgg>, name: string, r: SourceRow) => {
    const a = m.get(name) ?? { name, sessions: 0, conversions: 0 };
    a.sessions += Number(r.sessions) || 0;
    a.conversions += Number(r.conversions) || 0;
    m.set(name, a);
  };
  for (const r of referrers) {
    const c = classifyReferrer(r.dim);
    if (c.kind === "ia") add(ia, c.name, r);
    else if (c.kind === "busca") add(busca, c.name, r);
  }
  const fromRef = new Set(ia.keys());
  for (const r of utmSources) {
    const c = classifyReferrer(r.dim);
    if (c.kind === "ia" && !fromRef.has(c.name)) add(ia, c.name, r);
  }
  const sort = (m: Map<string, SourceAgg>) => [...m.values()].sort((a, b) => b.sessions - a.sessions);
  const iaList = sort(ia);
  const buscaList = sort(busca);
  return {
    ia: iaList,
    busca: buscaList,
    iaTotal: iaList.reduce((s, r) => s + r.sessions, 0),
    buscaTotal: buscaList.reduce((s, r) => s + r.sessions, 0),
  };
}

/** Período anterior de mesmo tamanho, terminando no dia antes do início. */
export function previousDays(startISO: string, endISO: string): { start: string; end: string } {
  const s = new Date(`${startISO}T12:00:00Z`);
  const e = new Date(`${endISO}T12:00:00Z`);
  const len = Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1;
  const pe = new Date(s.getTime() - 86_400_000);
  const ps = new Date(pe.getTime() - (len - 1) * 86_400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(ps), end: iso(pe) };
}
