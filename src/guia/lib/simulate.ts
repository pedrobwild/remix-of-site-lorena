/**
 * Matemática do Simulador de Receita (SimuladorSection) — função pura.
 *
 * Regras (todas visíveis para o usuário na tela e no texto exportado):
 *  1. Diária de referência: a diária informada pelo usuário; senão a média do
 *     bairro para a faixa de metragem do studio; senão (bairro sem recorte por
 *     metragem) a diária média do bairro.
 *  2. O objetivo ajusta ocupação e/ou diária (tabela OBJETIVOS). A ocupação
 *     considerada é exibida — nunca há ajuste escondido.
 *  3. A melhoria (+10/+20/+30%) é o aumento TOTAL sobre a diária; os níveis
 *     não se somam.
 *  4. Cenário base e cenário com melhoria usam a MESMA ocupação e o MESMO
 *     ajuste de objetivo: o ganho mensal é só o efeito da melhoria, e é ele
 *     que paga a reforma no payback.
 */
import { diariaMediaDe, type BairroMercado, type FaixaMetragem } from "@/guia/data/bairros";
import { fmtBRL, fmtInt } from "@/guia/lib/format";

export type ObjetivoSimulacao = "maximizar" | "estabilidade" | "premium";

export const OBJETIVOS: Readonly<
  Record<ObjetivoSimulacao, { label: string; ocupacaoPp: number; diariaPct: number }>
> = {
  maximizar: { label: "Maximizar receita", ocupacaoPp: 5, diariaPct: 0 },
  estabilidade: { label: "Estabilidade de ocupação", ocupacaoPp: 0, diariaPct: -10 },
  premium: { label: "Posicionamento premium", ocupacaoPp: -10, diariaPct: 20 },
};

export const OBJETIVO_PADRAO: ObjetivoSimulacao = "maximizar";

export function isObjetivo(v: unknown): v is ObjetivoSimulacao {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(OBJETIVOS, v);
}

/** Níveis de melhoria oferecidos na tela (% sobre a diária). */
export const NIVEIS_MELHORIA = [0, 10, 20, 30] as const;

export const METRAGEM_MIN = 15;
export const METRAGEM_MAX = 80;
export const METRAGEM_PADRAO = 30;
/** Limites da ocupação DEPOIS do ajuste do objetivo. */
export const OCUPACAO_AJUSTADA_MIN = 30;
export const OCUPACAO_AJUSTADA_MAX = 95;
const NOITES_POR_MES = 30;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const positivo = (v: number | null | undefined): v is number =>
  typeof v === "number" && Number.isFinite(v) && v > 0;

/** Faixa de metragem da tabela do guia em que o studio se encaixa. */
export function faixaDaMetragem(metragem: number): FaixaMetragem {
  if (metragem <= 25) return "20–25 m²";
  if (metragem <= 35) return "26–35 m²";
  return "36–50 m²";
}

export interface EntradaSimulacao {
  mercado: BairroMercado;
  /** Área do studio (m²). Fora de 15–80 é limitada; inválida vira 30. */
  metragem: number;
  /** Ocupação escolhida no controle (%), antes do ajuste do objetivo. */
  ocupacao: number;
  /** Diária praticada hoje (R$). Ignorada se vazia, zero ou inválida. */
  diariaInformada?: number | null;
  objetivo: ObjetivoSimulacao;
  /** Aumento total de diária pela melhoria (%). */
  aumentoDiaria: number;
  /** Orçamento da reforma (R$) para o payback. */
  orcamentoReforma?: number | null;
}

export type OrigemDiaria = "informada" | "metragem" | "media";

export interface ResultadoSimulacao {
  metragem: number;
  diariaReferencia: number;
  origemDiaria: OrigemDiaria;
  /** Faixa usada quando a origem é "metragem". */
  faixaMetragem: FaixaMetragem | null;
  ocupacaoEscolhida: number;
  ocupacaoConsiderada: number;
  diariaConsiderada: number;
  diariaComMelhoria: number;
  receitaMensalBase: number;
  receitaMensal: number;
  receitaAnual: number;
  /** Receita mensal a mais só por causa da melhoria (≥ 0). */
  ganhoMensal: number;
  paybackMeses: number | null;
}

export function simulate(e: EntradaSimulacao): ResultadoSimulacao {
  const metragem = clamp(Number.isFinite(e.metragem) ? e.metragem : METRAGEM_PADRAO, METRAGEM_MIN, METRAGEM_MAX);
  const faixa = faixaDaMetragem(metragem);

  let diariaReferencia: number;
  let origemDiaria: OrigemDiaria;
  if (positivo(e.diariaInformada)) {
    diariaReferencia = e.diariaInformada;
    origemDiaria = "informada";
  } else if (e.mercado.diariaPorMetragem) {
    diariaReferencia = e.mercado.diariaPorMetragem[faixa];
    origemDiaria = "metragem";
  } else {
    diariaReferencia = diariaMediaDe(e.mercado);
    origemDiaria = "media";
  }

  const ajuste = OBJETIVOS[isObjetivo(e.objetivo) ? e.objetivo : OBJETIVO_PADRAO];
  const ocupacaoEscolhida = clamp(Number.isFinite(e.ocupacao) ? e.ocupacao : 0, 0, 100);
  const ocupacaoConsiderada = clamp(
    ocupacaoEscolhida + ajuste.ocupacaoPp,
    OCUPACAO_AJUSTADA_MIN,
    OCUPACAO_AJUSTADA_MAX,
  );
  const aumento = Number.isFinite(e.aumentoDiaria) ? Math.max(0, e.aumentoDiaria) : 0;

  const diariaConsiderada = diariaReferencia * (1 + ajuste.diariaPct / 100);
  const diariaComMelhoria = diariaConsiderada * (1 + aumento / 100);
  const noites = NOITES_POR_MES * (ocupacaoConsiderada / 100);

  const receitaMensalBase = Math.round(diariaConsiderada * noites);
  const receitaMensal = Math.round(diariaComMelhoria * noites);
  const ganhoMensal = receitaMensal - receitaMensalBase;
  const paybackMeses =
    ganhoMensal > 0 && positivo(e.orcamentoReforma) ? Math.ceil(e.orcamentoReforma / ganhoMensal) : null;

  return {
    metragem,
    diariaReferencia: Math.round(diariaReferencia),
    origemDiaria,
    faixaMetragem: origemDiaria === "metragem" ? faixa : null,
    ocupacaoEscolhida,
    ocupacaoConsiderada,
    diariaConsiderada: Math.round(diariaConsiderada),
    diariaComMelhoria: Math.round(diariaComMelhoria),
    receitaMensalBase,
    receitaMensal,
    receitaAnual: receitaMensal * 12,
    ganhoMensal,
    paybackMeses,
  };
}

/** Explica de onde veio a diária de referência (tela e texto exportado). */
export function descreverOrigemDiaria(r: ResultadoSimulacao, nomeBairro: string): string {
  switch (r.origemDiaria) {
    case "informada":
      return "diária informada por você";
    case "metragem":
      return `média de studios de ${r.faixaMetragem} em ${nomeBairro}`;
    case "media":
      return `média de ${nomeBairro} (sem recorte por metragem na base)`;
  }
}

/** Explica a ocupação considerada quando o objetivo a altera. */
export function descreverOcupacao(r: ResultadoSimulacao, objetivo: ObjetivoSimulacao): string {
  const pp = r.ocupacaoConsiderada - r.ocupacaoEscolhida;
  if (pp === 0) return `${r.ocupacaoConsiderada}%`;
  const sinal = pp > 0 ? "+" : "−";
  return `${r.ocupacaoConsiderada}% (${r.ocupacaoEscolhida}% escolhida ${sinal} ${Math.abs(pp)} p.p. do objetivo "${OBJETIVOS[objetivo].label}")`;
}

/** Texto da exportação/cópia da simulação. */
export function textoResumoSimulacao(
  nomeBairro: string,
  entrada: Pick<EntradaSimulacao, "objetivo" | "aumentoDiaria">,
  r: ResultadoSimulacao,
): string {
  const objetivo = isObjetivo(entrada.objetivo) ? entrada.objetivo : OBJETIVO_PADRAO;
  const ajusteDiaria = OBJETIVOS[objetivo].diariaPct;
  const linhas = [
    "📊 Simulação de Receita — Short Stay",
    "",
    `Bairro: ${nomeBairro}`,
    `Metragem: ${fmtInt(r.metragem)} m²`,
    `Objetivo: ${OBJETIVOS[objetivo].label}`,
    `Ocupação considerada: ${descreverOcupacao(r, objetivo)}`,
    `Diária de referência: ${fmtBRL(r.diariaReferencia)} (${descreverOrigemDiaria(r, nomeBairro)})`,
  ];
  if (ajusteDiaria !== 0) {
    linhas.push(
      `Diária com o ajuste do objetivo (${ajusteDiaria > 0 ? "+" : "−"}${Math.abs(ajusteDiaria)}%): ${fmtBRL(r.diariaConsiderada)}`,
    );
  }
  if (entrada.aumentoDiaria > 0) {
    linhas.push(`Diária com melhoria (+${entrada.aumentoDiaria}%): ${fmtBRL(r.diariaComMelhoria)}`);
  }
  linhas.push("", `Receita bruta mensal: ${fmtBRL(r.receitaMensal)}`, `Receita bruta anual: ${fmtBRL(r.receitaAnual)}`);
  if (r.ganhoMensal > 0) linhas.push(`Ganho mensal com a melhoria: ${fmtBRL(r.ganhoMensal)}`);
  if (r.paybackMeses) linhas.push(`Payback da reforma: ~${fmtInt(r.paybackMeses)} meses`);
  linhas.push(
    "",
    "Receita bruta, antes de plataforma, limpeza, condomínio e impostos. Simulação, não promessa de resultado.",
    "Gerado em bewild.com.br/guia-do-investidor",
  );
  return linhas.join("\n");
}
