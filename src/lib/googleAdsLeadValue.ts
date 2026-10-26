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
/** Tráfego pago do Google é só para investidor (Pedro, 26/10/2026): só estes objetivos viram conversão de lead. */
export const GOOGLE_ADS_QUALIFIED_OBJETIVOS = ["Short stay", "Locação tradicional", "Uso misto"] as const;

export function isGoogleAdsQualifiedObjetivo(objetivo: string | null | undefined): boolean {
  return (GOOGLE_ADS_QUALIFIED_OBJETIVOS as readonly string[]).includes(objetivo ?? "");
}
