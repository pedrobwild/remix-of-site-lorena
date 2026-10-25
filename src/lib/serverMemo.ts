/**
 * Memo curto, SÓ NO SERVIDOR, para as consultas ao banco que os loaders das
 * rotas públicas fazem a cada renderização (lista de projetos para os links
 * de bairro, lista de posts, artigo por slug, FAQ…).
 *
 * Por que: na hospedagem da Lovable o HTML não fica em cache (nem o da
 * própria CDN, nem a Cache API do worker guarda nada — medido em 25/10/2026
 * depois da publicação: `x-bw-edge: MISS` sempre; só o `/index.html` da raiz
 * sai como estático). O que resta é fazer a renderização em si ser rápida: o
 * /orcamento, que não lê o banco por visita desde o memo das configurações,
 * responde em ~80–110 ms; a página de studio, que lia a lista de projetos a
 * cada visita, levava 900–1.300 ms só no servidor.
 *
 * Regras: `typeof window === "undefined"` (no navegador a navegação SPA
 * continua buscando como antes); só resultado que o chamador declara bom
 * entra (`keep`), falha de rede nunca; chamadas simultâneas da mesma chave
 * compartilham a promessa; validade padrão de 60 s — o teto de atraso para
 * uma edição no painel aparecer no HTML do servidor.
 */

export const SERVER_MEMO_MS = 60_000;

type Entry = { at: number; value: unknown };
const store = new Map<string, Entry>();
const inFlight = new Map<string, Promise<unknown>>();

export function isServer(): boolean {
  return typeof window === "undefined";
}

export async function serverMemo<T>(
  key: string,
  fn: () => Promise<T>,
  opts?: { ttlMs?: number; keep?: (value: T) => boolean; now?: () => number },
): Promise<T> {
  if (!isServer()) return fn();
  const now = opts?.now ?? Date.now;
  const ttl = opts?.ttlMs ?? SERVER_MEMO_MS;
  const hit = store.get(key);
  if (hit && now() - hit.at < ttl) return hit.value as T;
  const pending = inFlight.get(key);
  if (pending) return pending as Promise<T>;
  const p = fn()
    .then((value) => {
      if (!opts?.keep || opts.keep(value)) store.set(key, { at: now(), value });
      return value;
    })
    .finally(() => {
      inFlight.delete(key);
    });
  inFlight.set(key, p);
  return p;
}

/** Só para testes. */
export function resetServerMemo(): void {
  store.clear();
  inFlight.clear();
}
