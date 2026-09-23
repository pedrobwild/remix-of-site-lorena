// Helpers para a página 404 e o admin de URLs não encontradas.
//
// - logNotFound: registra (de forma idempotente) o path 404 atual no banco.
//   Usa a RPC SECURITY DEFINER `log_404`, que faz o upsert e incrementa hits.
//
// - lookupActiveRedirect: devolve o destino do redirecionamento configurado no
//   admin (/admin/seo/404) para o path atual, ou null. Usado quando a
//   NotFoundPage monta, para mandar o usuário à URL certa sem configuração
//   extra de hosting. Lê pela RPC SECURITY DEFINER `resolve_404_redirect`
//   (o visitante anônimo não tem SELECT em seo_404_log — por isso os
//   redirecionamentos nunca funcionavam para quem não estava logado).

import { supabase } from "@/integrations/supabase/client";
import { devWarn } from "@/lib/devLog";
import { isFramed } from "@/lib/cookieConsent";

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
  // Página aberta num iframe (auditoria de SEO do admin) não é hit de visitante.
  if (isFramed()) return;
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

/** Hosts do próprio site: URL absoluta para eles vira caminho relativo. */
const OWN_HOSTS = ["bewild.com.br", "www.bewild.com.br"];

/**
 * Normaliza o destino gravado no admin para um caminho interno seguro, ou
 * `null`. Só aceita caminho relativo à raiz (`/x`) — `//host`, `/\\host`,
 * esquemas (`javascript:`), espaços/caracteres de controle e hosts de
 * terceiros são recusados (open redirect), como no admin (seoRedirects.ts).
 * URL absoluta do próprio domínio vira caminho.
 */
export function safeRedirectTarget(raw: unknown, currentPath?: string): string | null {
  if (typeof raw !== "string") return null;
  let target = raw.trim();
  if (!target) return null;
  if (/^https?:\/\//i.test(target)) {
    try {
      const url = new URL(target);
      const host = url.hostname.toLowerCase();
      const own = OWN_HOSTS.includes(host) || (typeof window !== "undefined" && host === window.location.hostname);
      if (!own) return null;
      target = url.pathname + url.search + url.hash;
    } catch {
      return null;
    }
  }
  // eslint-disable-next-line no-control-regex
  if (!target.startsWith("/") || target.startsWith("//") || /[\\\s\u0000-\u001f\u007f]/.test(target)) {
    return null;
  }
  // Redirecionar para si mesmo = laço infinito de 404.
  if (currentPath && target.split(/[?#]/)[0].replace(/\/+$/, "") === currentPath.replace(/\/+$/, "")) {
    return null;
  }
  return target;
}

type RpcError = { code?: string; message?: string } | null;
type RpcClient = {
  rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: RpcError }>;
};

/** A RPC ainda não existe no banco (migração pendente). */
function isMissingRpc(error: RpcError): boolean {
  return error?.code === "PGRST202" || error?.code === "42883";
}

export async function lookupActiveRedirect(path: string): Promise<string | null> {
  if (!path) return null;
  try {
    // `resolve_404_redirect` ainda não está nos tipos gerados (types.ts).
    const { data, error } = await (supabase as unknown as RpcClient).rpc("resolve_404_redirect", {
      p_path: path,
    });
    if (!error) return safeRedirectTarget(data, path);
    if (!isMissingRpc(error)) {
      devWarn("[notFoundLog] resolve_404_redirect respondeu erro:", error);
      return null;
    }
  } catch (err) {
    devWarn("[notFoundLog] resolve_404_redirect falhou:", err);
    return null;
  }

  // Fallback enquanto a RPC não é publicada: leitura direta (só funciona para
  // quem tem SELECT na tabela — hoje, admin logado).
  try {
    const { data, error } = await supabase
      .from("seo_404_log")
      .select("redirect_to, status")
      .eq("path", path)
      .eq("status", "redirect")
      .maybeSingle();
    if (error || !data?.redirect_to) return null;
    return safeRedirectTarget(data.redirect_to, path);
  } catch (err) {
    devWarn("[notFoundLog] lookupActiveRedirect falhou:", err);
    return null;
  }
}
