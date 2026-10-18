/** Pesos de lance aprovados; não são receita nem valor de contrato. */
export function googleAdsLeadValue(objetivo: string | null | undefined): Record<string, string | number> {
  if (objetivo === "Short stay" || objetivo === "Locação tradicional" || objetivo === "Uso misto") {
    return { value: 5000, currency: "BRL" };
  }
  if (objetivo === "Moradia" || objetivo === "Ainda avaliando") {
    return { value: 1000, currency: "BRL" };
  }
  return {};
}