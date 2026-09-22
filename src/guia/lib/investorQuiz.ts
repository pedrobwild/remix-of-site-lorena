/**
 * Tipos do quiz do investidor, extraídos do app original do guia.
 * Aqui só os tipos são necessários: a lógica de recomendação vivia numa
 * seção (RecomendacaoSection) que depende do backend próprio do guia e
 * por isso não foi portada.
 */

export interface QuizAnswers {
  objective: string;
  risk: string;
  priority: string;
}

export interface InvestorProfile {
  name: string;
  description: string;
  weights: { retorno: number; demanda: number; operacao: number; futuro: number };
  icon: string;
  color: string;
  textColor: string;
}
