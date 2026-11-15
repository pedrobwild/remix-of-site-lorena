/**
 * Home: JavaScript do site pedido só DEPOIS da primeira pintura (auditoria de
 * SEO, rodada 4, 09/11/2026, ação 13).
 *
 * Por quê: no celular o LCP da home é o texto do hero, pintado junto com a
 * primeira pintura (FCP = LCP no navegador). Mas o HTML é pequeno e o
 * navegador acha os ~45 `<link rel="modulepreload">` e o script de entrada no
 * fim do `<body>` (src/lib/modulePreloadPlacement.ts) antes de pintar: os
 * ~300 kB de JavaScript dividem a banda com CSS, fontes e a foto do hero, e o
 * Lighthouse (que simula 4G lento) conta esse download no LCP — PageSpeed de
 * 09/11/2026: LCP 3,3 s com 2,6 s de "atraso de renderização".
 *
 * O que muda no HTML: os `modulepreload` e o `<script type="module" src>` de
 * entrada viram um script inline que cria os MESMOS elementos (mesma ordem,
 * mesmos endereços) logo depois da primeira pintura: evento
 * `first-contentful-paint` do PerformanceObserver; sem suporte, dois quadros
 * (`requestAnimationFrame` + `setTimeout`). Rede de segurança: aba em segundo
 * plano não pinta, então o JavaScript vem de qualquer jeito em
 * {@link ENTRY_FALLBACK_MS}. Conteúdo, ordem das seções, textos e o restante
 * do HTML do servidor não mudam; a hidratação do React acha os links pelo
 * `href` (agora no `<head>`).
 *
 * Funções puras + TransformStream (a resposta continua em fluxo).
 */

const MODULE_PRELOAD = /<link\b[^>]*\brel=["']?modulepreload["']?[^>]*>/gi;
const HREF = /\bhref=["']([^"']+)["']/i;
const SRC = /\bsrc=["']([^"']+)["']/i;
/** Script de entrada: `<script type="module" ... src="…"></script>` (o único com src e type=module). */
const ENTRY_SCRIPT = /<script\b(?=[^>]*\btype=["']?module["']?)(?=[^>]*\bsrc=)[^>]*>\s*<\/script>/i;
/** Maior pedaço que pode conter o começo de uma das tags acima cortado entre dois chunks. */
const TAG_LOOKBEHIND = 512;

/** Teto para a aba que nunca pinta (segundo plano, pré-renderização). */
export const ENTRY_FALLBACK_MS = 3000;

/** JSON seguro dentro de `<script>`: `<` escapado não fecha a tag. */
function inlineJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/** Script inline que cria os modulepreload e o script de entrada depois da primeira pintura. */
export function entryLoaderScript(modules: string[], entry: string): string {
  const js =
    `(function(){var d=0,m=${inlineJson(modules)},e=${inlineJson(entry)};` +
    "function go(){if(d)return;d=1;for(var i=0;i<m.length;i++){var l=document.createElement('link');l.rel='modulepreload';l.href=m[i];document.head.appendChild(l)}" +
    "var s=document.createElement('script');s.type='module';s.async=true;s.src=e;document.body.appendChild(s)}" +
    "function later(){setTimeout(go,0)}" +
    "var P=window.PerformanceObserver,ok=P&&P.supportedEntryTypes&&P.supportedEntryTypes.indexOf('paint')>=0;" +
    "if(ok){try{var o=new P(function(l){var x=l.getEntries();for(var j=0;j<x.length;j++)if(x[j].name==='first-contentful-paint'){o.disconnect();later();return}});o.observe({type:'paint',buffered:true})}catch(err){ok=0}}" +
    "if(!ok)requestAnimationFrame(later);" +
    `setTimeout(go,${ENTRY_FALLBACK_MS})})();`;
  return `<script data-bw-entry>${js}</script>`;
}

/**
 * Troca o bloco final (modulepreload + script de entrada) pelo carregador.
 * Sem script de entrada, devolve o HTML como veio.
 */
export function deferEntryScript(html: string): string {
  const entry = ENTRY_SCRIPT.exec(html);
  if (!entry) return html;
  const src = SRC.exec(entry[0])?.[1];
  if (!src) return html;
  const before = html.slice(0, entry.index);
  const modules: string[] = [];
  const kept = before.replace(MODULE_PRELOAD, (tag) => {
    const href = HREF.exec(tag)?.[1];
    if (!href) return tag;
    modules.push(href);
    return "";
  });
  return kept + entryLoaderScript(modules, src) + html.slice(entry.index + entry[0].length);
}

/**
 * Versão em fluxo: repassa o documento e só segura o trecho a partir do
 * primeiro `modulepreload` do corpo (os do `<head>` já saíram em
 * modulePreloadPlacement) até o fim do script de entrada.
 */
export function entryAfterFirstPaintStream(): TransformStream<Uint8Array, Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  let done = false;
  let inBody = false;

  const process = (controller: TransformStreamDefaultController<Uint8Array>, final: boolean) => {
    if (done) {
      if (buffer) controller.enqueue(encoder.encode(buffer));
      buffer = "";
      return;
    }
    if (!inBody) {
      const bodyAt = buffer.search(/<body\b/i);
      if (bodyAt < 0) {
        const cut = final ? buffer.length : buffer.length - TAG_LOOKBEHIND;
        if (cut > 0) {
          controller.enqueue(encoder.encode(buffer.slice(0, cut)));
          buffer = buffer.slice(cut);
        }
        return;
      }
      controller.enqueue(encoder.encode(buffer.slice(0, bodyAt)));
      buffer = buffer.slice(bodyAt);
      inBody = true;
    }
    const entry = ENTRY_SCRIPT.exec(buffer);
    if (entry) {
      // Tudo antes do primeiro modulepreload sai já; o bloco final é reescrito.
      MODULE_PRELOAD.lastIndex = 0;
      const firstPreload = buffer.slice(0, entry.index).search(MODULE_PRELOAD);
      const start = firstPreload >= 0 ? firstPreload : entry.index;
      controller.enqueue(
        encoder.encode(buffer.slice(0, start) + deferEntryScript(buffer.slice(start)))
      );
      buffer = "";
      done = true;
      return;
    }
    if (final) {
      controller.enqueue(encoder.encode(buffer));
      buffer = "";
      return;
    }
    // Sem o script ainda: solta o que vem antes do primeiro modulepreload (ou
    // tudo menos o final, que pode ser o começo de uma tag cortada).
    const firstPreload = buffer.search(MODULE_PRELOAD);
    const cut = firstPreload >= 0 ? firstPreload : buffer.length - TAG_LOOKBEHIND;
    if (cut > 0) {
      controller.enqueue(encoder.encode(buffer.slice(0, cut)));
      buffer = buffer.slice(cut);
    }
  };

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      process(controller, false);
    },
    flush(controller) {
      buffer += decoder.decode();
      process(controller, true);
    },
  });
}

/** Só a home ("/"): é a página cujo LCP (texto do hero) sai na primeira pintura. */
export function shouldDeferEntry(request: Request, response: Response): boolean {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  if (response.status !== 200 || !response.body) return false;
  if (!(response.headers.get("content-type") ?? "").includes("text/html")) return false;
  return new URL(request.url).pathname === "/";
}

/** Aplica o carregador na resposta da home; as demais passam sem mudança. */
export function withEntryAfterFirstPaint(request: Request, response: Response): Response {
  if (!shouldDeferEntry(request, response)) return response;
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(response.body!.pipeThrough(entryAfterFirstPaintStream()), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
