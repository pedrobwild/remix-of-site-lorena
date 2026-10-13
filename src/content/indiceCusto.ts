/**
 * Índice Bewild de custo de reforma — dados e JSON-LD de
 * /indice-de-custo-de-reforma (módulo sem componentes nem CSS, para o
 * `head()` da rota não puxar a página inteira para o grafo de todas as rotas).
 *
 * ORIGEM ÚNICA: estudo "Quanto custa reformar um apartamento ou studio de até
 * 50 m²" (PILAR_CUSTO), publicado em 01/10/2026 e atualizado em 12/10/2026,
 * com a planilha de contratos de out/2026. Os números abaixo são os MESMOS do
 * artigo — se o estudo for refeito, atualize os dois juntos (artigo e este
 * arquivo) e a data em INDICE_ATUALIZADO_EM. Nenhum número novo nasce aqui.
 * O total da base vem de CONTRATOS_ANALISADOS (src/content/provas.ts).
 */
import { CONTRATOS_ANALISADOS } from "@/content/provas";
import { PILAR_CUSTO } from "@/content/pages/orcamento";
import { faqJsonLd } from "@/lib/useSeo";

export const INDICE_CANONICAL = "/indice-de-custo-de-reforma";
export const INDICE_EDICAO = "outubro de 2026";
/** Data (ISO) da última atualização dos números — a mesma do artigo pilar. */
export const INDICE_ATUALIZADO_EM = "2026-10-12";
export const INDICE_PUBLICADO_EM = "2026-10-01";
/** Mesmas datas com fuso de São Paulo, para o JSON-LD (o Google pede fuso). */
const comFuso = (d: string) => `${d}T00:00:00-03:00`;
export const INDICE_CSV_PATH = "/dados/indice-custo-reforma-bewild-2026-10.csv";

/** Registros da planilha antes das exclusões (17 saíram da análise). */
export const REGISTROS_INICIAIS = 205;

export const EXCLUSOES: { n: number; motivo: string }[] = [
  { n: 9, motivo: "sem dados de contrato localizados" },
  { n: 5, motivo: "primeiros contratos, fora de SP ou com endereço não confirmado" },
  { n: 2, motivo: "um contrato cobrindo duas unidades" },
  { n: 1, motivo: "valor implausível para a metragem" },
];

/** Números de cabeçalho (R$ e m²). */
export const INDICE = {
  contratos: CONTRATOS_ANALISADOS,
  orcamentoMediano: 71_850,
  orcamentoMedio: 80_054,
  m2Mediano: 2_744,
  m2P25: 2_457,
  m2P75: 3_125,
  areaMediana: 27.5,
  /** Nenhum contrato da base ficou abaixo deste valor. */
  orcamentoMinimo: 55_000,
} as const;

/** Orçamento por faixa de metragem (tabela do artigo). */
export type FaixaMetragem = {
  faixa: string;
  contratos: number;
  orcamentoMediano: number;
  /** Metade do meio dos orçamentos, em milhares de R$. */
  metadeDoMeioMil: [number, number];
  m2Mediano: number;
};

export const FAIXAS_METRAGEM: FaixaMetragem[] = [
  { faixa: "Até 20 m²", contratos: 13, orcamentoMediano: 71_432, metadeDoMeioMil: [67, 76], m2Mediano: 4_077 },
  { faixa: "20 a 24 m²", contratos: 29, orcamentoMediano: 68_000, metadeDoMeioMil: [64, 77], m2Mediano: 2_980 },
  { faixa: "24 a 28 m²", contratos: 70, orcamentoMediano: 71_432, metadeDoMeioMil: [65, 73], m2Mediano: 2_645 },
  { faixa: "28 a 32 m²", contratos: 48, orcamentoMediano: 75_000, metadeDoMeioMil: [67, 84], m2Mediano: 2_524 },
  { faixa: "32 a 40 m²", contratos: 17, orcamentoMediano: 106_559, metadeDoMeioMil: [85, 115], m2Mediano: 2_826 },
  { faixa: "Acima de 40 m²", contratos: 11, orcamentoMediano: 141_769, metadeDoMeioMil: [108, 151], m2Mediano: 2_740 },
];

/** Distribuição do orçamento total (percentual dos contratos). */
export const FAIXAS_VALOR: { faixa: string; pct: number }[] = [
  { faixa: "Até R$ 65 mil", pct: 22 },
  { faixa: "R$ 65 mil a R$ 75 mil", pct: 39 },
  { faixa: "R$ 75 mil a R$ 90 mil", pct: 17 },
  { faixa: "R$ 90 mil a R$ 120 mil", pct: 16 },
  { faixa: "Acima de R$ 120 mil", pct: 6 },
];

/** Regra de bolso (regressão robusta Theil-Sen, 148 contratos de 21 a 35 m²). */
export const REGRA_DE_BOLSO = {
  fixo: 38_400,
  porM2: 1_217,
  contratos: 148,
  faixaAreas: "21 a 35 m²",
  /** Metade dos casos fica dentro desta margem. */
  erroMediano: 8,
  /** Cerca de três em quatro casos ficam dentro desta margem. */
  erroTresQuartos: 15,
} as const;

/** Mediana por m² nos três grupos de contratos ordenados pela data de assinatura. */
export const ESTABILIDADE_M2: [number, number] = [2_653, 2_848];

/** INCC-M acumulado em 12 meses até agosto de 2026 (FGV). */
export const INCC_12M = 6.56;

/** Diferença entre regiões de SP (teste de Kruskal-Wallis). */
export const REGIAO_P_VALOR = 0.67;

/** Composição de uma proposta real (R$ 87.692,80, 29/09/2026). */
export const PROPOSTA_REAL_VALOR = 87_692.8;
export const COMPOSICAO: { item: string; pct: number }[] = [
  { item: "Marcenaria sob medida", pct: 28 },
  { item: "Obra civil e acabamentos", pct: 27.2 },
  { item: "Gestão, impostos, logística e seguro", pct: 13.7 },
  { item: "Eletrodomésticos", pct: 7.4 },
  { item: "Vidraçaria", pct: 7 },
  { item: "Mobiliário", pct: 6.5 },
  { item: "Iluminação", pct: 3.6 },
  { item: "Projeto e ART", pct: 3.4 },
  { item: "Enxoval", pct: 3.1 },
];

export const ESCOPO_INCLUIDO =
  "projeto e responsabilidade técnica (ART/RRT), obra, marcenaria sob medida, mobiliário, eletrodomésticos e entrega (limpeza fina, vistoria e fotos); em imóveis de short stay, também o enxoval";

export const LIMITES =
  "A base é formada principalmente por imóveis compactos novos. Os números são menos confiáveis para imóveis usados, áreas acima de 45 m² ou unidades com mais de um banheiro.";

const brl = (v: number) => `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;

export const INDICE_TITLE = `Índice Bewild de custo de reforma por m² em São Paulo (out/2026)`;
export const INDICE_DESCRIPTION =
  `Custo de reforma por m² em São Paulo: mediana de ${brl(INDICE.m2Mediano)}/m² e orçamento mediano de ${brl(INDICE.orcamentoMediano)} em ${INDICE.contratos} contratos de reforma completa. Tabela por metragem e CSV.`;

/** Resumo citável (é o primeiro parágrafo da página e a descrição do Dataset). */
export const RESUMO =
  `Na análise de ${INDICE.contratos} contratos de reforma completa (turnkey) de studios e apartamentos compactos em São Paulo, ` +
  `o orçamento mediano foi de ${brl(INDICE.orcamentoMediano)} para ${INDICE.areaMediana.toLocaleString("pt-BR")} m². ` +
  `A mediana por metro quadrado foi de ${brl(INDICE.m2Mediano)}, e metade dos contratos ficou entre ${brl(INDICE.m2P25)} e ${brl(INDICE.m2P75)} por m².`;

export const COMO_CITAR =
  `Bewild. Índice Bewild de custo de reforma, ${INDICE_EDICAO}: análise de ${INDICE.contratos} contratos de reforma completa em São Paulo. ` +
  `Disponível em: https://bewild.com.br${INDICE_CANONICAL}.`;

export const INDICE_FAQ: { q: string; a: string }[] = [
  {
    q: "Quanto custa o m² de reforma de um studio em São Paulo?",
    a: `No Índice Bewild de ${INDICE_EDICAO}, a reforma completa teve mediana de ${brl(INDICE.m2Mediano)} por m², e metade dos ${INDICE.contratos} contratos ficou entre ${brl(INDICE.m2P25)} e ${brl(INDICE.m2P75)} por m². Studios menores custam mais por m², porque cozinha, banheiro e marcenaria pesam igual em pouca área.`,
  },
  {
    q: "O que entra no valor do índice?",
    a: `O valor do contrato na assinatura, sem aditivos posteriores. Ele inclui ${ESCOPO_INCLUIDO}.`,
  },
  {
    q: "Posso usar os números do índice em uma reportagem ou estudo?",
    a: `Sim, citando a fonte: ${COMO_CITAR} A tabela agregada pode ser baixada em CSV na própria página.`,
  },
];

const URL = `https://bewild.com.br${INDICE_CANONICAL}`;

export const INDICE_JSONLD: Array<Record<string, unknown>> = [
  {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${URL}#dataset`,
    name: `Índice Bewild de custo de reforma — ${INDICE_EDICAO}`,
    description: `${RESUMO} Inclui o orçamento por faixa de metragem, a distribuição dos valores e a composição de uma proposta real. Base: contratos de reforma completa da Bewild, valor na assinatura, sem aditivos.`,
    url: URL,
    keywords: [
      "custo de reforma por m²",
      "custo de reforma de studio",
      "reforma de apartamento São Paulo",
      "reforma turnkey",
      "índice de custo de reforma",
    ],
    inLanguage: "pt-BR",
    isAccessibleForFree: true,
    creator: { "@id": "https://bewild.com.br/#org" },
    publisher: { "@id": "https://bewild.com.br/#org" },
    datePublished: comFuso(INDICE_PUBLICADO_EM),
    dateModified: comFuso(INDICE_ATUALIZADO_EM),
    spatialCoverage: { "@type": "Place", name: "São Paulo, SP, Brasil" },
    measurementTechnique: "Mediana e quartis do valor de contrato; regressão robusta de Theil-Sen; teste de Kruskal-Wallis entre regiões",
    variableMeasured: [
      { "@type": "PropertyValue", name: "Orçamento mediano de reforma completa", value: INDICE.orcamentoMediano, unitText: "BRL" },
      { "@type": "PropertyValue", name: "Custo mediano de reforma por m²", value: INDICE.m2Mediano, unitText: "BRL/m²" },
      { "@type": "PropertyValue", name: "Área mediana", value: INDICE.areaMediana, unitText: "m²" },
    ],
    isBasedOn: `https://bewild.com.br${PILAR_CUSTO}`,
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "text/csv",
        contentUrl: `https://bewild.com.br${INDICE_CSV_PATH}`,
      },
    ],
  },
  faqJsonLd(INDICE_FAQ),
];
