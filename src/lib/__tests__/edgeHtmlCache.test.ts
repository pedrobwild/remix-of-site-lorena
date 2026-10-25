import { afterEach, describe, expect, it, vi } from "vitest";
import { FRESH_SECONDS, STALE_SECONDS, edgeCacheKey, isCacheableHtml, serveWithEdgeCache } from "../edgeHtmlCache";

const html = (body: string, init: ResponseInit = {}) =>
  new Response(body, { status: 200, ...init, headers: { "content-type": "text/html; charset=utf-8", ...(init.headers as Record<string, string>) } });

describe("edgeCacheKey", () => {
  const key = (url: string, init?: RequestInit) => edgeCacheKey(new Request(url, init));

  it("página pública sem busca: a própria URL", () => {
    expect(key("https://bewild.com.br/reforma-de-studio-sao-paulo")).toBe("https://bewild.com.br/reforma-de-studio-sao-paulo");
  });
  it("marcas de clique saem da chave; utm_* ficam, ordenados, primeiro valor", () => {
    expect(key("https://bewild.com.br/orcamento?gclid=abc&utm_content=aluguel&utm_source=google&fbclid=x&utm_content=outro")).toBe(
      "https://bewild.com.br/orcamento?utm_content=aluguel&utm_source=google",
    );
    expect(key("https://bewild.com.br/orcamento?gclid=1")).toBe(key("https://bewild.com.br/orcamento?gclid=2"));
  });
  it("outro parâmetro de busca, método, cookie de sessão, admin, api e arquivos: sem cache", () => {
    expect(key("https://bewild.com.br/conteudos?q=studio")).toBeNull();
    expect(key("https://bewild.com.br/orcamento", { method: "POST" })).toBeNull();
    expect(key("https://bewild.com.br/faq", { headers: { cookie: "sb-aamln-auth-token=abc" } })).toBeNull();
    expect(key("https://bewild.com.br/faq", { headers: { cookie: "cookie_consent=accepted" } })).not.toBeNull();
    expect(key("https://bewild.com.br/admin/seo")).toBeNull();
    expect(key("https://bewild.com.br/admin")).toBeNull();
    expect(key("https://bewild.com.br/api/public/export")).toBeNull();
    expect(key("https://bewild.com.br/_serverFn/x")).toBeNull();
    expect(key("https://bewild.com.br/sitemap.xml")).toBeNull();
  });
});

describe("isCacheableHtml", () => {
  it("só 200 text/html sem set-cookie", () => {
    expect(isCacheableHtml(html("ok"))).toBe(true);
    expect(isCacheableHtml(html("x", { status: 404 }))).toBe(false);
    expect(isCacheableHtml(new Response("{}", { headers: { "content-type": "application/json" } }))).toBe(false);
    expect(isCacheableHtml(html("x", { headers: { "set-cookie": "a=b" } }))).toBe(false);
  });
});

describe("serveWithEdgeCache", () => {
  const store = new Map<string, Response>();
  const fakeCaches = {
    default: {
      match: vi.fn(async (k: Request) => store.get(k.url)?.clone()),
      put: vi.fn(async (k: Request, r: Response) => {
        store.set(k.url, r);
      }),
    },
  };
  const g = globalThis as { caches?: unknown };
  afterEach(() => {
    store.clear();
    fakeCaches.default.match.mockClear();
    fakeCaches.default.put.mockClear();
    delete g.caches;
  });

  const req = (url = "https://bewild.com.br/reforma-de-studio-sao-paulo?gclid=z") => new Request(url);
  const browser = "public, max-age=0, s-maxage=600";

  it("sem Cache API: renderiza sempre, sem tocar em nada", async () => {
    const render = vi.fn(async () => html("a"));
    const r = await serveWithEdgeCache(req(), undefined, render, browser);
    expect(await r.text()).toBe("a");
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("MISS guarda a cópia; HIT fresco serve do cache sem renderizar; parâmetro de clique não muda a chave", async () => {
    g.caches = fakeCaches;
    let t = 1_000_000;
    const now = () => t;
    const render = vi.fn(async () => html("render-1"));
    const first = await serveWithEdgeCache(req(), undefined, render, browser, now);
    expect(first.headers.get("x-bw-edge")).toBe("MISS");
    expect(await first.text()).toBe("render-1");
    expect(fakeCaches.default.put).toHaveBeenCalledTimes(1);
    const stored = store.values().next().value as Response;
    expect(stored.headers.get("cache-control")).toBe(`public, max-age=${STALE_SECONDS}`);

    t += (FRESH_SECONDS - 1) * 1000;
    const second = await serveWithEdgeCache(req("https://bewild.com.br/reforma-de-studio-sao-paulo?gclid=outro"), undefined, render, browser, now);
    expect(second.headers.get("x-bw-edge")).toBe("HIT");
    expect(second.headers.get("cache-control")).toBe(browser);
    expect(await second.text()).toBe("render-1");
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("entre 10 min e 24 h serve a cópia velha e renderiza de novo em segundo plano", async () => {
    g.caches = fakeCaches;
    let t = 1_000_000;
    const now = () => t;
    let n = 0;
    const render = vi.fn(async () => html(`render-${++n}`));
    await serveWithEdgeCache(req(), undefined, render, browser, now);
    t += (FRESH_SECONDS + 5) * 1000;
    const waited: Promise<unknown>[] = [];
    const ctx = { waitUntil: (p: Promise<unknown>) => waited.push(p) };
    const stale = await serveWithEdgeCache(req(), ctx, render, browser, now);
    expect(stale.headers.get("x-bw-edge")).toBe("STALE");
    expect(await stale.text()).toBe("render-1");
    expect(waited).toHaveLength(1);
    await Promise.all(waited);
    expect(render).toHaveBeenCalledTimes(2);
    const again = await serveWithEdgeCache(req(), ctx, render, browser, now);
    expect(again.headers.get("x-bw-edge")).toBe("HIT");
    expect(await again.text()).toBe("render-2");
  });

  it("resposta não cacheável (404, set-cookie) passa direto e não é guardada", async () => {
    g.caches = fakeCaches;
    const render = vi.fn(async () => html("nf", { status: 404 }));
    const r = await serveWithEdgeCache(req("https://bewild.com.br/nao-existe"), undefined, render, browser);
    expect(r.status).toBe(404);
    expect(fakeCaches.default.put).not.toHaveBeenCalled();
  });

  it("caminho fora do cache (admin, busca com q) nem consulta a Cache API", async () => {
    g.caches = fakeCaches;
    const render = vi.fn(async () => html("adm"));
    await serveWithEdgeCache(req("https://bewild.com.br/admin/leads"), undefined, render, browser);
    await serveWithEdgeCache(req("https://bewild.com.br/conteudos?q=x"), undefined, render, browser);
    expect(fakeCaches.default.match).not.toHaveBeenCalled();
    expect(render).toHaveBeenCalledTimes(2);
  });
});
