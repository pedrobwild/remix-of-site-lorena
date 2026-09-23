/**
 * Reordenação de listas do painel (FAQ da home, projetos do portfólio).
 *
 * Antes: o FAQ disparava N updates em paralelo sem conferir erro (arrastos
 * sobrepostos intercalavam as gravações) e as setas dos projetos faziam só
 * ±1 numa linha — com empates o desempate era `created_at` e o clique muitas
 * vezes não movia nada. Aqui a nova ordem é calculada inteira e cada item
 * recebe um índice distinto (passo 10); só as linhas que mudam são gravadas,
 * em sequência, e qualquer erro interrompe e é devolvido.
 */

export const ORDER_STEP = 10;

/** Move o item de `from` para `to` (como o arrayMove do dnd-kit). */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  if (from < 0 || from >= next.length || to < 0 || to >= next.length || from === to) return next;
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export type OrderChange = { id: string; value: number };

/**
 * Atribui `(i + 1) * step` a cada item na ordem dada e devolve a lista
 * atualizada e só as mudanças necessárias.
 */
export function renumber<T extends { id: string }>(
  ordered: readonly T[],
  key: keyof T,
  step: number = ORDER_STEP,
): { list: T[]; changes: OrderChange[] } {
  const changes: OrderChange[] = [];
  const list = ordered.map((item, i) => {
    const value = (i + 1) * step;
    if (item[key] !== value) changes.push({ id: item.id, value });
    return { ...item, [key]: value } as T;
  });
  return { list, changes };
}

/**
 * Aplica as mudanças uma a uma (sem paralelismo, para não intercalar com
 * outra reordenação) e para no primeiro erro.
 */
export async function applyOrderChanges(
  changes: readonly OrderChange[],
  write: (change: OrderChange) => PromiseLike<{ error: { message: string } | null }>,
): Promise<{ applied: number; error: string | null }> {
  let applied = 0;
  for (const change of changes) {
    let res: { error: { message: string } | null };
    try {
      res = await write(change);
    } catch (e) {
      return { applied, error: e instanceof Error ? e.message : String(e) };
    }
    if (res.error) return { applied, error: res.error.message };
    applied += 1;
  }
  return { applied, error: null };
}
