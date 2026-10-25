/**
 * Serve, pelo worker, o HTML pré-renderizado no build (`<rota>/index.html`
 * em `public/`, ver src/config/prerender.ts) quando a hospedagem entrega a
 * requisição ao worker em vez de servir o arquivo estático ela mesma. O
 * manifesto de estáticos do Nitro é gerado antes do prerender, então
 * `isPublicAssetURL("/reforma-de-studio-sao-paulo")` é falso e, sem isto, a
 * página seria montada de novo a cada visita, jogando o prerender fora.
 *
 * Só GET/HEAD em caminhos da lista, só com o binding `ASSETS` do Cloudflare.
 * Se o arquivo não existir (build sem prerender, outro preset), devolve
 * `null` e a renderização normal segue.
 */
import { PRERENDERED_SET } from "@/config/prerender";

type AssetsBinding = { fetch: (request: Request) => Promise<Response> };

export function assetsBindingFrom(env: Record<string, unknown> | undefined): AssetsBinding | null {
  const assets = env?.ASSETS as { fetch?: unknown } | undefined;
  return assets && typeof assets.fetch === "function" ? (assets as AssetsBinding) : null;
}

/** Caminhos candidatos ao arquivo estático, na ordem em que se tenta. */
export function prerenderedFileCandidates(pathname: string): string[] {
  if (!PRERENDERED_SET.has(pathname)) return [];
  const base = pathname === "/" ? "" : pathname;
  return [`${base}/index.html`, `${base}/`];
}

export async function servePrerendered(
  request: Request,
  env: Record<string, unknown> | undefined,
): Promise<Response | null> {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const assets = assetsBindingFrom(env);
  if (!assets) return null;
  const url = new URL(request.url);
  const candidates = prerenderedFileCandidates(url.pathname);
  if (candidates.length === 0) return null;

  for (const path of candidates) {
    try {
      let res = await assets.fetch(new Request(`${url.origin}${path}`, { method: "GET", headers: { accept: "text/html" } }));
      // html_handling da hospedagem pode responder com redirecionamento
      // (/x/index.html → /x/): segue uma vez, ainda dentro do binding.
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) continue;
        res = await assets.fetch(new Request(new URL(location, url.origin).toString(), { method: "GET", headers: { accept: "text/html" } }));
      }
      if (res.status !== 200) continue;
      if (!(res.headers.get("content-type") ?? "").includes("text/html")) continue;
      const headers = new Headers(res.headers);
      headers.set("x-bw-prerendered", "1");
      return new Response(request.method === "HEAD" ? null : res.body, { status: 200, headers });
    } catch {
      /* binding falhou: tenta o próximo caminho ou cai no SSR */
    }
  }
  return null;
}
