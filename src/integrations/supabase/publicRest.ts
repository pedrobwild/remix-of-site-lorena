/**
 * Leituras públicas (anônimas) do Supabase SEM o SDK `@supabase/supabase-js`.
 *
 * Por quê (velocidade, 09/11/2026): o SDK (auth, realtime, storage, postgrest
 * — ~55 kB gzip, 216 kB brutos) entrava no pacote inicial de TODA página
 * pública só para duas chamadas anônimas feitas logo após a hidratação:
 * `get_public_site_settings` (todas as páginas) e `top_projects` (home).
 * Essas leituras passam a ir direto na API REST (PostgREST) com a chave
 * publicável, que é o que o SDK faz por baixo para um visitante sem sessão.
 * Quem precisa do SDK (painel, login, envio de lead, leituras com builder)
 * carrega-o sob demanda por `getSupabase()` (src/integrations/supabase/lazyClient.ts).
 *
 * Mesmo contrato `{ data, error }` do SDK, para o código chamador não mudar.
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export type PublicRestError = { message: string; code?: string; status?: number };
export type PublicRestResult<T> = { data: T | null; error: PublicRestError | null };

function headers(): Record<string, string> {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function readError(res: Response): Promise<PublicRestError> {
  let message = res.statusText || `HTTP ${res.status}`;
  let code: string | undefined;
  try {
    const body = (await res.json()) as { message?: unknown; code?: unknown };
    if (typeof body?.message === "string") message = body.message;
    if (typeof body?.code === "string") code = body.code;
  } catch {
    /* corpo não é JSON */
  }
  return { message, code, status: res.status };
}

/** `POST /rest/v1/rpc/<fn>` — equivalente a `supabase.rpc(fn, args)` para um anônimo. */
export async function publicRpc<T = unknown>(
  fn: string,
  args: Record<string, unknown> = {},
  init?: { signal?: AbortSignal },
): Promise<PublicRestResult<T>> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${encodeURIComponent(fn)}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(args),
      signal: init?.signal,
    });
    if (!res.ok) return { data: null, error: await readError(res) };
    if (res.status === 204) return { data: null, error: null };
    const text = await res.text();
    return { data: text ? (JSON.parse(text) as T) : null, error: null };
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : String(err) } };
  }
}

/**
 * `GET /rest/v1/<table>?<query>` — leitura simples com filtros no formato do
 * PostgREST (`select=…`, `coluna=eq.valor`, `order=coluna.asc`).
 * Devolve sempre a lista (nunca `maybeSingle`).
 */
export async function publicSelect<T = Record<string, unknown>>(
  table: string,
  query: Record<string, string>,
  init?: { signal?: AbortSignal },
): Promise<PublicRestResult<T[]>> {
  try {
    const params = new URLSearchParams(query);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${encodeURIComponent(table)}?${params.toString()}`, {
      method: "GET",
      headers: headers(),
      signal: init?.signal,
    });
    if (!res.ok) return { data: null, error: await readError(res) };
    return { data: (await res.json()) as T[], error: null };
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : String(err) } };
  }
}
