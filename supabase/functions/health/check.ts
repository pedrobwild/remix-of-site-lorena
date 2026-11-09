// Checagem do banco usada pela edge function `health` (index.ts). Sem
// imports de rede: testada pelo Vitest (src/lib/__tests__/healthCheck.test.ts).

/** Teto da consulta: banco pausado pode segurar a conexão sem responder. */
export const HEALTH_TIMEOUT_MS = 3000;

type Env = (name: string) => string | undefined;
type FetchFn = (input: string, init: RequestInit) => Promise<Response>;

/**
 * `HEAD` em `site_settings` (uma linha) pela API REST: prova que o Postgres
 * respondeu sem trazer nenhum dado. Qualquer falha, resposta não-2xx ou
 * tempo esgotado → `false`. Nunca lança.
 */
export async function databaseResponds(
  env: Env,
  fetchFn: FetchFn = fetch,
  timeoutMs: number = HEALTH_TIMEOUT_MS,
): Promise<boolean> {
  const url = env("SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchFn(`${url.replace(/\/$/, "")}/rest/v1/site_settings?select=id&limit=1`, {
      method: "HEAD",
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** Corpo e status da resposta: só `ok`, nada sobre o banco. */
export function healthResponse(ok: boolean): { status: 200 | 503; body: { ok: boolean } } {
  return ok ? { status: 200, body: { ok: true } } : { status: 503, body: { ok: false } };
}
