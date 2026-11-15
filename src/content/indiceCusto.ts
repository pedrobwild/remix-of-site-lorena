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
import { BASE_CUSTO, brl as brlBase, CUSTO_M2_MEDIANO, ORCAMENTO_MEDIANO } from "@/content/baseCusto";
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
export const INDICE_LICENCA_URL = "https://creativecommons.org/licenses/by/4.0/";
export const INDICE_LICENCA_NOME = "CC BY 4.0";
/**
 * Período dos contratos (temporalCoverage, ISO 8601). Decisão do dono em
 * 13/10/2026: contratos assinados até outubro de 2026, início em aberto ("..").
 * null omite o campo do Dataset.
 */
export const INDICE_PERIODO: string | null = "../2026-10";

/** Registros da planilha antes das exclusões (17 saíram da análise). */
export const REGISTROS_INICIAIS = 205;

export const EXCLUSOES: { n: number; motivo: string }[] = [
  { n: 9, motivo: "sem dados de contrato localizados" },
  { n: 5, motivo: "primeiros contratos, fora de SP ou com endereço não confirmado" },
  { n: 2, motivo: "um contrato cobrindo duas unidades" },
  { n: 1, motivo: "valor implausível para a metragem" },
];

/** Números de cabeçalho (R$ e m²). */
export const INDICE = BASE_CUSTO;

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

// 25/10/2026: posição 6,6 com 69 impressões e 0 cliques. O número entra no
// título (quem busca "custo de reforma por m²" quer o valor), sem mudar a base.
export const INDICE_TITLE = `Custo de reforma por m² em São Paulo: ${brl(INDICE.m2Mediano)} (out/2026)`;
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
    a: `Sim, citando a fonte: ${COMO_CITAR} A tabela agregada pode ser baixada em CSV na própria página. Os dados estão sob a licença ${INDICE_LICENCA_NOME}.`,
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
    license: INDICE_LICENCA_URL,
    ...(INDICE_PERIODO !== null ? { temporalCoverage: INDICE_PERIODO } : {}),
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

// ---------------------------------------------------------------------------
// Kit de imprensa (10/11/2026, auditoria de SEO rodada 4, PR-21): bloco
// "Para imprensa" da página, para jornalistas e blogs citarem e linkarem.
// Só números que já estão acima ou em baseCusto.ts; há uma edição só, então
// nada de "variação" entre edições.
// ---------------------------------------------------------------------------

/** Nome do índice nas peças de imprensa (frase de fonte e link dos gráficos). */
export const INDICE_NOME_IMPRENSA = "Índice Bewild de Custo de Reforma";

/** Endereço absoluto da página (link de atribuição dos gráficos incorporados). */
export const INDICE_URL_ABSOLUTA = `https://bewild.com.br${INDICE_CANONICAL}`;

/** Frase de fonte pronta para copiar. */
export const INDICE_FRASE_FONTE =
  `Fonte: ${INDICE_NOME_IMPRENSA}, edição ${INDICE_EDICAO}, base de ${INDICE.contratos} contratos, ` +
  `bewild.com.br${INDICE_CANONICAL}`;

export type NumeroImprensa = {
  id: string;
  /** O número, como deve ser citado. */
  valor: string;
  /** O que o número é, em seguida ao valor. */
  rotulo: string;
  /** Método em uma frase (sem o prefixo "Método:"). */
  metodo: string;
};

const FAIXA_M2_MAIS_CARA = FAIXAS_METRAGEM.reduce((a, b) => (b.m2Mediano > a.m2Mediano ? b : a));
const FAIXA_M2_MAIS_BARATA = FAIXAS_METRAGEM.reduce((a, b) => (b.m2Mediano < a.m2Mediano ? b : a));
const areaMedianaTexto = `${String(INDICE.areaMediana).replace(".", ",")} m²`;
/** "Até 20 m²" → "até 20 m²" no meio da frase; "R$ 65 mil…" e siglas ficam como estão. */
const faixaTexto = (faixa: string) =>
  /^\p{Lu}\p{Ll}/u.test(faixa) ? faixa.charAt(0).toLowerCase() + faixa.slice(1) : faixa;

/** Três números citáveis, cada um com o método em uma frase. */
export const IMPRENSA_NUMEROS: NumeroImprensa[] = [
  {
    id: "custo-m2",
    valor: `${CUSTO_M2_MEDIANO} por m²`,
    rotulo: "é o custo mediano da reforma completa de studios e apartamentos compactos em São Paulo",
    metodo:
      `mediana do valor por m² de ${INDICE.contratos} contratos de reforma completa da Bewild, ` +
      `pelo valor na assinatura e sem aditivos; metade ficou entre ${brlBase(INDICE.m2P25)} e ${brlBase(INDICE.m2P75)} por m².`,
  },
  {
    id: "orcamento",
    valor: ORCAMENTO_MEDIANO,
    rotulo: `é o orçamento mediano de uma reforma completa, numa área mediana de ${areaMedianaTexto}`,
    metodo:
      `mediana do valor total dos mesmos ${INDICE.contratos} contratos, com projeto, obra, marcenaria, mobiliário ` +
      `e eletrodomésticos no mesmo contrato.`,
  },
  {
    id: "faixa-metragem",
    valor: `${brlBase(FAIXA_M2_MAIS_CARA.m2Mediano)} por m²`,
    rotulo:
      `é o custo mediano na faixa de ${faixaTexto(FAIXA_M2_MAIS_CARA.faixa)}, a mais cara por m²; ` +
      `a mais barata, de ${faixaTexto(FAIXA_M2_MAIS_BARATA.faixa)}, ficou em ${brlBase(FAIXA_M2_MAIS_BARATA.m2Mediano)} por m²`,
    metodo:
      `mediana do valor por m² dentro de cada faixa de área, com ${FAIXA_M2_MAIS_CARA.contratos} contratos ` +
      `na faixa de ${faixaTexto(FAIXA_M2_MAIS_CARA.faixa)} e ${FAIXA_M2_MAIS_BARATA.contratos} contratos na de ` +
      `${faixaTexto(FAIXA_M2_MAIS_BARATA.faixa)}.`,
  },
];

export type GraficoImprensa = {
  id: string;
  /** Título do gráfico na página (o mesmo da seção que ele ilustra). */
  titulo: string;
  /** SVG estático já publicado em public/ (mesmos números desta página). */
  src: string;
  largura: number;
  altura: number;
  alt: string;
  /** De onde vêm os números do gráfico, na legenda do código de incorporação. */
  base: string;
};

const SVG_PILAR = "/images/blog/quanto-custa-reformar-apartamento-studio-ate-50-m2";
/** Rótulo do item como está no SVG da proposta ("Projeto 3D, executivo e ART/RRT"). */
const ITEM_NO_GRAFICO: Record<string, string> = { "Projeto e ART": "Projeto e responsabilidade técnica (ART/RRT)" };
const pctTexto = (v: number) => `${String(v).replace(".", ",")}%`;

/**
 * Gráficos para incorporar: os da página são só React, então o código usa os
 * SVG estáticos do artigo pilar (mesmo estudo), que mostram os mesmos números
 * de FAIXAS_VALOR e COMPOSICAO (conferido em indiceImprensa.test.tsx).
 */
export const IMPRENSA_GRAFICOS: GraficoImprensa[] = [
  {
    id: "distribuicao",
    titulo: "Como os orçamentos se distribuem",
    src: `${SVG_PILAR}/07-faixas-de-investimento.svg`,
    largura: 720,
    altura: 616,
    alt:
      `Distribuição dos ${INDICE.contratos} contratos de reforma completa por faixa de valor total: ` +
      FAIXAS_VALOR.map((f) => `${faixaTexto(f.faixa)}, ${pctTexto(f.pct)}`).join("; "),
    base: `base de ${INDICE.contratos} contratos`,
  },
  {
    id: "composicao",
    titulo: "Para onde vai o dinheiro",
    src: `${SVG_PILAR}/06-anatomia-orcamento-turnkey.svg`,
    largura: 720,
    altura: 864,
    alt:
      `Composição de uma proposta real de reforma completa de ${brlBase(PROPOSTA_REAL_VALOR)}, setembro de 2026: ` +
      COMPOSICAO.map((c) => `${faixaTexto(ITEM_NO_GRAFICO[c.item] ?? c.item)}, ${pctTexto(c.pct)}`).join("; "),
    base: "composição de uma proposta real de setembro de 2026",
  },
];

const escapeHtml = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** HTML para colar num site: a imagem do gráfico e a legenda com o link de atribuição. */
export function graficoEmbedHtml(g: GraficoImprensa): string {
  return [
    `<figure style="margin:0;max-width:${g.largura}px">`,
    `  <img src="https://bewild.com.br${g.src}" alt="${escapeHtml(g.alt)}" width="${g.largura}" height="${g.altura}" style="width:100%;height:auto" loading="lazy">`,
    `  <figcaption>Fonte: <a href="${INDICE_URL_ABSOLUTA}">${INDICE_NOME_IMPRENSA}</a>, edição ${INDICE_EDICAO}, ${escapeHtml(g.base)}. ` +
      `Licença <a href="${INDICE_LICENCA_URL}" rel="license">${INDICE_LICENCA_NOME}</a>.</figcaption>`,
    `</figure>`,
  ].join("\n");
}
