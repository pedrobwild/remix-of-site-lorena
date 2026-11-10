/**
 * IndexNow (Bing, Yandex, Seznam, Naver…) a partir do servidor do app.
 *
 * O workflow `.github/workflows/indexnow.yml` envia o sitemap inteiro a cada
 * push na `main` e uma vez por dia; post ou projeto publicado pelo /admin não
 * gera push, então a função de servidor `notifyIndexNow`
 * (`indexNow.functions.ts`) chama `avisarIndexNowDaPagina` logo depois de o
 * painel salvar uma página publicada, só com a URL canônica dela.
 *
 * A chave é pública por desenho do protocolo: o arquivo `public/<chave>.txt`
 * é servido em https://bewild.com.br/<chave>.txt e é a mesma do
 * `scripts/submit-indexnow.mjs` (o teste `indexNow.test.ts` confere os três).
 *
 * Nunca lança: falha de rede, tempo esgotado ou recusa do IndexNow viram um
 * resultado `falhou` e uma linha `[indexnow]` no console do servidor. Salvar
 * no painel não depende disto.
 */
import { destinoDoPostFundido } from "@/lib/postsFundidos";

export const INDEXNOW_HOST = "bewild.com.br";
export const INDEXNOW_KEY = "e335044b65f693784a464fb36d9557af";
export const INDEXNOW_KEY_LOCATION = `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`;
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/** Teto de espera pela resposta do IndexNow (a chamada é em segundo plano). */
const TIMEOUT_MS = 10_000;

export type IndexNowKind = "post" | "project";

export type IndexNowPayload = {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
};

export type IndexNowResult =
  | { status: "enviado"; http: number; url: string }
  | { status: "ignorado"; motivo: "não publicado" | "slug inválido" }
  | { status: "falhou"; motivo: string; url: string; http?: number };

const MOTIVOS: Record<number, string> = {
  400: "requisição inválida (formato)",
  403: `chave não encontrada ou inválida em ${INDEXNOW_KEY_LOCATION}`,
  422: "URL não pertence ao host ou a chave não confere",
  429: "muitas requisições (limite de taxa)",
};

/** Mesmo formato de `isValidSlug` do painel: minúsculas, números e hífens. */
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/**
 * URL canônica pública de um post (`/conteudos/<slug>`) ou projeto
 * (`/portfolio/<slug>`). Post fundido em outro responde 301 para o destino,
 * então o aviso vai para o destino. Slug fora do formato → `null`.
 */
export function indexNowPageUrl(kind: IndexNowKind, slug: string): string | null {
  const s = slug.trim();
  if (!SLUG_RE.test(s)) return null;
  if (kind === "post") return `https://${INDEXNOW_HOST}/conteudos/${destinoDoPostFundido(s) ?? s}`;
  return `https://${INDEXNOW_HOST}/portfolio/${s}`;
}

/** Corpo do POST para api.indexnow.org. */
export function buildIndexNowPayload(urlList: string[]): IndexNowPayload {
  return { host: INDEXNOW_HOST, key: INDEXNOW_KEY, keyLocation: INDEXNOW_KEY_LOCATION, urlList };
}

/**
 * Avisa o IndexNow de uma página salva no painel. Rascunho ou despublicado não
 * é enviado (a página não está no ar). Nunca lança.
 */
export async function avisarIndexNowDaPagina(
  page: { kind: IndexNowKind; slug: string; published: boolean },
  opts: { fetch?: typeof fetch; timeoutMs?: number } = {}
): Promise<IndexNowResult> {
  if (!page.published) return { status: "ignorado", motivo: "não publicado" };
  const url = indexNowPageUrl(page.kind, page.slug);
  if (!url) return { status: "ignorado", motivo: "slug inválido" };

  const fetchFn = opts.fetch ?? fetch;
  try {
    const res = await fetchFn(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(buildIndexNowPayload([url])),
      signal: AbortSignal.timeout(opts.timeoutMs ?? TIMEOUT_MS),
    });
    // 200 = aceito; 202 = aceito, chave ainda em validação.
    if (res.ok) return { status: "enviado", http: res.status, url };
    const corpo = (await res.text().catch(() => "")).slice(0, 200);
    const motivo = MOTIVOS[res.status] ?? "erro inesperado";
    console.error(
      `[indexnow] HTTP ${res.status} ao avisar ${url}: ${motivo}${corpo ? ` — ${corpo}` : ""}`
    );
    return { status: "falhou", motivo, http: res.status, url };
  } catch (err) {
    const motivo = err instanceof Error ? err.message : String(err);
    console.error(`[indexnow] falha de rede ao avisar ${url}: ${motivo}`);
    return { status: "falhou", motivo, url };
  }
}
