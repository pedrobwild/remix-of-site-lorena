/**
 * Cache de borda do HTML público, feito pelo próprio worker (Cache API do
 * Cloudflare), porque a hospedagem troca o `Cache-Control` do HTML por
 * `no-cache` e a CDN dela não guarda nada (medido em 25/10/2026: TTFB real
 * de 2,7 s no celular, com o servidor montando cada página do zero e
 * consultando o banco duas vezes por visita).
 *
 * O que entra no cache: GET/HEAD de página pública (text/html, status 200,
 * sem set-cookie), fora de /admin, /api e funções de servidor. A chave ignora
 * marcas de clique (gclid, fbclid…) e guarda só os utm_* — o /orcamento e o
 * /reforma-de-studio-sao-paulo mudam o topo conforme utm_term e utm_content
 * (`topoVarianteDaBusca`), então cada combinação de UTM tem a própria cópia; o resto da busca (q, bairro, página) desliga o
 * cache daquela requisição. Visitante com sessão do painel (cookie sb-*)
 * também passa direto, para nunca guardar HTML gerado para alguém logado.
 *
 * Validade: 10 minutos "fresco"; até 24 h a cópia velha ainda sai na hora e
 * uma nova é gerada em segundo plano (stale-while-revalidate feito à mão,
 * porque a Cache API não implementa). Uma publicação nova aparece em até
 * 10 minutos em cada PoP. Fora do Cloudflare (sem `caches.default`) tudo
 * segue sem cache, como antes.
 */

export const FRESH_SECONDS = 600;
export const STALE_SECONDS = 86_400;

const CACHED_AT_HEADER = "x-bw-edge-cached-at";
const EDGE_HEADER = "x-bw-edge";

/** Parâmetros de clique/atribuição que nunca mudam o HTML: saem da chave. */
const TRACKING_PARAMS = new Set([
  "gclid", "gbraid", "wbraid", "dclid", "gclsrc", "fbclid", "msclkid", "ttclid", "twclid",
  "li_fat_id", "igshid", "mc_cid", "mc_eid", "_ga", "_gl", "srsltid", "yclid", "ref",
]);

const SKIP_PREFIXES = ["/admin", "/api/", "/_serverFn", "/functions/", "/__l5e/", "/assets/"];

export type EdgeCacheContext = { waitUntil?: (p: Promise<unknown>) => void } | undefined;

type CloudflareRequest = Request & {
  waitUntil?: (p: Promise<unknown>) => void;
  runtime?: { cloudflare?: { env?: unknown; context?: { waitUntil?: (p: Promise<unknown>) => void } } };
};

/**
 * O Nitro (preset cloudflare-module) chama o entry do app só com a
 * requisição; `env` e `ctx` do worker ficam em `request.runtime.cloudflare`
 * (e `globalThis.__env__`). Aqui se recupera o `waitUntil` de qualquer lugar.
 */
export function edgeContextFrom(request: Request, ctx?: EdgeCacheContext): EdgeCacheContext {
  if (ctx?.waitUntil) return ctx;
  const r = request as CloudflareRequest;
  if (typeof r.waitUntil === "function") return { waitUntil: r.waitUntil };
  const context = r.runtime?.cloudflare?.context;
  if (context && typeof context.waitUntil === "function") return { waitUntil: context.waitUntil.bind(context) };
  return undefined;
}

/** `env` do worker (binding ASSETS etc.), por qualquer dos caminhos acima. */
export function workerEnvFrom(request: Request, env?: unknown): Record<string, unknown> | undefined {
  const candidates = [env, (request as CloudflareRequest).runtime?.cloudflare?.env, (globalThis as { __env__?: unknown }).__env__];
  for (const c of candidates) if (c && typeof c === "object") return c as Record<string, unknown>;
  return undefined;
}

type CacheLike = {
  match: (key: Request | string) => Promise<Response | undefined>;
  put: (key: Request | string, response: Response) => Promise<void>;
};

function edgeCache(): CacheLike | null {
  const c = (globalThis as { caches?: { default?: CacheLike } }).caches;
  return c?.default ?? null;
}

/**
 * Chave de cache (URL normalizada) ou `null` quando a requisição não deve
 * passar pelo cache. Exportada para o teste.
 */
export function edgeCacheKey(request: Request): string | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const url = new URL(request.url);
  const { pathname } = url;
  if (SKIP_PREFIXES.some((p) => pathname === p.replace(/\/$/, "") || pathname.startsWith(p))) return null;
  const last = pathname.split("/").pop() ?? "";
  if (last.includes(".")) return null;
  const cookie = request.headers.get("cookie") ?? "";
  if (/(^|;\s*)sb-[^=]*=/.test(cookie)) return null;
  if (request.headers.has("authorization")) return null;

  const utm: Array<[string, string]> = [];
  for (const [k, v] of url.searchParams) {
    const key = k.toLowerCase();
    if (TRACKING_PARAMS.has(key)) continue;
    if (key.startsWith("utm_")) {
      if (!utm.some(([u]) => u === key)) utm.push([key, v]);
      continue;
    }
    return null;
  }
  utm.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const normalized = new URL(url.origin + pathname);
  for (const [k, v] of utm) normalized.searchParams.append(k, v);
  return normalized.toString();
}

export function isCacheableHtml(response: Response): boolean {
  if (response.status !== 200) return false;
  if (!(response.headers.get("content-type") ?? "").includes("text/html")) return false;
  if (response.headers.has("set-cookie")) return false;
  return true;
}

function withHeaders(response: Response, set: Record<string, string>): Response {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(set)) headers.set(k, v);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

/** Cópia que fica guardada na borda (a Cache API exige max-age > 0 para guardar). */
function storableCopy(response: Response, now: number): Response {
  return withHeaders(response, {
    "cache-control": `public, max-age=${STALE_SECONDS}`,
    [CACHED_AT_HEADER]: String(now),
  });
}

export function cachedAgeSeconds(cached: Response, now: number): number {
  const at = Number(cached.headers.get(CACHED_AT_HEADER));
  if (!Number.isFinite(at) || at <= 0) return Number.POSITIVE_INFINITY;
  return Math.max(0, (now - at) / 1000);
}

/**
 * Serve do cache quando possível; senão renderiza com `render()` e guarda.
 * `browserCacheControl` é o cabeçalho que vai para o navegador (max-age=0).
 */
export async function serveWithEdgeCache(
  request: Request,
  ctx: EdgeCacheContext,
  render: () => Promise<Response>,
  browserCacheControl: string,
  now: () => number = Date.now,
): Promise<Response> {
  const cache = edgeCache();
  const key = cache ? edgeCacheKey(request) : null;
  if (!cache || !key) return render();
  const context = edgeContextFrom(request, ctx);

  const cacheKey = new Request(key, { method: "GET" });
  let cached: Response | undefined;
  try {
    cached = await cache.match(cacheKey);
  } catch {
    cached = undefined;
  }

  const refresh = async () => {
    const fresh = await render();
    if (!isCacheableHtml(fresh)) return fresh;
    const copy = storableCopy(fresh.clone(), now());
    try {
      await cache.put(cacheKey, copy);
    } catch {
      /* cache indisponível: a resposta segue sem guardar */
    }
    return fresh;
  };

  if (cached) {
    const age = cachedAgeSeconds(cached, now());
    if (age < FRESH_SECONDS) {
      return withHeaders(cached, { "cache-control": browserCacheControl, [EDGE_HEADER]: "HIT" });
    }
    if (age < STALE_SECONDS) {
      const revalidate = refresh().then(() => undefined, () => undefined);
      if (context?.waitUntil) context.waitUntil(revalidate);
      return withHeaders(cached, { "cache-control": browserCacheControl, [EDGE_HEADER]: "STALE" });
    }
  }

  const fresh = await refresh();
  return withHeaders(fresh, { [EDGE_HEADER]: "MISS" });
}
