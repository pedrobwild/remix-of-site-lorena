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
  "quanto-custa-reformar-apartamento-sao-paulo-2026": `quanto custa reformar um apartamento em SP, custo de reforma, preço de reforma por m², custo de reforma de apartamento 2026, ${REFORMA}`,
  "quanto-custa-reformar-studio-short-stay-sao-paulo": `custo de reforma de studio, quanto custa reformar um studio, ${REFORMA_STUDIO}, valor por m² de reforma`,
  "quanto-tempo-demora-reforma-apartamento": `quanto tempo demora uma reforma de apartamento, prazo de reforma de apartamento em SP, tempo de obra em apartamento, cronograma de reforma de studio, reforma em 60 dias úteis, ${REFORMA}`,
  "etapas-de-reforma-de-apartamento-cronograma": `etapas de reforma de apartamento, passo a passo de uma reforma, ordem das etapas de obra, cronograma de reforma, ${REFORMA}`,

  // --- Reforma: orçamento e contrato ---
  "como-comparar-orcamentos-de-reforma": `como comparar orçamentos de reforma, orçamento de reforma de apartamento em SP, custo de reforma, o que olhar num orçamento de obra, ${REFORMA}`,
  "o-que-esta-incluso-orcamento-reforma-studio": `orçamento de reforma de studio, o que entra no orçamento de reforma, custo de reforma, ${REFORMA_STUDIO}`,
  "reforma-turn-key-ou-tradicional": `reforma turn-key, custo de reforma, comparativo de custo de reforma, ${REFORMA}`,
  "aditivo-em-obra-por-que-existe": `aditivo de obra, custo de reforma, orçamento de reforma de apartamento, ${REFORMA}`,

  // --- Reforma: guias gerais ---
  "reforma-de-apartamento-em-sao-paulo-guia": `${REFORMA}, guia de reforma de apartamento, como fazer uma reforma de apartamento, empresa de reforma em São Paulo`,
  "reforma-de-casa-ou-apartamento-em-sp": `reforma de casa em SP, diferença entre reforma de casa e de apartamento, reforma de casa ou apartamento, ${REFORMA}`,
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

  // --- Reforma: guias de decisão e casos ---
  "como-reformar-studio-gastando-menos-sem-perder-valor": `reformar studio gastando menos, como economizar na reforma de studio, reforma de studio sem perder valor de mercado, ${REFORMA_STUDIO}`,
  "orcamento-reforma-studio-25-m2-item-a-item": `orçamento de reforma de studio de 24 m², orçamento item a item, orçamento de reforma de studio para Airbnb, custo de reforma de studio, ${REFORMA_STUDIO}`,
  "estudo-de-layout-studio-25-m2": `estudo de layout de studio, layout de studio de 25 m², projeto de interiores de studio, ${REFORMA_STUDIO}`,
  "reforma-de-apartamento-antigo-sao-paulo": `reforma de apartamento antigo em SP, o que verificar antes de reformar apartamento antigo, instalações antigas, ${REFORMA}`,
  "como-escolher-empresa-de-reforma-sao-paulo": `como escolher empresa de reforma em SP, empresa de reforma de apartamento em São Paulo, o que verificar antes de contratar reforma, ${REFORMA}`,
  "reformar-apartamento-morando-nele": `reformar apartamento morando nele, ficar ou sair durante a obra, reforma com morador no apartamento, ${REFORMA}`,
  "antes-e-depois-studio-26-m2-vila-madalena": `antes e depois de reforma de studio, reforma de studio de 26 m² na Vila Madalena, ${REFORMA_STUDIO}`,
  "quanto-custa-reformar-apartamento-studio-ate-50-m2": `quanto custa reformar apartamento de até 50 m², custo de reforma de studio, custo de reforma por m², ${REFORMA}`,
  "o-que-nao-reformar-no-studio-short-stay": `o que não reformar em studio novo, reforma de studio para short stay, checklist de reforma de studio, ${REFORMA_STUDIO}`,

  // --- Investimento: compra, venda e financiamento ---
  "como-pagar-reforma-apartamento-financiamento-sp": `financiamento de reforma de apartamento, como pagar a reforma, juros de financiamento de reforma, ${REFORMA}`,
  "reformar-apartamento-para-vender-ou-alugar-sp": `reformar apartamento para vender ou alugar, vale a pena reformar para vender, retorno da reforma, ${REFORMA}`,
  "studio-como-degrau-comprar-morar-revender-sp": `studio como degrau, comprar studio para morar e revender, studio em São Paulo, ${REFORMA_STUDIO}`,
  "como-avaliar-studio-antes-de-comprar": `como avaliar um studio antes de comprar, critérios para comprar studio, studio para short stay, ${SHORT_STAY}`,
  "custos-de-operar-studio-short-stay": `custos de um studio em short stay, lucro de short stay, receita bruta e lucro líquido, ${SHORT_STAY}`,
  "short-stay-sem-virar-gerente-de-obra": `renda passiva com studio, short stay sem gerenciar obra, investir em studio, ${SHORT_STAY}`,

  // --- Operação e mercado ---
  "como-precificar-studio-airbnb-sao-paulo": `como precificar studio no Airbnb, diária de studio em São Paulo, precificação de Airbnb, ${SHORT_STAY}`,
  "o-que-move-reservas-studio-airbnb": `o que faz o hóspede reservar no Airbnb, reservas de studio no Airbnb, perfil de hóspede, ${SHORT_STAY}`,
  "quem-reforma-studio-sao-paulo-perfil": `quem reforma studio em São Paulo, perfil de quem reforma studio, dúvidas sobre reforma de studio, ${REFORMA_STUDIO}`,
  "pedro-henrique-alves-ceo-bewild": `Pedro Henrique Alves, CEO da Bewild, fundador da Bewild, imóvel como negócio`,
  "thiago-dantas-arquiteto-responsavel-tecnico-bewild": `Thiago Dantas, arquiteto responsável técnico, cofundador da Bewild, arquiteto em São Paulo`,
};

export const DEFAULT_POST_KEYWORDS =
  "reforma de apartamento em SP, custo de reforma, reforma de apartamento em São Paulo, Bewild";

export function keywordsForPost(slug: string): string {
  const specific = POST_KEYWORDS[slug];
  return specific ? `${specific}, Bewild` : DEFAULT_POST_KEYWORDS;
}
