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
/** Investidor (Pedro, 14/10/2026): quem entra em "Lead qualificado investidor" e no envio direto pelo servidor. */
export const GOOGLE_ADS_QUALIFIED_OBJETIVOS = ["Short stay", "Locação tradicional", "Uso misto"] as const;

export function isGoogleAdsQualifiedObjetivo(objetivo: string | null | undefined): boolean {
  return (GOOGLE_ADS_QUALIFIED_OBJETIVOS as readonly string[]).includes(objetivo ?? "");
}

/**
 * A conversão de lead do navegador conta todo objetivo com peso aprovado
 * (Pedro, 25/11/2026): investidor a 5000 e moradia/"Ainda avaliando" a 1000.
 * De 26/10 a 25/11/2026 só o investidor contava e a conta ficou semanas sem
 * conversão. Objetivo ausente ou fora da lista segue sem conversão.
 */
export function isGoogleAdsLeadConversionObjetivo(objetivo: string | null | undefined): boolean {
  return "value" in googleAdsLeadValue(objetivo);
}
