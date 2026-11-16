// @vitest-environment node
import { describe, expect, it } from "vitest";
import { MISSING_FILE_CACHE_CONTROL, PUBLIC_HTML_CACHE_CONTROL, withNoCacheOnMissingFile } from "../../server";

const STATIC_30_DIAS = "public, max-age=2592000, stale-while-revalidate=604800";

describe("cache do HTML público", () => {
  it("a CDN não entrega cópia com mais de 20 minutos", () => {
    const sMaxAge = Number(/s-maxage=(\d+)/.exec(PUBLIC_HTML_CACHE_CONTROL)?.[1]);
    const swr = Number(/stale-while-revalidate=(\d+)/.exec(PUBLIC_HTML_CACHE_CONTROL)?.[1]);
    expect(sMaxAge + swr).toBeLessThanOrEqual(1_200);
    expect(PUBLIC_HTML_CACHE_CONTROL).toContain("max-age=0");
  });
});

describe("arquivo estático que não existe", () => {
  const resposta = (status: number) =>
    new Response("x", { status, headers: { "cache-control": STATIC_30_DIAS, "content-type": "text/html" } });

  it("404 de arquivo não leva os 30 dias de cache de /images", () => {
    const r = withNoCacheOnMissingFile(
      new Request("https://bewild.com.br/images/blog/um-artigo/02-grafico-nov26.svg"),
      resposta(404),
    );
    expect(r.status).toBe(404);
    expect(r.headers.get("cache-control")).toBe(MISSING_FILE_CACHE_CONTROL);
  });

  it("arquivo que existe mantém o cache longo", () => {
    const r = withNoCacheOnMissingFile(new Request("https://bewild.com.br/images/blog/um-artigo/02.svg"), resposta(200));
    expect(r.headers.get("cache-control")).toBe(STATIC_30_DIAS);
  });

  it("página 404 (caminho sem extensão) não é alterada", () => {
    const original = resposta(404);
    expect(withNoCacheOnMissingFile(new Request("https://bewild.com.br/nao-existe"), original)).toBe(original);
  });
});
