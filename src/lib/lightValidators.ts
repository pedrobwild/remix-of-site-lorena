/**
 * Validadores pequenos, sem zod, para o que entra no pacote inicial de TODA
 * página (rotas, `head()` e server functions importadas pelo root).
 *
 * Por quê (25/10/2026): `z.enum`/`z.object` em `pageSeo.functions.ts`,
 * `radarColetas.functions.ts`, `/coletas` e `/coletas-por-bairro` puxavam o
 * zod inteiro para o `index-*.js` do navegador (~360 KB de fonte), JavaScript
 * baixado e analisado na home sem uso nenhum (PageSpeed: 127 KB de JS não
 * usado). O zod continua liberado nos formulários e no painel, que carregam
 * em pedaços separados.
 */

/** `?bairro=` das páginas de coletas: texto de até 100 caracteres, opcional. */
export const BAIRRO_MAX = 100;

function rawBairro(input: unknown): unknown {
  return input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>).bairro : undefined;
}

/**
 * `validateSearch` das rotas de coletas: bairro inválido some da busca em vez
 * de derrubar a página (o zod lançava erro e a rota caía no errorComponent).
 */
export function searchBairro(input: unknown): { bairro?: string } {
  const raw = rawBairro(input);
  if (typeof raw !== "string" || raw.length > BAIRRO_MAX) return {};
  return { bairro: raw };
}

/**
 * Entrada da server function do Radar: mesmo contrato do zod que substitui
 * (`string().trim().max(100).optional()`): texto aparado, erro acima de 100.
 */
export function inputBairro(input: unknown): { bairro?: string } {
  const raw = rawBairro(input);
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("bairro inválido");
  if (raw === undefined) return {};
  if (typeof raw !== "string") throw new Error("bairro inválido");
  const bairro = raw.trim();
  if (bairro.length > BAIRRO_MAX) throw new Error("bairro inválido");
  return { bairro };
}

/** Um valor de uma lista fechada (substitui `z.enum([...])`). */
export function oneOf<const T extends readonly string[]>(values: T) {
  return (input: unknown): T[number] => {
    if (typeof input === "string" && (values as readonly string[]).includes(input)) return input as T[number];
    throw new Error("valor inválido");
  };
}
