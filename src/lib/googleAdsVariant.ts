export type TopoVariante = "padrao" | "studio" | "arquitetura" | "custo" | "investidor";

/** Uma única regra para a promessa do anúncio e os relatórios de cliques. */
export function topoVarianteDaBusca(search: string | Record<string, unknown>): TopoVariante {
  const first = (value: unknown): string => {
    const v = Array.isArray(value) ? value[0] : value;
    return typeof v === "string" || typeof v === "number" ? String(v) : "";
  };
  const params = typeof search === "string" ? new URLSearchParams(search) : null;
  const content = params ? params.get("utm_content") ?? "" : first(typeof search === "object" ? search.utm_content : null);
  const campaign = params ? params.get("utm_campaign") ?? "" : first(typeof search === "object" ? search.utm_campaign : null);
  if (content.endsWith("investidor") || content.startsWith("airbnb") || content.startsWith("aluguel") || campaign === "sea_investidor") return "investidor";
  if (content === "studio-ape-pequeno") return "studio";
  if (content === "arquitetura-reforma") return "arquitetura";
  if (content === "custo-orcamento") return "custo";
  return "padrao";
}