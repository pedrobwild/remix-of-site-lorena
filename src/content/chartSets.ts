/**
 * Conjuntos de gráficos reutilizáveis dos artigos. Cada conjunto vira a página
 * /graficos/<slug> (indexável, no sitemap) e o artigo com o mesmo slug ganha um link para ela.
 * Os SVGs ficam em public/images/blog/<slug>/ (versão larga e versão -m para celular).
 */
export type ChartItem = {
  id: string;
  /** Título exato do gráfico (o mesmo que está dentro do SVG). */
  title: string;
  /** Nome do arquivo sem extensão; a versão mobile termina em "-m". */
  file: string;
};

export type ChartSet = {
  slug: string;
  title: string;
  description: string;
  charts: ChartItem[];
};

export const CHART_SETS: ChartSet[] = [
  {
    slug: "reformar-apartamento-para-vender-ou-alugar-sp",
    title: "Reformar apartamento para vender ou alugar em SP: os gráficos",
    description:
      "Os seis gráficos do artigo sobre reformar apartamento para vender ou alugar em São Paulo, em versão larga e para celular, prontos para baixar e reutilizar.",
    charts: [
      { id: "resumo-numeros", file: "01-resumo-numeros", title: "Reformar apartamento para vender ou alugar em SP: os números" },
      { id: "reforma-percentual-do-valor", file: "02-reforma-percentual-do-valor", title: "Quanto a reforma completa pesa no preço do apartamento, por bairro" },
      { id: "meses-de-aluguel", file: "03-meses-de-aluguel", title: "Quantos meses de aluguel bruto cobrem a reforma completa" },
      { id: "indices-12-meses", file: "04-indices-12-meses", title: "Em 12 meses: preço do imóvel, aluguel, custo de obra e juros" },
      { id: "ir-ganho-de-capital", file: "05-ir-ganho-de-capital", title: "Imposto sobre ganho de capital: a reforma comprovada muda a conta" },
      { id: "valor-por-metragem", file: "06-valor-por-metragem", title: "Valor do contrato de reforma completa por faixa de metragem" },
    ],
  },
];

export function chartSetForSlug(slug: string): ChartSet | null {
  return CHART_SETS.find((s) => s.slug === slug) ?? null;
}

export function chartSrc(set: ChartSet, chart: ChartItem, variant: "desktop" | "mobile"): string {
  return `/images/blog/${set.slug}/${chart.file}${variant === "mobile" ? "-m" : ""}.svg`;
}

export function chartsPagePath(slug: string): string {
  return `/graficos/${slug}`;
}
