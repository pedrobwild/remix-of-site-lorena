/**
 * Home: JavaScript só depois da primeira pintura (auditoria de SEO, rodada 4,
 * 09/11/2026, ação 13). Ver src/lib/entryAfterFirstPaint.ts.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ENTRY_FALLBACK_MS,
  deferEntryScript,
  entryAfterFirstPaintStream,
  entryLoaderScript,
  withEntryAfterFirstPaint,
} from "../entryAfterFirstPaint";
import { modulePreloadPlacementStream } from "../modulePreloadPlacement";

const CORPO =
  '<main id="conteudo"><section class="bwa-hero" id="inicio"><p class="bwa-hero-title">Comprou um studio em São Paulo?</p></section></main>' +
  '<script data-tsr-stream-part="">self.$_TSR={};</script>';
const HTML =
  '<!DOCTYPE html><html><head><meta charSet="utf-8"/><link rel="stylesheet" href="/a.css"/>' +
  '<link rel="modulepreload" href="/assets/index-1.js"/><link rel="modulepreload" href="/assets/react-2.js"/>' +
  `</head><body>${CORPO}` +
  '<script type="module" async="" src="/assets/index-1.js"></script>' +
  "<script>document.currentScript.remove();</script></body></html>";

async function servidor(html: string, chunkSize: number): Promise<string> {
  const bytes = new TextEncoder().encode(html);
  const source = new ReadableStream<Uint8Array>({
    start(controller) {
      for (let i = 0; i < bytes.length; i += chunkSize)
        controller.enqueue(bytes.slice(i, i + chunkSize));
      controller.close();
    },
  });
  // Mesma ordem do src/server.ts: primeiro os modulepreload vão para o corpo, depois o carregador.
  return new Response(
    source.pipeThrough(modulePreloadPlacementStream()).pipeThrough(entryAfterFirstPaintStream())
  ).text();
}

const tirarCarregador = (html: string) =>
  html.replace(/<script data-bw-entry>[\s\S]*?<\/script>/, "");

describe("HTML da home", () => {
  it("modulepreload e script de entrada viram um carregador; o resto do HTML não muda", async () => {
    const out = await servidor(HTML, 100000);
    expect(out).not.toMatch(/rel="modulepreload"/);
    expect(out).not.toMatch(/<script type="module"/);
    expect(out.match(/<script data-bw-entry>/g)).toHaveLength(1);
    // Conteúdo, texto do hero e payload de hidratação idênticos, na mesma ordem.
    expect(tirarCarregador(out)).toBe(
      '<!DOCTYPE html><html><head><meta charSet="utf-8"/><link rel="stylesheet" href="/a.css"/>' +
        `</head><body>${CORPO}<script>document.currentScript.remove();</script></body></html>`
    );
    const loader = /<script data-bw-entry>([\s\S]*?)<\/script>/.exec(out)![1];
    expect(loader).toContain('["/assets/index-1.js","/assets/react-2.js"]');
    expect(loader).toContain('"/assets/index-1.js"');
  });

  it("em fluxo, com qualquer tamanho de pedaço, sai igual ao texto inteiro", async () => {
    const inteiro = await servidor(HTML, 100000);
    for (const size of [1, 3, 7, 16, 64, 511, 513]) {
      expect(await servidor(HTML, size), `chunk ${size}`).toBe(inteiro);
    }
  });

  it("sem script de entrada, nada muda", async () => {
    const semScript = HTML.replace(/<script type="module"[^>]*><\/script>/, "");
    expect(deferEntryScript(semScript)).toBe(semScript);
    const out = await servidor(semScript, 9);
    expect(out).not.toContain("data-bw-entry");
  });

  it("endereço com < no JSON não fecha a tag do carregador", () => {
    expect(entryLoaderScript(["/a</script>.js"], "/b.js")).not.toContain("</script>.js");
  });

  it("só a home (GET, 200, HTML) passa pelo carregador", async () => {
    const html = (s = 200) =>
      new Response(HTML, { status: s, headers: { "content-type": "text/html; charset=utf-8" } });
    const outra = html();
    expect(withEntryAfterFirstPaint(new Request("https://bewild.com.br/orcamento"), outra)).toBe(
      outra
    );
    const erro = html(404);
    expect(withEntryAfterFirstPaint(new Request("https://bewild.com.br/"), erro)).toBe(erro);
    const json = new Response("{}", { headers: { "content-type": "application/json" } });
    expect(withEntryAfterFirstPaint(new Request("https://bewild.com.br/"), json)).toBe(json);
    const home = withEntryAfterFirstPaint(
      new Request("https://bewild.com.br/?utm_source=x"),
      html()
    );
    expect(home.headers.get("content-length")).toBeNull();
    expect(await home.text()).toContain("data-bw-entry");
  });
});

describe("carregador no navegador", () => {
  const original = window.PerformanceObserver;
  afterEach(() => {
    vi.useRealTimers();
    (window as unknown as { PerformanceObserver: unknown }).PerformanceObserver = original;
    document.head.querySelectorAll('link[rel="modulepreload"]').forEach((n) => n.remove());
    document.body.querySelectorAll('script[type="module"]').forEach((n) => n.remove());
  });

  const rodar = () => {
    const js = /<script data-bw-entry>([\s\S]*?)<\/script>/.exec(
      entryLoaderScript(["/assets/index-1.js", "/assets/react-2.js"], "/assets/index-1.js")
    )![1];
    new Function(js)();
  };
  const pedidos = () => ({
    preloads: Array.from(document.head.querySelectorAll('link[rel="modulepreload"]')).map((l) =>
      l.getAttribute("href")
    ),
    scripts: Array.from(document.body.querySelectorAll('script[type="module"]')).map((s) =>
      s.getAttribute("src")
    ),
  });

  it("espera a primeira pintura (first-contentful-paint) e pede tudo uma vez, na mesma ordem", () => {
    vi.useFakeTimers();
    let callback: ((list: { getEntries: () => Array<{ name: string }> }) => void) | null = null;
    class FakeObserver {
      static supportedEntryTypes = ["paint", "largest-contentful-paint"];
      constructor(cb: typeof callback) {
        callback = cb;
      }
      observe() {}
      disconnect() {}
    }
    (window as unknown as { PerformanceObserver: unknown }).PerformanceObserver = FakeObserver;
    rodar();
    vi.advanceTimersByTime(ENTRY_FALLBACK_MS - 1);
    expect(pedidos()).toEqual({ preloads: [], scripts: [] });
    callback!({ getEntries: () => [{ name: "first-paint" }] });
    vi.advanceTimersByTime(0);
    expect(pedidos().scripts).toEqual([]);
    callback!({ getEntries: () => [{ name: "first-contentful-paint" }] });
    vi.advanceTimersByTime(0);
    expect(pedidos()).toEqual({
      preloads: ["/assets/index-1.js", "/assets/react-2.js"],
      scripts: ["/assets/index-1.js"],
    });
    // A rede de segurança não pede de novo.
    vi.advanceTimersByTime(ENTRY_FALLBACK_MS);
    expect(pedidos().scripts).toHaveLength(1);
  });

  it("sem evento de pintura no navegador, pede depois do primeiro quadro", () => {
    vi.useFakeTimers();
    (window as unknown as { PerformanceObserver: unknown }).PerformanceObserver = undefined;
    const raf = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb) => setTimeout(() => cb(0), 16) as unknown as number);
    rodar();
    expect(pedidos().scripts).toEqual([]);
    vi.advanceTimersByTime(17);
    expect(pedidos().scripts).toEqual(["/assets/index-1.js"]);
    raf.mockRestore();
  });

  it("aba que nunca pinta (segundo plano) recebe o JavaScript pela rede de segurança", () => {
    vi.useFakeTimers();
    class Mudo {
      static supportedEntryTypes = ["paint"];
      observe() {}
      disconnect() {}
    }
    (window as unknown as { PerformanceObserver: unknown }).PerformanceObserver = Mudo;
    rodar();
    vi.advanceTimersByTime(ENTRY_FALLBACK_MS);
    expect(pedidos().scripts).toEqual(["/assets/index-1.js"]);
  });
});
