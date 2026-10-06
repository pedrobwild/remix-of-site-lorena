// URLs públicas são todas em minúsculas e sem barra no fim. Quem chega em
// /Servicos ou /servicos/ recebe um 301 (permanente, para o Google consolidar
// o sinal) para /servicos. Ficam de fora os prefixos cujo caminho pode ser
// sensível a maiúsculas (ids públicos, API, admin, funções de servidor) e
// qualquer arquivo com extensão. Antes era 307 só para maiúsculas, e a barra
// final recebia o 307 do framework (TEC-07, auditoria de 05/10/2026).
const CASE_SENSITIVE_PREFIXES = ["o", "p", "api", "admin", "_serverFn", "functions", "assets"];

/** Caminho canônico (minúsculas, sem barra no fim) ou null quando já está certo. */
export function canonicalPathname(pathname: string): string | null {
  const firstSegment = pathname.split("/")[1] ?? "";
  if (CASE_SENSITIVE_PREFIXES.includes(firstSegment)) return null;
  const lastSegment = pathname.replace(/\/+$/, "").split("/").pop() ?? "";
  if (lastSegment.includes(".")) return null;
  let next = pathname.toLowerCase();
  if (next.length > 1) next = next.replace(/\/+$/, "") || "/";
  return next === pathname ? null : next;
}

export function lowercasePathRedirect(request: Request): Response | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const url = new URL(request.url);
  const next = canonicalPathname(url.pathname);
  if (!next) return null;
  url.pathname = next;
  return new Response(null, { status: 301, headers: { location: url.toString() } });
}

/**
 * Host canônico: www.bewild.com.br → bewild.com.br com 301. Hoje o domínio do
 * Lovable responde 302 antes de chegar aqui; se a requisição chegar com www,
 * o servidor devolve o permanente.
 */
export const CANONICAL_HOST = "bewild.com.br";
// Também o endereço publicado do Lovable: só o domínio próprio deve aparecer no Google.
// Os hosts de preview (id-preview--…) ficam de fora de propósito.
const REDIRECTED_HOSTS = [`www.${CANONICAL_HOST}`, "bewild.lovable.app"];

export function canonicalHostRedirect(request: Request): Response | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const url = new URL(request.url);
  if (!REDIRECTED_HOSTS.includes(url.hostname)) return null;
  url.hostname = CANONICAL_HOST;
  return new Response(null, { status: 301, headers: { location: url.toString() } });
}
