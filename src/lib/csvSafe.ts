/**
 * Célula de CSV segura (separador `;`): neutraliza fórmulas de planilha
 * (=, +, -, @, tab, CR no início ganham apóstrofo) e aplica aspas quando preciso.
 * Valores vêm de visitantes (rastreamento), então nunca podem virar fórmula no Excel.
 */
export function csvCell(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return String(v);
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
