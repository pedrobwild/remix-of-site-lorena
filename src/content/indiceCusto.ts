/**
 * Índice Bewild de custo de reforma — dados e JSON-LD de
 * /indice-de-custo-de-reforma (módulo sem componentes nem CSS, para o
 * `head()` da rota não puxar a página inteira para o grafo de todas as rotas).
 *
 * ORIGEM ÚNICA (edição de novembro de 2026, decisão do Pedro em 16/11/2026):
 * orçamentos de reforma completa do Bwild Engine. Entra a última versão
 * publicada de cada negócio que teve orçamento publicado, com a metragem do
 * imóvel, valor a partir de R$ 50 mil e até 45 m². Um registro por negócio.
 * As estatísticas foram calculadas no banco do Engine em 16/11/2026 e estão
 * documentadas em docs/internal/indice-bewild-orcamentos-engine-2026-11.md.
 * Nenhum número novo nasce aqui: se a amostra for refeita, atualize este
 * arquivo, baseCusto.ts, o CSV e a data em INDICE_ATUALIZADO_EM juntos.
 *
 * A edição de outubro de 2026 (188 contratos fechados) fica guardada em
 * src/content/estudoContratos2026.ts. O artigo pilar (PILAR_CUSTO) ainda
 * descreve aquele estudo.
 */
import { BASE_CUSTO, brl as brlBase, CUSTO_M2_MEDIANO, ORCAMENTO_MEDIANO } from "@/content/baseCusto";
import { ESTUDO_CONTRATOS_2026 } from "@/content/estudoContratos2026";
import { PILAR_CUSTO } from "@/content/pages/orcamento";
import { faqJsonLd } from "@/lib/useSeo";

export const INDICE_CANONICAL = "/indice-de-custo-de-reforma";
export const INDICE_EDICAO = "novembro de 2026";
/** Data (ISO) da última atualização dos números. */
export const INDICE_ATUALIZADO_EM = "2026-11-16";
export const INDICE_PUBLICADO_EM = "2026-10-01";
/** Mesmas datas com fuso de São Paulo, para o JSON-LD (o Google pede fuso). */
const comFuso = (d: string) => `${d}T00:00:00-03:00`;
export const INDICE_CSV_PATH = "/dados/indice-custo-reforma-bewild-2026-11.csv";
export const INDICE_LICENCA_URL = "https://creativecommons.org/licenses/by/4.0/";
export const INDICE_LICENCA_NOME = "CC BY 4.0";
/**
 * Período dos orçamentos (temporalCoverage, ISO 8601): criados de 18/03/2026
 * a 15/11/2026. null omite o campo do Dataset.
 */
export const INDICE_PERIODO: string | null = "2026-03/2026-11";

/** Negócios do Bwild Engine com orçamento publicado, antes das exclusões. */
export const REGISTROS_INICIAIS = 846;

export const EXCLUSOES: { n: number; motivo: string }[] = [
  { n: 193, motivo: "sem a metragem do imóvel" },
  { n: 37, motivo: "com valor abaixo de R$ 50 mil" },
  { n: 21, motivo: "em imóveis acima de 45 m²" },
  { n: 5, motivo: "fora de São Paulo" },
  { n: 2, motivo: "sem valor" },
  { n: 2, motivo: "com metragem implausível para o valor" },
  { n: 1, motivo: "de teste" },
];

/** Números de cabeçalho (R$ e m²). */
export const INDICE = BASE_CUSTO;

/** Orçamento por faixa de metragem. */
export type FaixaMetragem = {
  faixa: string;
  orcamentos: number;
  orcamentoMediano: number;
  /** Metade do meio dos orçamentos, em milhares de R$. */
  metadeDoMeioMil: [number, number];
  m2Mediano: number;
};

export const FAIXAS_METRAGEM: FaixaMetragem[] = [
  { faixa: "Até 20 m²", orcamentos: 42, orcamentoMediano: 66_969, metadeDoMeioMil: [60, 75], m2Mediano: 3_825 },
  { faixa: "20 a 24 m²", orcamentos: 64, orcamentoMediano: 69_160, metadeDoMeioMil: [63, 76], m2Mediano: 3_056 },
  { faixa: "24 a 28 m²", orcamentos: 241, orcamentoMediano: 70_537, metadeDoMeioMil: [64, 78], m2Mediano: 2_802 },
  { faixa: "28 a 32 m²", orcamentos: 107, orcamentoMediano: 75_656, metadeDoMeioMil: [67, 91], m2Mediano: 2_594 },
  { faixa: "32 a 40 m²", orcamentos: 109, orcamentoMediano: 95_459, metadeDoMeioMil: [80, 111], m2Mediano: 2_550 },
  { faixa: "40 a 45 m²", orcamentos: 22, orcamentoMediano: 109_938, metadeDoMeioMil: [95, 130], m2Mediano: 2_649 },
];

/** Distribuição do orçamento total (percentual dos orçamentos). */
export const FAIXAS_VALOR: { faixa: string; pct: number }[] = [
  { faixa: "Até R$ 65 mil", pct: 23.4 },
  { faixa: "R$ 65 mil a R$ 75 mil", pct: 29.7 },
  { faixa: "R$ 75 mil a R$ 90 mil", pct: 23.4 },
  { faixa: "R$ 90 mil a R$ 120 mil", pct: 17.1 },
  { faixa: "Acima de R$ 120 mil", pct: 6.3 },
];

/** Regra de bolso (regressão robusta Theil-Sen, 446 orçamentos de 21 a 35 m²). */
export const REGRA_DE_BOLSO = {
  fixo: 32_950,
  porM2: 1_514,
  orcamentos: 446,
  faixaAreas: "21 a 35 m²",
  /** Metade dos casos fica dentro desta margem. */
  erroMediano: 12,
  /** Cerca de três em quatro casos ficam dentro desta margem. */
  erroTresQuartos: 20,
} as const;

/** Menor e maior mediana por m² nos três grupos de orçamentos ordenados pela data de criação (R$ 2.688, 3.002 e 2.851). */
export const ESTABILIDADE_M2: [number, number] = [2_688, 3_002];

/** INCC-M acumulado em 12 meses até agosto de 2026 (FGV). */
export const INCC_12M = 6.56;

/**
 * Custo por região de São Paulo. Bairros agrupados em 16/11/2026 a partir do
 * campo "bairro" do negócio; a Zona Leste (7 orçamentos) e 111 orçamentos sem
 * bairro reconhecido ficaram fora desta tabela.
 */
export type RegiaoCusto = { regiao: string; orcamentos: number; m2Mediano: number; orcamentoMediano: number; areaMediana: number };
export const REGIOES_CUSTO: RegiaoCusto[] = [
  { regiao: "Centro", orcamentos: 107, m2Mediano: 3_038, orcamentoMediano: 73_939, areaMediana: 25 },
  { regiao: "Zona Oeste", orcamentos: 128, m2Mediano: 2_857, orcamentoMediano: 73_879, areaMediana: 26 },
  { regiao: "Zona Sul", orcamentos: 239, m2Mediano: 2_762, orcamentoMediano: 73_000, areaMediana: 26 },
];
/** Diferença por m² entre as três regiões (teste de Kruskal-Wallis, H = 12,7, 2 graus de liberdade). */
export const REGIAO_P_VALOR = 0.002;

/** Bairros com 15 orçamentos ou mais, do maior para o menor custo mediano por m². */
export type BairroCusto = { bairro: string; orcamentos: number; m2Mediano: number; orcamentoMediano: number };
export const BAIRROS_CUSTO: BairroCusto[] = [
  { bairro: "Consolação", orcamentos: 38, m2Mediano: 3_117, orcamentoMediano: 95_865 },
  { bairro: "Bela Vista", orcamentos: 39, m2Mediano: 3_019, orcamentoMediano: 73_661 },
  { bairro: "Pinheiros", orcamentos: 45, m2Mediano: 2_971, orcamentoMediano: 75_004 },
  { bairro: "Vila Mariana", orcamentos: 27, m2Mediano: 2_914, orcamentoMediano: 72_054 },
  { bairro: "Vila Clementino", orcamentos: 19, m2Mediano: 2_914, orcamentoMediano: 75_763 },
  { bairro: "Moema", orcamentos: 33, m2Mediano: 2_863, orcamentoMediano: 76_726 },
  { bairro: "Perdizes", orcamentos: 21, m2Mediano: 2_844, orcamentoMediano: 74_178 },
  { bairro: "Vila Olímpia", orcamentos: 27, m2Mediano: 2_795, orcamentoMediano: 69_886 },
  { bairro: "Brooklin", orcamentos: 26, m2Mediano: 2_715, orcamentoMediano: 67_615 },
  { bairro: "Pompeia", orcamentos: 15, m2Mediano: 2_643, orcamentoMediano: 75_127 },
  { bairro: "Butantã", orcamentos: 20, m2Mediano: 2_638, orcamentoMediano: 70_327 },
  { bairro: "Vila Nova Conceição", orcamentos: 26, m2Mediano: 2_556, orcamentoMediano: 68_909 },
];

/** Negócios da amostra por situação em 16/11/2026 (mediana por m² e do orçamento). */
export const DESFECHO: { situacao: string; orcamentos: number; m2Mediano: number; orcamentoMediano: number }[] = [
  { situacao: "Contrato fechado", orcamentos: 56, m2Mediano: 2_581, orcamentoMediano: 69_000 },
  { situacao: "Perdido ou arquivado", orcamentos: 170, m2Mediano: 2_732, orcamentoMediano: 70_967 },
  { situacao: "Em aberto", orcamentos: 359, m2Mediano: 2_909, orcamentoMediano: 76_471 },
];

/** Edição anterior (188 contratos fechados), para a nota de comparação da página. */
export const EDICAO_ANTERIOR = ESTUDO_CONTRATOS_2026;

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
  { item: "Projeto e RRT", pct: 3.4 },
  { item: "Enxoval", pct: 3.1 },
];

export const ESCOPO_INCLUIDO =
  "projeto e responsabilidade técnica (RRT), obra, marcenaria sob medida, mobiliário, eletrodomésticos e entrega (limpeza fina, vistoria e fotos); em imóveis de short stay, também o enxoval";

export const LIMITES =
  "A base é formada por imóveis compactos, quase todos novos, de até 45 m². São valores orçados: a maior parte dos negócios não virou contrato, e os que fecharam tiveram mediana mais baixa. Os números não valem para imóveis usados, áreas acima de 45 m² ou unidades com mais de um banheiro.";

const brl = (v: number) => `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;

// 25/10/2026: posição 6,6 com 69 impressões e 0 cliques. O número entra no
// título (quem busca "custo de reforma por m²" quer o valor), sem mudar a base.
export const INDICE_TITLE = `Custo de reforma por m² em São Paulo: ${brl(INDICE.m2Mediano)} (nov/2026)`;
export const INDICE_DESCRIPTION =
  `Custo de reforma por m² em São Paulo: mediana de ${brl(INDICE.m2Mediano)}/m² e orçamento mediano de ${brl(INDICE.orcamentoMediano)} em ${INDICE.orcamentos} orçamentos. Tabela por metragem, por bairro e CSV.`;

/** Resumo citável (é o primeiro parágrafo da página e a descrição do Dataset). */
export const RESUMO =
  `Na análise de ${INDICE.orcamentos} orçamentos de reforma completa (turnkey) de studios e apartamentos compactos em São Paulo, ` +
  `o orçamento mediano foi de ${brl(INDICE.orcamentoMediano)} para ${INDICE.areaMediana.toLocaleString("pt-BR")} m². ` +
  `A mediana por metro quadrado foi de ${brl(INDICE.m2Mediano)}, e metade dos orçamentos ficou entre ${brl(INDICE.m2P25)} e ${brl(INDICE.m2P75)} por m².`;

export const COMO_CITAR =
  `Bewild. Índice Bewild de custo de reforma, ${INDICE_EDICAO}: análise de ${INDICE.orcamentos} orçamentos de reforma completa em São Paulo. ` +
  `Disponível em: https://bewild.com.br${INDICE_CANONICAL}.`;

export const INDICE_FAQ: { q: string; a: string }[] = [
  {
    q: "Quanto custa o m² de reforma de um studio em São Paulo?",
    a: `No Índice Bewild de ${INDICE_EDICAO}, a reforma completa teve mediana de ${brl(INDICE.m2Mediano)} por m², e metade dos ${INDICE.orcamentos} orçamentos ficou entre ${brl(INDICE.m2P25)} e ${brl(INDICE.m2P75)} por m². Studios menores custam mais por m², porque cozinha, banheiro e marcenaria pesam igual em pouca área.`,
  },
  {
    q: "O que entra no valor do índice?",
    a: `O valor total do orçamento apresentado ao cliente, na última versão publicada de cada negócio. Ele inclui ${ESCOPO_INCLUIDO}.`,
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
    description: `${RESUMO} Inclui o orçamento por faixa de metragem, a distribuição dos valores e a composição de uma proposta real. Base: orçamentos de reforma completa da Bewild, na última versão publicada de cada negócio.`,
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
    measurementTechnique: "Mediana e quartis do valor orçado; regressão robusta de Theil-Sen; teste de Kruskal-Wallis entre regiões",
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
// Só números que já estão acima ou em baseCusto.ts. A edição de outubro usou
// outra base (contratos fechados), então não se publica "variação" entre edições.
// ---------------------------------------------------------------------------

/** Nome do índice nas peças de imprensa (frase de fonte e link dos gráficos). */
export const INDICE_NOME_IMPRENSA = "Índice Bewild de Custo de Reforma";

/** Endereço absoluto da página (link de atribuição dos gráficos incorporados). */
export const INDICE_URL_ABSOLUTA = `https://bewild.com.br${INDICE_CANONICAL}`;

/** Frase de fonte pronta para copiar. */
export const INDICE_FRASE_FONTE =
  `Fonte: ${INDICE_NOME_IMPRENSA}, edição ${INDICE_EDICAO}, base de ${INDICE.orcamentos} orçamentos, ` +
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
      `mediana do valor por m² de ${INDICE.orcamentos} orçamentos de reforma completa da Bewild, ` +
      `pelo valor da última versão publicada de cada negócio; metade ficou entre ${brlBase(INDICE.m2P25)} e ${brlBase(INDICE.m2P75)} por m².`,
  },
  {
    id: "orcamento",
    valor: ORCAMENTO_MEDIANO,
    rotulo: `é o orçamento mediano de uma reforma completa, numa área mediana de ${areaMedianaTexto}`,
    metodo:
      `mediana do valor total dos mesmos ${INDICE.orcamentos} orçamentos, com projeto, obra, marcenaria, mobiliário ` +
      `e eletrodomésticos no mesmo orçamento.`,
  },
  {
    id: "faixa-metragem",
    valor: `${brlBase(FAIXA_M2_MAIS_CARA.m2Mediano)} por m²`,
    rotulo:
      `é o custo mediano na faixa de ${faixaTexto(FAIXA_M2_MAIS_CARA.faixa)}, a mais cara por m²; ` +
      `a mais barata, de ${faixaTexto(FAIXA_M2_MAIS_BARATA.faixa)}, ficou em ${brlBase(FAIXA_M2_MAIS_BARATA.m2Mediano)} por m²`,
    metodo:
      `mediana do valor por m² dentro de cada faixa de área, com ${FAIXA_M2_MAIS_CARA.orcamentos} orçamentos ` +
      `na faixa de ${faixaTexto(FAIXA_M2_MAIS_CARA.faixa)} e ${FAIXA_M2_MAIS_BARATA.orcamentos} orçamentos na de ` +
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
const ITEM_NO_GRAFICO: Record<string, string> = { "Projeto e RRT": "Projeto e responsabilidade técnica (ART/RRT)" };
const pctTexto = (v: number) => `${String(v).replace(".", ",")}%`;

/**
 * Gráficos para incorporar: os da página são só React, então o código usa os
 * SVG estáticos: o da distribuição é desta edição (public/images/indice) e o
 * da proposta real é o do artigo pilar. Mostram os mesmos números de
 * FAIXAS_VALOR e COMPOSICAO (conferido em indiceImprensa.test.tsx).
 */
export const IMPRENSA_GRAFICOS: GraficoImprensa[] = [
  {
    id: "distribuicao",
    titulo: "Como os orçamentos se distribuem",
    src: "/images/indice/2026-11-faixas-de-valor.svg",
    largura: 720,
    altura: 616,
    alt:
      `Distribuição dos ${INDICE.orcamentos} orçamentos de reforma completa por faixa de valor total: ` +
      FAIXAS_VALOR.map((f) => `${faixaTexto(f.faixa)}, ${pctTexto(f.pct)}`).join("; "),
    base: `base de ${INDICE.orcamentos} orçamentos`,
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
