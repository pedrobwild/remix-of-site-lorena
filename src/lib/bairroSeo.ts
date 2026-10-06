import { formatAreaM2 } from "./formatArea";

/**
 * Faixa de metragem dos projetos de um bairro, em pt-BR: "24,5 a 35,12 m²"
 * (ou "28 m²" quando só há uma). Usada no texto da página e na descrição do
 * servidor, para as duas dizerem a mesma coisa.
 */
export function bairroAreaRange(list: ReadonlyArray<{ area_m2?: number | null }>): string | null {
  const areas = list.map((p) => p.area_m2).filter((n): n is number => typeof n === "number" && n > 0);
  if (!areas.length) return null;
  const min = Math.min(...areas);
  const max = Math.max(...areas);
  if (min === max) return formatAreaM2(min);
  const num = (n: number) => (formatAreaM2(n) ?? "").replace(/\s*m²$/, "");
  return `${num(min)} a ${num(max)} m²`;
}

/** Meta description da página de bairro: a mesma no HTML do servidor e no navegador. */
export function bairroDescription(count: number, label: string, faixa: string | null): string {
  return `${count} apartamentos reformados pela Bewild em ${label}, São Paulo${
    faixa ? ` (${faixa})` : ""
  }: fotos reais de cada obra e orçamento sem custo para o seu imóvel no bairro.`;
}
