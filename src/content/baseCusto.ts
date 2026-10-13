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
