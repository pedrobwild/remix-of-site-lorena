/**
 * Move os `<link rel="modulepreload">` do <head> para o fim do <body>, logo
 * antes do `<script type="module">` de entrada do site.
 *
 * Por quê (PageSpeed, celular, 01/11/2026): o TanStack Start escreve no <head>
 * um `modulepreload` para cada módulo da rota (~45 na home). O navegador baixa
 * e compila esses módulos enquanto ainda está montando a primeira tela, e no
 * teste do Lighthouse a primeira pintura da home só saía aos ~2,3 s — com o
 * HTML todo lido aos 0,3 s. Sem esses links no <head> (e com as seções fora
 * da tela em `content-visibility: auto`), a primeira pintura saiu aos ~0,25 s
 * e o LCP simulado caiu de ~5,3 s para ~2,4 s na mesma máquina.
 *
 * Os links continuam no HTML, colados ao script de entrada: o navegador ainda
 * busca os módulos em paralelo (sem cascata de importações), só que depois do
 * CSS, da fonte e da foto do hero. A hidratação do React acha os links pelo
 * `href` em qualquer lugar do documento (não só no <head>), então não há
 * diferença entre o HTML do servidor e o do navegador.
 *
 * Funciona em fluxo (streaming): só segura o texto do <head> até `</head>` e,
 * depois, o necessário para achar o início do script de entrada.
 */

const MODULE_PRELOAD = /<link\b[^>]*\brel=["']?modulepreload["']?[^>]*>/gi;
const HEAD_END = "</head>";
const MODULE_SCRIPT = /<script\b[^>]*\btype=["']?module["']?[^>]*>/i;
/** Maior pedaço de texto que pode conter o início de `<script ... type="module"` cortado entre dois chunks. */
const SCRIPT_TAG_LOOKBEHIND = 512;

/** Versão para texto inteiro (testes e respostas já em memória). */
export function moveModulePreloadsToBody(html: string): string {
  const headEnd = html.indexOf(HEAD_END);
  if (headEnd < 0) return html;
  const head = html.slice(0, headEnd);
  const preloads = head.match(MODULE_PRELOAD);
  if (!preloads?.length) return html;
  const rest = html.slice(headEnd);
  const script = MODULE_SCRIPT.exec(rest);
  if (!script) return html;
  return (
    head.replace(MODULE_PRELOAD, "") +
    rest.slice(0, script.index) +
    preloads.join("") +
    rest.slice(script.index)
  );
}

/** TransformStream de bytes que aplica `moveModulePreloadsToBody` sem esperar o documento inteiro. */
export function modulePreloadPlacementStream(): TransformStream<Uint8Array, Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let state: "head" | "body" | "done" = "head";
  let buffer = "";
  let preloads: string[] = [];

  const process = (controller: TransformStreamDefaultController<Uint8Array>, final: boolean) => {
    if (state === "head") {
      const headEnd = buffer.indexOf(HEAD_END);
      if (headEnd < 0) {
        if (final) {
          controller.enqueue(encoder.encode(buffer));
          buffer = "";
        }
        return;
      }
      const head = buffer.slice(0, headEnd);
      preloads = head.match(MODULE_PRELOAD) ?? [];
      if (!preloads.length) {
        state = "done";
        controller.enqueue(encoder.encode(buffer));
        buffer = "";
        return;
      }
      controller.enqueue(encoder.encode(head.replace(MODULE_PRELOAD, "")));
      buffer = buffer.slice(headEnd);
      state = "body";
    }
    if (state === "body") {
      const script = MODULE_SCRIPT.exec(buffer);
      if (script) {
        controller.enqueue(encoder.encode(buffer.slice(0, script.index) + preloads.join("") + buffer.slice(script.index)));
        buffer = "";
        state = "done";
        return;
      }
      if (final) {
        // Sem script de entrada: os links voltam ao fim, sem se perder.
        const bodyEnd = buffer.lastIndexOf("</body>");
        const at = bodyEnd >= 0 ? bodyEnd : buffer.length;
        controller.enqueue(encoder.encode(buffer.slice(0, at) + preloads.join("") + buffer.slice(at)));
        buffer = "";
        state = "done";
        return;
      }
      // Guarda só o final, que pode ser o começo da tag cortado ao meio (uma
      // tag <script> incompleta nunca passa de SCRIPT_TAG_LOOKBEHIND caracteres).
      const cut = buffer.length - SCRIPT_TAG_LOOKBEHIND;
      if (cut > 0) {
        controller.enqueue(encoder.encode(buffer.slice(0, cut)));
        buffer = buffer.slice(cut);
      }
      return;
    }
    if (buffer) {
      controller.enqueue(encoder.encode(buffer));
      buffer = "";
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

/** Aplica a troca numa resposta HTML (status 200). Outras respostas passam sem mudança. */
export function withModulePreloadsInBody(response: Response): Response {
  if (response.status !== 200 || !response.body) return response;
  if (!(response.headers.get("content-type") ?? "").includes("text/html")) return response;
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(response.body.pipeThrough(modulePreloadPlacementStream()), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
