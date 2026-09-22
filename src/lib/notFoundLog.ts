// Helpers para a página 404 e o admin de URLs não encontradas.
//
// - logNotFound: registra (de forma idempotente) o path 404 atual no banco.
//   Usa a RPC SECURITY DEFINER `log_404`, que faz o upsert e incrementa hits.
//
// - lookupActiveRedirect: consulta seo_404_log e devolve `redirect_to` se houver
//   um redirecionamento configurado para o path atual com status='redirect'.
//   Usado no momento em que a NotFoundPage monta para enviar o usuário para a
//   URL correta sem precisar publicar configuração extra de hosting.

import { supabase } from "@/integrations/supabase/client";
import { devWarn } from "@/lib/devLog";

const SESSION_FLAG_PREFIX = "404-logged:";

/** Evita registrar o mesmo path mais de uma vez por sessão do navegador. */
function hasLoggedThisSession(path: string): boolean {
  try {
    return sessionStorage.getItem(SESSION_FLAG_PREFIX + path) === "1";
  } catch {
    return false;
  }
}
function markLoggedThisSession(path: string) {
  try {
    sessionStorage.setItem(SESSION_FLAG_PREFIX + path, "1");
  } catch {
    /* sessionStorage indisponível */
  }
}

/**
 * Motivo padrão do registro. Existe para desambiguar a RPC, não por estética:
 * o banco de produção tem DUAS sobrecargas de `log_404` —
 * `(p_path, p_referrer)` e `(p_path, p_referrer, p_reason)`, ambas com
 * defaults. Um POST com só `{p_path, p_referrer}` casa com as duas e o
 * PostgREST responde PGRST203 ("could not choose the best candidate
 * function") em vez de gravar. Enviar `p_reason` sempre fecha o match na
 * sobrecarga de 3 argumentos. Ver DB-01 em
 * docs/auditoria/rodada-2026-09-22.md.
 */
export const DEFAULT_404_REASON = "spa_not_found";

export async function logNotFound(path: string, referrer?: string | null): Promise<void> {
  if (!path || path === "/") return;
  if (hasLoggedThisSession(path)) return;
  markLoggedThisSession(path);
  try {
    // supabase-js NÃO lança em erro de API: devolve `{ error }`. Sem ler esse
    // campo, o try/catch abaixo nunca disparava e a falha ficava invisível —
    // foi assim que `seo_404_log` ficou em 0 linhas sem ninguém perceber.
    // `p_referrer: ""` e não `undefined`: uma chave ausente some no
    // JSON.stringify e muda a assinatura enviada ao PostgREST. A função faz
    // `coalesce(p_referrer, '')`, então string vazia e NULL gravam o mesmo.
    const { error } = await supabase.rpc("log_404", {
      p_path: path,
      p_referrer: referrer || "",
      p_reason: DEFAULT_404_REASON,
    });
    if (error) devWarn("[notFoundLog] log_404 respondeu erro:", error);
  } catch (err) {
    // Nunca derruba o render por logging — mas em DEV avisa o autor,
    // antes o catch silenciava completamente (L9 do audit).
    devWarn("[notFoundLog] log_404 falhou:", err);
  }
}

export async function lookupActiveRedirect(path: string): Promise<string | null> {
  if (!path) return null;
  try {
    const { data, error } = await supabase
      .from("seo_404_log")
      .select("redirect_to, status")
      .eq("path", path)
      .eq("status", "redirect")
      .maybeSingle();
    if (error || !data?.redirect_to) return null;
    return data.redirect_to;
  } catch (err) {
    devWarn("[notFoundLog] lookupActiveRedirect falhou:", err);
    return null;
  }
}
