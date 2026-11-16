/**
 * Estudo de 188 contratos fechados (planilha de out/2026) — HISTÓRICO.
 *
 * Foi a base do Índice Bewild de custo de reforma na edição de outubro de 2026
 * e do artigo "Quanto custa reformar um apartamento ou studio de até 50 m²"
 * (publicado em 01/10/2026). Em 16/11/2026 o Pedro definiu que a base oficial
 * passa a ser a dos orçamentos do Bwild Engine (src/content/baseCusto.ts e
 * src/content/indiceCusto.ts), por ter amostra maior, e pediu para manter este
 * estudo guardado. Nenhuma página publica estes números como "o custo" da
 * reforma; eles servem para citar o estudo de contratos e comparar edições.
 *
 * Valor: o do contrato na assinatura, sem aditivos. Não alterar os números.
 */
import { CONTRATOS_ANALISADOS } from "@/content/provas";

export const ESTUDO_CONTRATOS_2026 = {
  edicao: "outubro de 2026",
  atualizadoEm: "2026-10-12",
  contratos: CONTRATOS_ANALISADOS,
  m2P25: 2_457,
  m2Mediano: 2_744,
  m2P75: 3_125,
  orcamentoMediano: 71_850,
  orcamentoMedio: 80_054,
  areaMediana: 27.5,
  /** Nenhum contrato do estudo ficou abaixo deste valor (R$). */
  orcamentoMinimo: 55_000,
  registrosIniciais: 205,
  exclusoes: [
    { n: 9, motivo: "sem dados de contrato localizados" },
    { n: 5, motivo: "primeiros contratos, fora de SP ou com endereço não confirmado" },
    { n: 2, motivo: "um contrato cobrindo duas unidades" },
    { n: 1, motivo: "valor implausível para a metragem" },
  ],
  faixasMetragem: [
    { faixa: "Até 20 m²", contratos: 13, orcamentoMediano: 71_432, metadeDoMeioMil: [67, 76], m2Mediano: 4_077 },
    { faixa: "20 a 24 m²", contratos: 29, orcamentoMediano: 68_000, metadeDoMeioMil: [64, 77], m2Mediano: 2_980 },
    { faixa: "24 a 28 m²", contratos: 70, orcamentoMediano: 71_432, metadeDoMeioMil: [65, 73], m2Mediano: 2_645 },
    { faixa: "28 a 32 m²", contratos: 48, orcamentoMediano: 75_000, metadeDoMeioMil: [67, 84], m2Mediano: 2_524 },
    { faixa: "32 a 40 m²", contratos: 17, orcamentoMediano: 106_559, metadeDoMeioMil: [85, 115], m2Mediano: 2_826 },
    { faixa: "Acima de 40 m²", contratos: 11, orcamentoMediano: 141_769, metadeDoMeioMil: [108, 151], m2Mediano: 2_740 },
  ],
  faixasValor: [
    { faixa: "Até R$ 65 mil", pct: 22 },
    { faixa: "R$ 65 mil a R$ 75 mil", pct: 39 },
    { faixa: "R$ 75 mil a R$ 90 mil", pct: 17 },
    { faixa: "R$ 90 mil a R$ 120 mil", pct: 16 },
    { faixa: "Acima de R$ 120 mil", pct: 6 },
  ],
  /** Regressão robusta de Theil-Sen em 148 contratos de 21 a 35 m². */
  regraDeBolso: { fixo: 38_400, porM2: 1_217, contratos: 148, erroMediano: 8, erroTresQuartos: 15 },
  /** Mediana por m² nos três grupos de contratos ordenados pela data de assinatura. */
  estabilidadeM2: [2_653, 2_848],
  /** Kruskal-Wallis entre regiões: sem diferença significativa naquele estudo. */
  regiaoPValor: 0.67,
  csv: "/dados/indice-custo-reforma-bewild-2026-10.csv",
} as const;
