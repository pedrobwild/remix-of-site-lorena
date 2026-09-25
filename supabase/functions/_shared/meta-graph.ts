// Leitura da Graph API da Meta para o `meta-sync` (métricas diárias das
// campanhas e leads dos formulários instantâneos). Módulo puro — sem Deno.* e
// sem imports `npm:` — testado pelo Vitest (src/lib/__tests__/metaSync.test.ts).
//
// O token vai no cabeçalho `Authorization` (nunca na URL) e nenhuma mensagem
// de erro sai daqui sem passar por `redactSecrets`. Com `META_APP_SECRET`
// configurado, cada chamada leva o `appsecret_proof` (obrigatório quando o app
// da Meta tem "Exigir chave secreta do app" ligado).

import { META_GRAPH_VERSION, redactSecrets } from "./meta-capi.ts";

export const GRAPH_BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

/** Por que a chamada falhou, em categorias que o painel sabe explicar. */
export type GraphErrorReason =
  | "token_invalid"
  | "permission"
  | "rate_limit"
  | "not_found"
  | "bad_request"
  | "server"
  | "timeout"
  | "network";

export class GraphApiError extends Error {
  readonly reason: GraphErrorReason;
  readonly httpStatus: number | null;
  readonly code: number | null;
  readonly subcode: number | null;
  readonly fbtraceId: string | null;

  constructor(init: {
    reason: GraphErrorReason;
    message: string;
    httpStatus?: number | null;
    code?: number | null;
    subcode?: number | null;
    fbtraceId?: string | null;
  }) {
    super(redactSecrets(init.message).slice(0, 300));
    this.name = "GraphApiError";
    this.reason = init.reason;
    this.httpStatus = init.httpStatus ?? null;
    this.code = init.code ?? null;
    this.subcode = init.subcode ?? null;
    this.fbtraceId = init.fbtraceId ?? null;
  }

  /** Resumo curto para `meta_sync_state.last_error` e `integration_log`. */
  summary(): string {
    const code = this.code != null ? ` (code ${this.code}${this.subcode != null ? `/${this.subcode}` : ""})` : "";
    return `${this.reason}: ${this.message}${code}`.slice(0, 300);
  }
}

/**
 * Códigos de erro da Graph API → categoria.
 * https://developers.facebook.com/docs/graph-api/guides/error-handling
 */
export function classifyGraphError(httpStatus: number | null, code: number | null, subcode: number | null): GraphErrorReason {
  if (code === 190 || code === 102 || code === 463 || code === 467) return "token_invalid";
  if (code === 4 || code === 17 || code === 32 || code === 341 || code === 613) return "rate_limit";
  if (code != null && code >= 80000 && code <= 80014) return "rate_limit";
  if (code === 10 || code === 294 || (code != null && code >= 200 && code <= 299)) return "permission";
  if (code === 100 && subcode === 33) return "not_found";
  if (code === 1 || code === 2) return "server";
  if (httpStatus === 401) return "token_invalid";
  if (httpStatus === 403) return "permission";
  if (httpStatus === 404) return "not_found";
  if (httpStatus === 429) return "rate_limit";
  if (httpStatus != null && httpStatus >= 500) return "server";
  return "bad_request";
}

const encoder = new TextEncoder();

/** `appsecret_proof` = HMAC-SHA256(token, app secret) em hexadecimal. */
export async function appSecretProof(token: string, appSecret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(appSecret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(token));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type GraphParams = Record<string, string | number | boolean | null | undefined>;

export type GraphClientOptions = {
  token: string;
  appSecret?: string | null;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export type GraphPage<T> = { data?: T[]; paging?: { next?: string; cursors?: { after?: string } } };

export type GraphClient = {
  /** GET de um nó ou aresta; `path` sem a versão (ex.: `act_123/insights`). */
  get<T>(path: string, params?: GraphParams): Promise<T>;
  /** Segue `paging.next` até acabar ou até `maxPages`; `truncated` avisa o corte. */
  getAll<T>(path: string, params?: GraphParams, opts?: { maxPages?: number }): Promise<{ data: T[]; truncated: boolean }>;
};

function buildUrl(pathOrUrl: string, params: GraphParams = {}): URL {
  const url = pathOrUrl.startsWith("https://")
    ? new URL(pathOrUrl)
    : new URL(`${GRAPH_BASE}/${pathOrUrl.replace(/^\/+/, "")}`);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    url.searchParams.set(k, String(v));
  }
  // O token nunca viaja na URL (nem se a Meta devolver um `next` com ele).
  url.searchParams.delete("access_token");
  return url;
}

export function createGraphClient(opts: GraphClientOptions): GraphClient {
  const doFetch = opts.fetchImpl ?? fetch;
  const timeoutMs = opts.timeoutMs ?? 20_000;
  let proof: Promise<string> | null = null;

  async function request<T>(url: URL): Promise<T> {
    if (opts.appSecret) {
      proof ??= appSecretProof(opts.token, opts.appSecret);
      url.searchParams.set("appsecret_proof", await proof);
    }
    let res: Response;
    try {
      res = await doFetch(url.toString(), {
        method: "GET",
        headers: { Authorization: `Bearer ${opts.token}` },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      const timeout = err instanceof Error && err.name === "TimeoutError";
      throw new GraphApiError({
        reason: timeout ? "timeout" : "network",
        message: timeout ? "A Graph API não respondeu a tempo." : "Falha de rede ao contatar a Graph API.",
      });
    }
    const text = await res.text().catch(() => "");
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      /* corpo não-JSON: decide pelo status */
    }
    const error = (json as { error?: { message?: unknown; code?: unknown; error_subcode?: unknown; fbtrace_id?: unknown } } | null)
      ?.error;
    if (!res.ok || error) {
      const code = typeof error?.code === "number" ? error.code : null;
      const subcode = typeof error?.error_subcode === "number" ? error.error_subcode : null;
      throw new GraphApiError({
        reason: classifyGraphError(res.status, code, subcode),
        message: typeof error?.message === "string" ? error.message : `Graph API respondeu ${res.status}.`,
        httpStatus: res.status,
        code,
        subcode,
        fbtraceId: typeof error?.fbtrace_id === "string" ? error.fbtrace_id : null,
      });
    }
    return json as T;
  }

  return {
    get<T>(path: string, params?: GraphParams) {
      return request<T>(buildUrl(path, params));
    },
    async getAll<T>(path: string, params?: GraphParams, o: { maxPages?: number } = {}) {
      const maxPages = o.maxPages ?? 20;
      const out: T[] = [];
      let url: URL | null = buildUrl(path, params);
      let pages = 0;
      while (url) {
        const page: GraphPage<T> = await request<GraphPage<T>>(url);
        out.push(...(page.data ?? []));
        pages += 1;
        const next: string | undefined = page.paging?.next;
        if (!next || !(page.data ?? []).length) return { data: out, truncated: false };
        if (pages >= maxPages) return { data: out, truncated: true };
        url = buildUrl(next);
      }
      return { data: out, truncated: false };
    },
  };
}

/** Mensagem em português para o painel, a partir da categoria do erro. */
export function graphErrorHint(reason: GraphErrorReason | string | null | undefined): string {
  switch (reason) {
    case "no_token":
      return "Falta o token da Meta (segredo META_ADS_ACCESS_TOKEN).";
    case "token_invalid":
      return "O token da Meta expirou ou foi revogado — gere um novo token de usuário do sistema.";
    case "permission":
      return "O token não tem permissão para esta leitura (ads_read para campanhas; leads_retrieval e acesso à Página para os formulários).";
    case "rate_limit":
      return "A Meta limitou as chamadas por alguns minutos; a próxima sincronização tenta de novo.";
    case "not_found":
      return "A conta de anúncios, a Página ou o formulário não foi encontrado com este token.";
    case "timeout":
    case "network":
    case "server":
      return "A Meta não respondeu; a próxima sincronização tenta de novo.";
    default:
      return "A Meta recusou a consulta.";
  }
}
