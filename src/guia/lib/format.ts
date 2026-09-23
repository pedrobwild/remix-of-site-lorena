/**
 * Formatação numérica e de datas do guia — sempre pt-BR
 * (19,2% e não 19.2%; R$ 9.225 e não R$ 9225).
 */

const inteiro = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

/** Inteiro com separador de milhar pt-BR: 9225 → "9.225". */
export function fmtInt(v: number): string {
  return inteiro.format(v);
}

/** Percentual pt-BR: 19.2 → "19,2%"; 75 → "75%". */
export function fmtPct(v: number, casas = 1): string {
  return `${v.toLocaleString("pt-BR", { maximumFractionDigits: casas })}%`;
}

/** Valor em reais sem centavos: 9225 → "R$ 9.225". */
export function fmtBRL(v: number): string {
  return `R$ ${fmtInt(v)}`;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-11-06" → { d: 6, m: 11, y: 2026 } (sem fuso: é uma data de calendário). */
function partes(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

/**
 * Intervalo de datas pt-BR compacto:
 *  - mesmo mês:  "06–08/11/2026"
 *  - mesmo ano:  "27/03 – 02/04/2026"
 *  - anos diferentes: "30/12/2026 – 02/01/2027"
 */
export function fmtIntervaloDatas(inicioISO: string, fimISO: string): string {
  const a = partes(inicioISO);
  const b = partes(fimISO);
  if (a.y === b.y && a.m === b.m) {
    return a.d === b.d
      ? `${pad(a.d)}/${pad(a.m)}/${a.y}`
      : `${pad(a.d)}–${pad(b.d)}/${pad(b.m)}/${b.y}`;
  }
  if (a.y === b.y) return `${pad(a.d)}/${pad(a.m)} – ${pad(b.d)}/${pad(b.m)}/${b.y}`;
  return `${pad(a.d)}/${pad(a.m)}/${a.y} – ${pad(b.d)}/${pad(b.m)}/${b.y}`;
}

/** Data local de hoje no formato ISO (AAAA-MM-DD), para comparar com datas de calendário. */
export function hojeISO(agora: Date = new Date()): string {
  return `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}`;
}
