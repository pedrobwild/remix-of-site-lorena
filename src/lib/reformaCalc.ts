/**
 * Cálculos da calculadora do artigo "Reformar apartamento para vender ou alugar
 * em SP". Só usa números já publicados nos gráficos do artigo (base Bewild,
 * 204 contratos de reforma completa, lida em 06/10/2026). Função pura, sem React.
 */

/** Custo mediano por m² da reforma completa e a metade central dos contratos (R$/m²). */
export const CUSTO_M2 = { baixo: 2490, mediano: 2758, alto: 3247 } as const;

export type BairroId = "pinheiros" | "itaim-bibi" | "moema" | "media-sp";

/**
 * Meses de aluguel bruto que cobrem a reforma (gráfico 3): custo mediano por m²
 * ÷ aluguel anunciado por m² ao mês. O aluguel por m² sai dessa mesma conta
 * invertida (custo mediano ÷ meses), então a mediana reproduz o gráfico.
 */
export const BAIRROS: { id: BairroId; nome: string; mesesGrafico: number }[] = [
  { id: "pinheiros", nome: "Pinheiros", mesesGrafico: 28 },
  { id: "itaim-bibi", nome: "Itaim Bibi", mesesGrafico: 29 },
  { id: "moema", nome: "Moema", mesesGrafico: 33 },
  { id: "media-sp", nome: "Média de São Paulo", mesesGrafico: 42 },
];

export const LIMITES = {
  areaMin: 10,
  areaMax: 300,
  valorMax: 100_000_000,
} as const;

export const ALIQUOTA_CORRETAGEM = 0.06;

/** Alíquotas do ganho de capital por faixa de ganho (Lei 13.259/2016). */
const FAIXAS_IR: { ate: number; aliquota: number }[] = [
  { ate: 5_000_000, aliquota: 0.15 },
  { ate: 10_000_000, aliquota: 0.175 },
  { ate: 30_000_000, aliquota: 0.2 },
  { ate: Infinity, aliquota: 0.225 },
];

export function impostoGanhoCapital(ganho: number): number {
  if (!(ganho > 0)) return 0;
  let restante = ganho;
  let anterior = 0;
  let imposto = 0;
  for (const f of FAIXAS_IR) {
    const parcela = Math.min(restante, f.ate - anterior);
    imposto += parcela * f.aliquota;
    restante -= parcela;
    anterior = f.ate;
    if (restante <= 0) break;
  }
  return imposto;
}

export type CalcInput = {
  bairro: BairroId;
  areaM2: number;
  precoCompra: number;
  precoVenda: number;
  /** Valor comprovado da reforma; vazio = usa a estimativa mediana. */
  reformaComprovada?: number | null;
};

export type CalcResult = {
  custo: { baixo: number; mediano: number; alto: number };
  aluguelMensal: number;
  meses: { baixo: number; mediano: number; alto: number };
  ir: {
    reformaUsada: number;
    corretagem: number;
    semReforma: number;
    comReforma: number;
    economia: number;
  };
};

export function calcular(input: CalcInput): CalcResult {
  const bairro = BAIRROS.find((b) => b.id === input.bairro) ?? BAIRROS[BAIRROS.length - 1];
  const custo = {
    baixo: CUSTO_M2.baixo * input.areaM2,
    mediano: CUSTO_M2.mediano * input.areaM2,
    alto: CUSTO_M2.alto * input.areaM2,
  };
  const aluguelM2 = CUSTO_M2.mediano / bairro.mesesGrafico;
  const aluguelMensal = aluguelM2 * input.areaM2;

  const corretagem = input.precoVenda * ALIQUOTA_CORRETAGEM;
  const liquidoVenda = input.precoVenda - corretagem;
  const reformaUsada =
    input.reformaComprovada != null && input.reformaComprovada > 0 ? input.reformaComprovada : custo.mediano;
  const semReforma = impostoGanhoCapital(liquidoVenda - input.precoCompra);
  const comReforma = impostoGanhoCapital(liquidoVenda - input.precoCompra - reformaUsada);

  return {
    custo,
    aluguelMensal,
    meses: {
      baixo: custo.baixo / aluguelMensal,
      mediano: custo.mediano / aluguelMensal,
      alto: custo.alto / aluguelMensal,
    },
    ir: { reformaUsada, corretagem, semReforma, comReforma, economia: semReforma - comReforma },
  };
}

/** Aceita "1.234,56", "1234,56" e "1234.56"; devolve null se não for número. */
export function parseNumeroBR(texto: string): number | null {
  const t = texto.trim().replace(/[R$\s]/g, "");
  if (!t) return null;
  const normal = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : /^\d{1,3}(\.\d{3})+$/.test(t) ? t.replace(/\./g, "") : t;
  if (!/^\d+(\.\d+)?$/.test(normal)) return null;
  const n = Number(normal);
  return Number.isFinite(n) ? n : null;
}
