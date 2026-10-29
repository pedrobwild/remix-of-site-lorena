/** Fonte: SVGs fornecidos por Pedro em 29/10/2026. Base histórica própria deste artigo;
 * não substitui BASE_CUSTO nem os valores vigentes das páginas de serviço.
 * Atualize os números aqui; os rótulos numéricos são calculados na renderização.
 */
export const CHAVES_SLUG = "reforma-de-apartamento-antes-ou-depois-das-chaves";
export const CHAVES_ASSET_PATH = `/images/blog/${CHAVES_SLUG}/`;
export const chavesCharts = {
  pedidos: {
    id: "01-momento-do-pedido", title: "Quase metade pede orçamento antes de receber as chaves",
    source: "Fonte: formulário de orçamento bewild.com.br, 8/9 a 29/10/2026.",
    period: "8/9 a 29/10/2026", missing: 31,
    rows: [{ label: "Ainda não recebi", count: 40 }, { label: "Já recebi", count: 29 }, { label: "Estou comprando", count: 15 }],
  },
  metragem: {
    id: "02-metragem-por-situacao", title: "Quem ainda está comprando pede reforma de apartamento maior",
    source: "Fonte: formulário de orçamento bewild.com.br, 8/9 a 29/10/2026 (2 pedidos sem m² válido excluídos).",
    rows: [
      { label: "Ainda não recebi", median: 34.5, q1: 28, q3: 43, count: 38, above50: 18 },
      { label: "Já recebi", median: 31, q1: 25, q3: 54, count: 29, above50: 28 },
      { label: "Estou comprando", median: 42, q1: 36, q3: 72, count: 15, above50: 40 },
    ],
  },
  objetivos: {
    id: "03-objetivo-por-situacao", title: "Morar é o objetivo em 3 de cada 4 pedidos antes das chaves",
    source: "Fonte: formulário de orçamento bewild.com.br, 8/9 a 29/10/2026. Percentuais arredondados.",
    categories: ["Morar", "Short stay", "Locação", "Uso misto", "Outros"],
    rows: [
      { label: "Ainda não recebi", count: 40, percentages: [75, 12, 8, 5, 0] },
      { label: "Já recebi", count: 29, percentages: [52, 21, 14, 10, 3] },
      { label: "Estou comprando", count: 15, percentages: [80, 0, 7, 13, 0] },
    ],
  },
  tempo: {
    id: "04-linha-do-tempo-antes-x-depois", title: "Contratar antes das chaves adianta a entrega em 6 a 8 semanas",
    source: "Fonte: contrato e processo da Bewild (out/2026); duração do projeto e do condomínio variam com o cliente e o prédio.",
    note: "Obra em dias úteis (60 até 30 m²; até 75 em plantas maiores), contada após condomínio, chaves e energia liberados.",
    stages: ["Preparação", "Projeto", "Condomínio", "Mobilização", "Obra"],
    rows: [
      { label: "Contrato antes das chaves", start: -9, durations: [1, 7, 3, 1, 14], gapAfterProject: 1, ready: 18, range: [14, 20] },
      { label: "Contrato depois das chaves", start: 0, durations: [1, 7, 3, 1, 14], gapAfterProject: 0, ready: 26, range: [20, 28] },
    ],
  },
  espera: {
    id: "05-custo-de-cada-mes-de-espera", title: "Cada mês parado custa mais em aluguel do que em reajuste de obra",
    source: "Fonte: contratos Bewild (198); FipeZap set/2026; QuintoAndar jul/2026; FGV INCC-M set/2026; IBGE IPCA set/2026.",
    area: 28, contract: 72204,
    rows: [
      { label: "Aluguel que não entra (28 m²)", min: 1842, max: 2552 },
      { label: "Reajuste da obra pelo INCC-M", min: 397, max: 397 },
      { label: "Reajuste pelo IPCA", min: 276, max: 276 },
    ],
  },
  orcamento: {
    id: "06-orcamento-por-metragem", title: "Quanto reservar: o contrato mediano por metragem",
    source: "Fonte: contratos Bewild (planilha 27/9/2026, 198 registros após exclusões).",
    fixed: 17055, perM2: 2245, omitted: 2,
    rows: [
      { label: "até 21 m²", median: 75000, count: 27, bandTop: 155, bandHeight: 17 },
      { label: "21–25 m²", median: 65000, count: 31, bandTop: 167, bandHeight: 13 },
      { label: "25–30 m²", median: 71432, count: 102, bandTop: 160, bandHeight: 16 },
      { label: "30–35 m²", median: 89234, count: 13, bandTop: 127, bandHeight: 36 },
      { label: "35–45 m²", median: 108731, count: 23, bandTop: 81, bandHeight: 47 },
    ],
    // Q1–Q3 só foram fornecidos graficamente: preservamos as coordenadas do SVG,
    // sem inventar quartis monetários. Para atualizar as faixas, forneça Q1/Q3 reais.
  },
};
export type ChavesChartKey = keyof typeof chavesCharts;
export function chavesChartKeyFromUrl(url: string): ChavesChartKey | undefined {
  try {
    const path = new URL(url, "https://bewild.com.br").pathname;
    return (Object.keys(chavesCharts) as ChavesChartKey[]).find((key) =>
      path === `${CHAVES_ASSET_PATH}${chavesCharts[key].id}.svg` || path === `${CHAVES_ASSET_PATH}${chavesCharts[key].id}-m.svg`,
    );
  } catch { return undefined; }
}