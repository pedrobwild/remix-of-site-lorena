/**
 * Conjuntos de gráficos reutilizáveis dos artigos. Cada conjunto vira a página
 * /graficos/<slug> (noindex, follow, fora do sitemap); o artigo com o mesmo slug ganha um link para ela.
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
      { id: "resumo-numeros", file: "01-resumo-numeros-nov26", title: "Reformar apartamento para vender ou alugar em SP: os números" },
      { id: "reforma-percentual-do-valor", file: "02-reforma-percentual-do-valor-nov26", title: "Quanto a reforma completa pesa no preço do apartamento, por bairro" },
      { id: "meses-de-aluguel", file: "03-meses-de-aluguel-nov26", title: "Quantos meses de aluguel bruto cobrem a reforma completa" },
      { id: "indices-12-meses", file: "04-indices-12-meses", title: "Em 12 meses: preço do imóvel, aluguel, custo de obra e juros" },
      { id: "ir-ganho-de-capital", file: "05-ir-ganho-de-capital", title: "Imposto sobre ganho de capital: a reforma comprovada muda a conta" },
      { id: "valor-por-metragem", file: "06-valor-por-metragem-nov26", title: "Valor do orçamento de reforma completa por faixa de metragem" },
    ],
  },
  {
    slug: "quem-reforma-studio-sao-paulo-perfil",
    title: "Quem reforma studio em São Paulo: os gráficos do estudo",
    description:
      "Os nove gráficos e infográficos do Perfil Bewild de Quem Reforma Studio, em versão larga e para celular, prontos para baixar e reutilizar com crédito à Bewild.",
    // Títulos e arquivos iguais aos de src/content/perfilGraficos.ts (conferido em perfilGraficos.test.ts).
    charts: [
      { id: "resumo", file: "01-perfil-em-seis-numeros", title: "Quem reforma studio em São Paulo, em seis números" },
      { id: "finalidade", file: "02-finalidade-do-imovel", title: "Finalidade do imóvel de quem recebe orçamento de reforma de studio" },
      { id: "origem", file: "03-origem-do-telefone", title: "Origem do telefone de quem recebe orçamento de reforma de studio em São Paulo" },
      { id: "chaves", file: "04-momento-das-chaves", title: "Momento das chaves de quem pede orçamento de reforma de studio" },
      { id: "temas", file: "05-temas-das-conversas", title: "Temas das conversas antes do contrato, por finalidade do imóvel" },
      { id: "regioes", file: "06-regioes-de-sao-paulo", title: "Orçamentos de reforma por região de São Paulo e parcela para aluguel por temporada" },
      { id: "bairros", file: "07-bairros-com-mais-orcamentos", title: "Bairros de São Paulo com 15 orçamentos de reforma ou mais" },
      { id: "perfis", file: "08-seis-perfis", title: "Seis perfis de quem recebe orçamento de reforma de studio em São Paulo" },
      { id: "metodo", file: "09-como-o-estudo-foi-montado", title: "Como o Perfil Bewild foi montado: de 793 negócios a 584 orçamentos" },
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
