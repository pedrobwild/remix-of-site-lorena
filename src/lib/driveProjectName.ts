/**
 * Converte o nome de uma pasta do Google Drive no título padrão de projeto:
 * "iniciais do cliente · nome do prédio".
 *
 * Exemplos:
 *   "34 - FD - Next One vila nova" -> "FD · Next One Vila Nova"
 *   "TB - Latitude Campo Belo"     -> "TB · Latitude Campo Belo"
 *   "AG-YBY"                       -> "AG · YBY"
 */

const SMALL_WORDS = new Set([
  "de", "da", "do", "das", "dos", "e", "em", "no", "na", "nos", "nas", "of", "the",
]);

function titleCaseWord(word: string, index: number): string {
  if (!word) return word;
  // Mantém siglas já em caixa alta (YBY, SP, JK…)
  if (word.length <= 4 && word === word.toUpperCase() && /[A-ZÀ-Ú]/.test(word)) return word;
  const lower = word.toLocaleLowerCase("pt-BR");
  if (index > 0 && SMALL_WORDS.has(lower)) return lower;
  return lower.charAt(0).toLocaleUpperCase("pt-BR") + lower.slice(1);
}

export function titleCasePt(input: string): string {
  return input
    .trim()
    .split(/\s+/)
    .map(titleCaseWord)
    .join(" ");
}

export type ParsedFolderName = {
  /** Iniciais do cliente (caixa alta) ou "" quando a pasta não traz. */
  initials: string;
  /** Nome do prédio/unidade já normalizado. */
  building: string;
  /** Título final pronto para o campo "Projeto". */
  title: string;
};

export function parseDriveFolderName(raw: string): ParsedFolderName {
  // Remove numeração de ordem no começo: "34 - ", "34. ", "34) "
  const cleaned = (raw || "")
    .replace(/^\s*\d{1,4}\s*[-–—.)_]\s*/, "")
    .trim();

  const m = cleaned.match(/^([\p{L}]{1,4})\s*[-–—_]\s*(.+)$/u);
  if (m) {
    const initials = m[1].toLocaleUpperCase("pt-BR");
    const building = titleCasePt(m[2]);
    return { initials, building, title: `${initials} · ${building}` };
  }

  const building = titleCasePt(cleaned) || "Projeto";
  return { initials: "", building, title: building };
}
