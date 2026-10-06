// URLs públicas são todas em minúsculas. Quem digita /Servicos recebe um 307
// (temporário) para /servicos, evitando página duplicada por diferença de caixa.
// Ficam de fora os prefixos cujo caminho pode ser sensível a maiúsculas
// (ids públicos, API, admin, funções de servidor) e qualquer arquivo com extensão.
const CASE_SENSITIVE_PREFIXES = ["o", "p", "api", "admin", "_serverFn", "functions", "assets"];

export function lowercasePathRedirect(request: Request): Response | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const url = new URL(request.url);
  const { pathname } = url;
  if (pathname === pathname.toLowerCase()) return null;
  const firstSegment = pathname.split("/")[1] ?? "";
  if (CASE_SENSITIVE_PREFIXES.includes(firstSegment)) return null;
  const lastSegment = pathname.split("/").pop() ?? "";
  if (lastSegment.includes(".")) return null;
  url.pathname = pathname.toLowerCase();
  return new Response(null, { status: 307, headers: { location: url.toString() } });
}
