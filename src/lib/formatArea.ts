const AREA_FORMAT = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

/** "28,21 m²" / "42 m²" (pt-BR, até 2 casas, sem zeros à direita). `null` para área ausente/inválida. */
export function formatAreaM2(area: number | string | null | undefined): string | null {
  const n = typeof area === "string" ? Number(area) : area;
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return null;
  return `${AREA_FORMAT.format(n)} m²`;
}
