/**
 * Base de custo da Bewild — os números de custo por m² da reforma completa
 * que o site publica. Fonte única para o Índice (/indice-de-custo-de-reforma),
 * a calculadora do artigo "Reformar apartamento para vender ou alugar" e o
 * /escopo. Módulo puro (sem React, sem Supabase) para poder ser importado por
 * funções de cálculo.
 *
 * Origem: estudo de 188 contratos de reforma completa (planilha de out/2026),
 * publicado no artigo pilar /conteudos/quanto-custa-reformar-apartamento-studio-ate-50-m2.
 * Até 13/10/2026 a calculadora e o /escopo usavam uma leitura posterior da
 * planilha (204 contratos, R$ 2.490 / 2.758 / 3.247 por m²), que os artigos
 * citam só como checagem de estabilidade.
 */
import { CONTRATOS_ANALISADOS } from "@/content/provas";

export const BASE_CUSTO = {
  contratos: CONTRATOS_ANALISADOS,
  /** Custo por m² — 1º quartil, mediana e 3º quartil (R$). */
  m2P25: 2_457,
  m2Mediano: 2_744,
  m2P75: 3_125,
  orcamentoMediano: 71_850,
  orcamentoMedio: 80_054,
  areaMediana: 27.5,
  /** Nenhum contrato da base ficou abaixo deste valor (R$). */
  orcamentoMinimo: 55_000,
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
 * Pedro). Nenhuma página escreve "R$ 2.744" ou "R$ 71.850" à mão: usa estas
 * constantes (guardado por src/__tests__/provasUnicas.test.ts).
 */
export const CUSTO_M2_MEDIANO = brl(BASE_CUSTO.m2Mediano);
export const ORCAMENTO_MEDIANO = brl(BASE_CUSTO.orcamentoMediano);

/** Referência municipal: não é uma mediana específica de cada bairro. */
export const REFERENCIA_CUSTO_BAIRROS =
  `Como referência para São Paulo, o Índice Bewild de custo de reforma, edição de outubro de 2026, analisa ${BASE_CUSTO.contratos} contratos de reforma completa de studios e apartamentos compactos. A mediana é ${CUSTO_M2_MEDIANO} por m² (${ORCAMENTO_MEDIANO} por reforma), com projeto, obra, marcenaria, mobiliário e eletrodomésticos. São valores dos contratos na assinatura, sem aditivos posteriores; esta é a base da cidade, não uma mediana específica do bairro.`;

/**
 * Base de 2025: 58 obras completas dos contratos de fevereiro a outubro de 2025,
 * em imóveis de 21 a 35 m² (projeto, obra, marcenaria, mobília e eletros).
 * É a base histórica da resposta de custo do /faq. As páginas /reforma/<bairro>
 * usam agora somente BASE_CUSTO. Não misturar com a base de
 * 188 contratos acima: são estudos diferentes, e cada texto diz qual usa.
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
