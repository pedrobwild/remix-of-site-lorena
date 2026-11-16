import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { canonicalHostRedirect, lowercasePathRedirect } from "./lib/caseRedirect";
import { renderErrorPage } from "./lib/error-page";
import { serveWithEdgeCache, type EdgeCacheContext } from "./lib/edgeHtmlCache";
import { withModulePreloadsInBody } from "./lib/modulePreloadPlacement";
import { withEntryAfterFirstPaint } from "./lib/entryAfterFirstPaint";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// HTML público sai com cache de borda curto: 10 min "fresco" e mais 10 min em que a
// CDN ainda entrega a cópia guardada enquanto gera outra em segundo plano. Passados
// 20 min, a página é montada de novo antes de responder. Até 16/11/2026 a janela da
// cópia velha era de 24 h: numa região com pouca visita (de onde chegam os robôs de
// busca e de IA), a primeira requisição depois de uma edição no banco recebia o texto
// de horas antes. O navegador sempre revalida (max-age=0).
export const PUBLIC_HTML_CACHE_CONTROL = "public, max-age=0, s-maxage=600, stale-while-revalidate=600";

// Arquivo estático que não existe: as regras de `/images/**` (vite.config.ts) colam
// 30 dias de cache em qualquer resposta do caminho, inclusive no 404. Quem pedia um
// gráfico antes de o arquivo ser publicado guardava o erro por um mês.
export const MISSING_FILE_CACHE_CONTROL = "no-store";

export function withNoCacheOnMissingFile(request: Request, response: Response): Response {
  if (response.status < 400) return response;
  const last = new URL(request.url).pathname.split("/").pop() ?? "";
  if (!last.includes(".")) return response;
  const headers = new Headers(response.headers);
  headers.set("cache-control", MISSING_FILE_CACHE_CONTROL);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function withShortEdgeCache(request: Request, response: Response): Response {
  if (request.method !== "GET" && request.method !== "HEAD") return response;
  if (response.status !== 200) return response;
  if (!(response.headers.get("content-type") ?? "").includes("text/html")) return response;
  if (response.headers.has("set-cookie")) return response;
  const { pathname } = new URL(request.url);
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/")) return response;
  const headers = new Headers(response.headers);
  headers.set("cache-control", PUBLIC_HTML_CACHE_CONTROL);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Diagnóstico (16/11/2026): a Vercel consome `s-maxage` e `stale-while-revalidate` e
// entrega ao navegador outro `cache-control`, então não dá para ver de fora qual
// política este servidor escreveu. Este cabeçalho repete o valor escrito aqui. Se ele
// não aparecer na resposta, ela não passou por este arquivo; se aparecer com um valor
// e o `cache-control` final for outro, quem trocou foi a hospedagem. Sem dado pessoal.
export const CACHE_POLICY_ECHO_HEADER = "x-bw-cache-policy";

export function withCachePolicyEcho(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set(CACHE_POLICY_ECHO_HEADER, `${response.status}; ${headers.get("cache-control") ?? "sem cache-control"}`);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

/**
 * /.well-known/llms.txt é a cópia de /llms.txt que alguns robôs de IA procuram.
 * As duas saem da mesma rota de servidor (src/routes/llms[.]txt.ts): aqui só
 * o caminho é reescrito, sem redirecionar, para a resposta ser idêntica.
 */
export const WELL_KNOWN_LLMS = "/.well-known/llms.txt";
export function rewriteWellKnownLlms(request: Request): Request {
  const url = new URL(request.url);
  if (url.pathname !== WELL_KNOWN_LLMS) return request;
  url.pathname = "/llms.txt";
  return new Request(url.toString(), request);
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const canonicalRedirect = canonicalHostRedirect(request) ?? lowercasePathRedirect(request);
    if (canonicalRedirect) return canonicalRedirect;
    request = rewriteWellKnownLlms(request);
    try {
      const render = async () => {
        const handler = await getServerEntry();
        const response = await handler.fetch(request, env, ctx);
        // modulepreload do <head> para junto do script de entrada (primeira pintura
        // mais cedo; ver src/lib/modulePreloadPlacement.ts). Na home, o
        // JavaScript só é pedido depois da primeira pintura, que já mostra o
        // texto do hero (LCP no celular; ver src/lib/entryAfterFirstPaint.ts).
        return withCachePolicyEcho(
          withNoCacheOnMissingFile(
            request,
            withEntryAfterFirstPaint(
              request,
              withModulePreloadsInBody(withShortEdgeCache(request, await normalizeCatastrophicSsrResponse(response))),
            ),
          ),
        );
      };
      // Páginas públicas saem do cache de borda do próprio worker (ver
      // src/lib/edgeHtmlCache.ts): a hospedagem não guarda HTML.
      return await serveWithEdgeCache(request, ctx as EdgeCacheContext, render, PUBLIC_HTML_CACHE_CONTROL);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
