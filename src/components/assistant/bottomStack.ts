/**
 * Pilha de elementos fixos no rodapé da tela (banner de cookies, barra do
 * guia do investidor...), para o botão "Dúvidas" do SiteAssistant parar logo
 * acima dela. (A barra "Solicitar orçamento" da home não entra: no celular o
 * botão fica ao lado dela, na mesma linha.)
 *
 * A pilha começa na borda inferior da tela e vai subindo: um elemento entra
 * quando termina a até STACK_GAP px do topo atual da pilha. Assim também entra
 * o que está empilhado sobre outro elemento. É o caso da barra do guia:
 * enquanto o banner de cookies está aberto ela sobe a altura dele
 * (`--cookie-banner-h`) e termina longe da borda — pela regra antiga, que só
 * olhava o que termina perto da borda, o botão parava em cima dela. O que
 * está longe da pilha (um cabeçalho fixo, por exemplo) não entra.
 */
export const STACK_GAP = 120;

export type StackRect = { top: number; bottom: number; height: number };

/**
 * Topo da pilha, em px a partir do topo da tela. Devolve `viewportHeight`
 * quando não há nada ancorado no rodapé. Elementos com mais de 60% da altura
 * da tela não contam (não são barras de rodapé).
 */
export function bottomStackTop(rects: readonly StackRect[], viewportHeight: number): number {
  const candidates = rects
    .filter((r) => r.height > 0 && r.height <= viewportHeight * 0.6)
    .sort((a, b) => b.bottom - a.bottom);
  let top = viewportHeight;
  for (const r of candidates) {
    // Ordenados de baixo para cima: o primeiro que fica longe da pilha
    // encerra a busca (os seguintes terminam ainda mais acima).
    if (r.bottom < top - STACK_GAP) break;
    top = Math.min(top, r.top);
  }
  return top;
}
