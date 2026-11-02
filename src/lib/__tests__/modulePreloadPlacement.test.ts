import { describe, expect, it } from "vitest";
import { modulePreloadPlacementStream, moveModulePreloadsToBody, withModulePreloadsInBody } from "../modulePreloadPlacement";

const HTML =
  '<!DOCTYPE html><html><head><meta charSet="utf-8"/>' +
  '<link rel="preload" href="/hero.webp" as="image" fetchPriority="high"/>' +
  '<link rel="stylesheet" href="/a.css"/>' +
  '<link rel="modulepreload" href="/assets/index-1.js"/><link rel="modulepreload" href="/assets/react-2.js"/>' +
  '<link rel="icon" href="/favicon.ico"/></head><body><main><p>Olá</p></main>' +
  '<script>window.x=1</script><script type="module" async="" src="/assets/index-1.js"></script></body></html>';

const EXPECTED =
  '<!DOCTYPE html><html><head><meta charSet="utf-8"/>' +
  '<link rel="preload" href="/hero.webp" as="image" fetchPriority="high"/>' +
  '<link rel="stylesheet" href="/a.css"/>' +
  '<link rel="icon" href="/favicon.ico"/></head><body><main><p>Olá</p></main>' +
  '<script>window.x=1</script>' +
  '<link rel="modulepreload" href="/assets/index-1.js"/><link rel="modulepreload" href="/assets/react-2.js"/>' +
  '<script type="module" async="" src="/assets/index-1.js"></script></body></html>';

async function streamThrough(html: string, chunkSize: number): Promise<string> {
  const bytes = new TextEncoder().encode(html);
  const source = new ReadableStream<Uint8Array>({
    start(controller) {
      for (let i = 0; i < bytes.length; i += chunkSize) controller.enqueue(bytes.slice(i, i + chunkSize));
      controller.close();
    },
  });
  return new Response(source.pipeThrough(modulePreloadPlacementStream())).text();
}

describe("modulepreload: do <head> para junto do script de entrada", () => {
  it("tira os modulepreload do <head> e os põe logo antes do <script type=module>, sem mexer no resto", () => {
    expect(moveModulePreloadsToBody(HTML)).toBe(EXPECTED);
  });

  it("dá o mesmo resultado em fluxo, com qualquer tamanho de pedaço (inclusive cortando tags e acentos)", async () => {
    for (const size of [1, 3, 7, 16, 64, 100000]) {
      expect(await streamThrough(HTML, size), `chunk ${size}`).toBe(EXPECTED);
    }
  });

  it("sem modulepreload ou sem script de entrada, o HTML não muda (no fluxo, os links vão para antes de </body>)", async () => {
    const semPreload = HTML.replace(/<link rel="modulepreload"[^>]*>/g, "");
    expect(moveModulePreloadsToBody(semPreload)).toBe(semPreload);
    expect(await streamThrough(semPreload, 5)).toBe(semPreload);
    const semScript = HTML.replace(/<script type="module"[^>]*><\/script>/, "");
    expect(moveModulePreloadsToBody(semScript)).toBe(semScript);
    const fluxo = await streamThrough(semScript, 9);
    expect(fluxo.indexOf('rel="modulepreload"')).toBeGreaterThan(fluxo.indexOf("</head>"));
    expect(fluxo.match(/rel="modulepreload"/g)).toHaveLength(2);
    expect(fluxo.endsWith("</body></html>")).toBe(true);
  });

  it("só mexe em HTML com status 200", async () => {
    const json = new Response('{"a":1}', { headers: { "content-type": "application/json" } });
    expect(withModulePreloadsInBody(json)).toBe(json);
    const notFound = new Response(HTML, { status: 404, headers: { "content-type": "text/html" } });
    expect(withModulePreloadsInBody(notFound)).toBe(notFound);
    const ok = withModulePreloadsInBody(
      new Response(HTML, { headers: { "content-type": "text/html; charset=utf-8", "content-length": "999" } }),
    );
    expect(ok.headers.get("content-length")).toBeNull();
    expect(await ok.text()).toBe(EXPECTED);
  });
});
