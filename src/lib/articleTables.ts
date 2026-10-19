/**
 * Tabelas do artigo no celular (MOB-07, 06/10/2026).
 *
 * O CSS antigo punha `min-width: 520px` na própria <table> com
 * `display: block; overflow-x: auto`: quem ficava com 520 px era a caixa
 * rolável, não o conteúdo — não havia o que rolar, a tabela estourava a coluna
 * do texto e o `overflow-x: hidden` da página cortava as últimas colunas
 * (de 98 a 222 px escondidos, de 412 a 320 px de tela), sem como alcançá-las.
 *
 * Cada <table> passa a vir dentro de uma região rolável (`.pt-table-wrap`,
 * estilos em src/styles/post.css): a região tem a largura da coluna e a tabela
 * mantém a largura mínima de leitura. `tabindex` + `role="region"` + um nome
 * deixam a rolagem alcançável pelo teclado e anunciada por leitor de tela
 * (o Safari não põe foco sozinho em área rolável; por isso o `tabindex` fixo,
 * mesmo custando uma parada do Tab a mais onde a tabela cabe inteira).
 *
 * O nome é neutro — "Tabela 1", "Tabela 2"… na ordem do artigo — porque vale
 * em qualquer largura: em tela larga não há nada para rolar.
 *
 * Indicação de rolagem (19/10/2026): a região fica num bloco `.pt-table` com
 * uma dica em texto antes dela ("Deslize para o lado…"). O CSS só mostra a
 * dica quando a tabela tem 3 colunas ou mais e o bloco é mais estreito que a
 * largura mínima da tabela — ou seja, quando há mesmo o que rolar. A dica é
 * `aria-hidden`: quem usa leitor de tela navega a tabela pelas células, e a
 * região já é anunciada e alcançável pelo teclado. A sombra nas bordas sai do
 * fundo da própria região (ver src/styles/post.css), em qualquer navegador.
 *
 * É aplicado depois do sanitizador (que removeria `tabindex`), nos dois pontos
 * em que o corpo vira HTML: o loader (src/lib/contentLoaders.ts) e a reserva
 * no cliente (src/pages/BewildPostPage.tsx).
 */
/** Classe da região rolável — também usada no JSX das páginas com tabela fixa (/privacidade, /preferencias-de-cookies). */
export const TABLE_REGION_CLASS = "pt-table-wrap";

/** Bloco que agrupa a dica e a região (é ele que o CSS mede para decidir se mostra a dica). */
export const TABLE_BLOCK_CLASS = "pt-table";
/** Dica em texto para quem enxerga; só aparece quando a tabela não cabe (CSS). */
export const TABLE_HINT_CLASS = "pt-table-hint";
export const TABLE_HINT_TEXT = "Deslize para o lado para ver todas as colunas →";

/** Abertura do bloco da n-ésima tabela do artigo (n começa em 1): bloco, dica e região. */
export const tableWrapOpen = (n: number): string =>
  `<div class="${TABLE_BLOCK_CLASS}">` +
  `<p class="${TABLE_HINT_CLASS}" aria-hidden="true">${TABLE_HINT_TEXT}</p>` +
  `<div class="${TABLE_REGION_CLASS}" tabindex="0" role="region" aria-label="Tabela ${n}">`;
/** Fecha a região e o bloco. */
export const TABLE_WRAP_CLOSE = "</div></div>";

/**
 * Qualquer tag, com os valores entre aspas lidos inteiros: um `<table` ou um
 * `>` dentro de `alt="…"` faz parte do atributo, não é tag.
 */
const TAG = /<(\/?)([a-zA-Z][\w:-]*)(?:"[^"]*"|'[^']*'|[^'">])*>/g;

/** Envolve as tabelas de primeiro nível; tabelas dentro de tabela ficam como estão. */
export function wrapArticleTables(html: string): string {
  if (!html || !/<table\b/i.test(html)) return html;
  let out = "";
  let last = 0;
  let depth = 0;
  let count = 0;
  TAG.lastIndex = 0;
  for (let m = TAG.exec(html); m; m = TAG.exec(html)) {
    if (m[2].toLowerCase() !== "table") continue;
    const closing = m[1] === "/";
    if (!closing) {
      if (depth === 0) {
        count += 1;
        out += html.slice(last, m.index) + tableWrapOpen(count);
        last = m.index;
      }
      depth += 1;
    } else if (depth > 0) {
      depth -= 1;
      if (depth === 0) {
        const end = m.index + m[0].length;
        out += html.slice(last, end) + TABLE_WRAP_CLOSE;
        last = end;
      }
    }
  }
  // Tabela sem fechamento (HTML truncado): fecha a região e o bloco para não engolir o resto.
  return out + html.slice(last) + (depth > 0 ? TABLE_WRAP_CLOSE : "");
}
