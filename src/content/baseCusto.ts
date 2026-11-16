/**
 * Base de custo da Bewild — os números de custo por m² da reforma completa
 * que o site publica. Fonte única para o Índice (/indice-de-custo-de-reforma),
 * a calculadora do artigo "Reformar apartamento para vender ou alugar" e o
 * /escopo. Módulo puro (sem React, sem Supabase) para poder ser importado por
 * funções de cálculo.
 *
 * Origem (desde 16/11/2026, decisão do Pedro): 585 orçamentos de reforma
 * completa do Bwild Engine — a última versão publicada de cada negócio com
 * orçamento publicado, criada de 18/03/2026 a 15/11/2026, com a metragem do
 * imóvel, valor a partir de R$ 50 mil e até 45 m². O valor é o total que o
 * cliente vê no orçamento; a maior parte dos negócios não virou contrato.
 * O estudo anterior, de 188 contratos fechados (planilha de out/2026), fica
 * guardado em src/content/estudoContratos2026.ts.
 */
import { ORCAMENTOS_ANALISADOS } from "@/content/provas";

export const BASE_CUSTO = {
  orcamentos: ORCAMENTOS_ANALISADOS,
  /** Custo por m² — 1º quartil, mediana e 3º quartil (R$). */
  m2P25: 2_499,
  m2Mediano: 2_831,
  m2P75: 3_283,
  orcamentoMediano: 74_132,
  orcamentoMedio: 81_585,
  areaMediana: 26,
  /** Corte da amostra: orçamentos abaixo deste valor ficaram fora (R$). */
  orcamentoMinimo: 50_000,
  /** Área máxima da amostra (m²). */
  areaMaxima: 45,
} as const;

/**
 * Origem: post quanto-custa-reformar-apartamento-studio-ate-50-m2
 * (estudo de 188 contratos); tabela vigente out/2026. Referências aproximadas,
 * distintas das medianas históricas de BASE_CUSTO; aprovadas em 26/10/2026.
 */
export const STUDIO_TABELA_VIGENTE = {
  edicao: "outubro de 2026",
  referencias: [
    { areaM2: 25, valorMil: 73 },
    { areaM2: 30, valorMil: 85 },
  ],
  prazo: { areaMaxM2: 30, diasUteisMax: 60, integracaoVaranda: false },
} as const;

/**
 * Reais sem centavos no formato do site ("R$ 2.744"). O separador de milhar é
 * montado aqui, sem `toLocaleString`, para o texto sair igual no servidor e no
 * navegador, qualquer que seja o ICU do runtime.
 */
export function brl(valor: number): string {
  return `R$ ${String(Math.round(valor)).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

/**
 * Custo da base nos textos do site. Desde 17/10/2026 a mediana por m² é o número
 * de custo dos anúncios, do /orcamento e das páginas de serviço (decisão do
 * Pedro). Nenhuma página escreve "R$ 2.831" ou "R$ 74.132" à mão: usa estas
 * constantes (guardado por src/__tests__/provasUnicas.test.ts).
 */
export const CUSTO_M2_MEDIANO = brl(BASE_CUSTO.m2Mediano);
export const ORCAMENTO_MEDIANO = brl(BASE_CUSTO.orcamentoMediano);

/** Referência municipal: não é uma mediana específica de cada bairro. */
export const REFERENCIA_CUSTO_BAIRROS =
  `Como referência para São Paulo, o Índice Bewild de custo de reforma, edição de novembro de 2026, analisa ${BASE_CUSTO.orcamentos} orçamentos de reforma completa de studios e apartamentos compactos. A mediana é ${CUSTO_M2_MEDIANO} por m² (${ORCAMENTO_MEDIANO} por reforma), com projeto, obra, marcenaria, mobiliário e eletrodomésticos. São valores dos orçamentos apresentados aos clientes, na última versão publicada; esta é a base da cidade, não uma mediana específica do bairro.`;

/**
 * Base de 2025: 58 obras completas dos contratos de fevereiro a outubro de 2025,
 * em imóveis de 21 a 35 m² (projeto, obra, marcenaria, mobília e eletros).
 * É a base histórica da resposta de custo do /faq. As páginas /reforma/<bairro>
 * usam agora somente BASE_CUSTO. Não misturar com a base de orçamentos
 * acima nem com o estudo de 188 contratos: são estudos diferentes, e cada
 * texto diz qual usa.
 */
export const BASE_2025 = {
  obras: 58,
  m2P25: 2_107,
  m2Mediano: 2_389,
  m2P75: 2_716,
  obraMediana: 63_763,
} as const;

/** "R$ 2.389" — mediana por m² da base de 2025 (cidade). */
export const CUSTO_M2_MEDIANO_2025 = brl(BASE_2025.m2Mediano);
