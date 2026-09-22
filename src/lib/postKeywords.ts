/**
 * Palavras-chave por post de /conteudos.
 *
 * Regra: só entram termos que o texto realmente responde. Posts de reforma
 * miram "reforma de apartamento em SP" e "custo de reforma"; posts de
 * operação/short stay miram os termos do próprio tema (forçar "reforma"
 * neles seria keyword stuffing e o Google penaliza).
 */

const REFORMA = "reforma de apartamento em SP, reforma de apartamento em São Paulo, custo de reforma";
const REFORMA_STUDIO = "reforma de studio em SP, reforma de apartamento em SP, custo de reforma";
const SHORT_STAY = "short stay em São Paulo, studio para alugar, renda de aluguel por temporada";

export const POST_KEYWORDS: Record<string, string> = {
  // --- Reforma: custo e prazo ---
  "quanto-custa-reformar-apartamento-sao-paulo-2026": `custo de reforma, quanto custa reformar um apartamento, ${REFORMA}, preço de reforma por m²`,
  "quanto-custa-reformar-studio-short-stay-sao-paulo": `custo de reforma de studio, quanto custa reformar um studio, ${REFORMA_STUDIO}, valor por m² de reforma`,
  "quanto-tempo-demora-reforma-apartamento": `prazo de reforma de apartamento, quanto tempo demora uma reforma, ${REFORMA}`,
  "cronograma-reforma-studio-60-dias-uteis": `cronograma de reforma, prazo de reforma de studio, ${REFORMA_STUDIO}`,
  "etapas-de-reforma-de-apartamento-cronograma": `etapas de uma reforma, cronograma de reforma de apartamento, ${REFORMA}`,

  // --- Reforma: orçamento e contrato ---
  "como-comparar-orcamentos-de-reforma": `comparar orçamento de reforma, custo de reforma, orçamento de reforma de apartamento, ${REFORMA}`,
  "o-que-esta-incluso-orcamento-reforma-studio": `orçamento de reforma de studio, o que entra no orçamento de reforma, custo de reforma, ${REFORMA_STUDIO}`,
  "reforma-turn-key-ou-tradicional": `reforma turn-key, custo de reforma, comparativo de custo de reforma, ${REFORMA}`,
  "aditivo-em-obra-por-que-existe": `aditivo de obra, custo de reforma, orçamento de reforma de apartamento, ${REFORMA}`,

  // --- Reforma: guias gerais ---
  "reforma-de-apartamento-em-sao-paulo-guia": `${REFORMA}, como fazer uma reforma de apartamento, empresa de reforma em São Paulo`,
  "reforma-de-casa-ou-apartamento-em-sp": `reforma de casa em SP, ${REFORMA}, diferença entre reforma de casa e de apartamento`,
  "reformar-studio-sao-paulo-morando-em-outra-cidade": `reforma à distância, ${REFORMA_STUDIO}, reformar apartamento morando em outra cidade`,

  // --- Reforma: condomínio e obra ---
  "nbr-16280-reforma-studio-condominio": `NBR 16280, autorização de reforma em condomínio, ${REFORMA_STUDIO}`,
  "o-que-perguntar-ao-sindico-antes-de-reformar": `autorização de reforma condomínio, regras de reforma em apartamento, ${REFORMA_STUDIO}`,
  "fechar-varanda-em-vidro-studio-condominio": `fechamento de varanda com vidro, custo de reforma, ${REFORMA_STUDIO}`,

  // --- Reforma: escolhas técnicas ---
  "piso-vinilico-ou-porcelanato-studio": `piso vinílico ou porcelanato, custo de reforma, ${REFORMA_STUDIO}`,
  "ar-condicionado-studio-quantos-btus": `ar-condicionado em studio, quantos BTUs, ${REFORMA_STUDIO}`,

  // --- Studio na planta / entrega ---
  "comprou-studio-na-planta-antes-das-chaves": `studio na planta, ${REFORMA_STUDIO}, o que fazer antes das chaves`,
  "recebi-chaves-studio-na-planta-o-que-fazer": `entrega das chaves do studio, ${REFORMA_STUDIO}, preparar studio para alugar`,
  "o-que-vem-no-studio-novo-sao-paulo": `studio novo em São Paulo, o que vem instalado, ${REFORMA_STUDIO}`,

  // --- Short stay: operação e rentabilidade ---
  "o-que-e-short-stay": `o que é short stay, ${SHORT_STAY}`,
  "quanto-rende-studio-short-stay-sao-paulo": `quanto rende um studio, rentabilidade de short stay, ${SHORT_STAY}`,
  "melhores-bairros-short-stay-sao-paulo": `melhores bairros para short stay, ${SHORT_STAY}`,
  "short-stay-ou-long-stay-studio-compacto": `short stay ou long stay, ${SHORT_STAY}`,
  "preparar-studio-airbnb-checklist": `preparar studio para Airbnb, checklist de Airbnb, ${SHORT_STAY}`,
  "7-erros-imovel-short-stay": `erros no short stay, preparar imóvel para short stay, ${SHORT_STAY}`,
  "airbnb-ou-booking": `Airbnb ou Booking, anunciar studio, ${SHORT_STAY}`,
  "gestao-propria-vs-gestora": `gestora de short stay, gestão própria de Airbnb, ${SHORT_STAY}`,

  // --- Short stay: regras e tributos ---
  "studios-airbnb-sao-paulo-o-que-a-lei-permite": `condomínio pode proibir Airbnb, regras de short stay, ${SHORT_STAY}`,
  "studio-his-ou-hmp-o-que-fazer": `studio HIS, studio HMP, regras de São Paulo, ${SHORT_STAY}`,
  "reforma-tributaria-short-stay-ibs-cbs": `reforma tributária short stay, IBS e CBS, ${SHORT_STAY}`,
  "como-declarar-renda-airbnb-imposto-de-renda": `declarar renda de Airbnb, carnê-leão, imposto de renda de aluguel por temporada`,
};

export const DEFAULT_POST_KEYWORDS =
  "reforma de apartamento em SP, custo de reforma, reforma de apartamento em São Paulo, Bewild";

export function keywordsForPost(slug: string): string {
  const specific = POST_KEYWORDS[slug];
  return specific ? `${specific}, Bewild` : DEFAULT_POST_KEYWORDS;
}
