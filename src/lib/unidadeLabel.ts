/**
 * Título do projeto no portfólio → nome curto da unidade no card do case
 * (/parceiros/incorporadoras). Ex.: "PI - LM URBANFLEX" → "Unidade PI";
 * "APSA2 - URBAN FLEX" → "Unidade APSA 2". Sem o padrão "SIGLA - ...",
 * devolve o título como está.
 */
export function unidadeLabel(title: string): string {
  const m = title.match(/^\s*([A-Za-z]{1,8})(\d{0,2})\s*[-–—]\s*\S/);
  if (!m) return title.trim();
  return `Unidade ${m[1].toUpperCase()}${m[2] ? ` ${m[2]}` : ""}`;
}
