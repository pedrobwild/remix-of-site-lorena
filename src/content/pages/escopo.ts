/**
 * Conteúdo de /escopo (D4 do Pedro, auditoria de SEO rodada 4, 09/11/2026):
 * o que entra e o que não entra na reforma completa da Bewild, faixas por
 * metragem e FAQ. Módulo sem componentes nem CSS: a página o importa direto
 * e a rota só pelo loader (`import("…")`), porque o `head()` entra no pacote
 * inicial de toda página.
 *
 * Nada novo nasce aqui. Escopo, garantia, prazo e área de atuação repetem o
 * que o site já publica (/faq, /orcamento, /reforma-de-studio-sao-paulo,
 * escopoCalc.ts); números de custo só de baseCusto.ts e indiceCusto.ts (base
 * de 188 contratos). O papel da página é entender e montar o escopo: custo da
 * base inteira é do Índice, valor do imóvel é do pedido de orçamento.
 */
import { BASE_CUSTO, CUSTO_M2_MEDIANO, STUDIO_TABELA_VIGENTE, brl } from "@/content/baseCusto";
import { FAIXAS_METRAGEM, INDICE_EDICAO } from "@/content/indiceCusto";
import { faqJsonLd } from "@/lib/useSeo";

export type EscopoItem = { item: string; detalhe: string };

/** O que entra na reforma completa, na ordem da obra. */
export const ESCOPO_ENTRA: EscopoItem[] = [
  {
    item: "Projeto 3D e executivo",
    detalhe:
      "Layout, maquete aprovada por você e plantas com cada material e acabamento, com RRT do responsável técnico, arquiteto e urbanista.",
  },
  {
    item: "Obra civil",
    detalhe:
      "Revestimentos, pintura e acabamentos, com o plano de reforma da NBR 16280 e o pedido de liberação ao condomínio feitos pela Bewild.",
  },
  {
    item: "Instalações",
    detalhe:
      "Elétrica, hidráulica e iluminação, com os pontos definidos no projeto antes de a obra começar.",
  },
  {
    item: "Marcenaria própria",
    detalhe:
      "Feita pela marcenaria da Bewild a partir do projeto executivo, com a mesma garantia de 5 anos da obra.",
  },
  {
    item: "Mobiliário e eletrodomésticos",
    detalhe:
      "Móveis soltos, decoração e os eletrodomésticos que o projeto prevê, comprados e instalados pela Bewild.",
  },
  {
    item: "Enxoval e utensílios",
    detalhe:
      "O imóvel sai pronto para usar ou para anunciar, sem uma lista de compras para você resolver depois.",
  },
  {
    item: "Entrega e acompanhamento",
    detalhe:
      "Limpeza fina, vistoria e fotos na entrega, com cada etapa registrada no Bwild Workflow. Para quem mora fora, vistoria por procuração, ligação de energia e instalação de internet.",
  },
];

const PRAZO = STUDIO_TABELA_VIGENTE.prazo;

/** O que fica por escrito no contrato. */
export const ESCOPO_CONTRATO: EscopoItem[] = [
  {
    item: "Preço fechado",
    detalhe:
      "Definido e assinado antes de a obra começar. Se o valor ultrapassar o combinado, a diferença é por conta da Bewild.",
  },
  {
    item: "Prazo em contrato",
    detalhe:
      "Começa 5 dias úteis depois do projeto aprovado e da autorização do condomínio, com a data de entrega escrita no contrato. A Bewild assina prazo de obra para apartamentos de até 140 m², e atraso por conta dela tem multa por dia.",
  },
  {
    item: "Garantia de 5 anos",
    detalhe:
      "Para a obra e para a marcenaria. Se algo falhar nesse período, quem resolve é a Bewild.",
  },
];

/** O que não entra no escopo nem nas faixas de preço. */
export const ESCOPO_NAO_ENTRA: EscopoItem[] = [
  {
    item: "Apartamento com mais de 15 anos de uso",
    detalhe: "O foco da Bewild são unidades recém-entregues, no contrapiso.",
  },
  {
    item: "Obra fora da cidade de São Paulo",
    detalhe:
      "A Bewild executa obras só em São Paulo capital, não na Grande São Paulo nem no interior. O dono pode morar em qualquer cidade: o acompanhamento é à distância.",
  },
  {
    item: "Preço publicado por item",
    detalhe:
      "A base tem o valor da reforma completa, não o de cada item. Escopo parcial é calculado no orçamento, com memorial item a item.",
  },
  {
    item: "Aditivos nas faixas de preço",
    detalhe:
      "As faixas usam o valor do contrato na assinatura; aditivos assinados depois não entram na conta.",
  },
];

/** Faixas por metragem do Índice (mesma tabela, mesmos números), já formatadas. */
export const ESCOPO_FAIXAS = FAIXAS_METRAGEM.map((f) => ({
  faixa: f.faixa,
  contratos: f.contratos,
  orcamentoMediano: brl(f.orcamentoMediano),
  metadeDoMeio: `${brl(f.metadeDoMeioMil[0] * 1000)} a ${brl(f.metadeDoMeioMil[1] * 1000)}`,
  m2Mediano: brl(f.m2Mediano),
}));

export const ESCOPO_FAIXAS_FONTE = `Orçamento da reforma completa nos ${BASE_CUSTO.contratos} contratos do Índice Bewild de custo de reforma, edição de ${INDICE_EDICAO}: valor do contrato na assinatura, sem aditivos.`;

const faixa = (rotulo: string) => {
  const f = FAIXAS_METRAGEM.find((x) => x.faixa === rotulo);
  if (!f) throw new Error(`Faixa ${rotulo} ausente em indiceCusto.ts`);
  return f;
};
const MENOR = faixa("Até 20 m²");
const COMUM = faixa("28 a 32 m²");

/** 4 a 6 perguntas; o FAQPage do head() sai desta mesma lista (texto igual ao visível). */
export const ESCOPO_FAQ: { q: string; a: string }[] = [
  {
    q: "O que entra numa reforma completa da Bewild?",
    a: "Projeto 3D e executivo com RRT do responsável técnico, obra civil, instalações elétricas e hidráulicas, marcenaria própria, mobiliário, eletrodomésticos, enxoval e utensílios. Entram também a documentação do condomínio e a entrega, com limpeza fina, vistoria e fotos. Tudo num contrato só, com preço fechado, prazo por escrito e 5 anos de garantia, inclusive na marcenaria.",
  },
  {
    q: "O que não entra no escopo da Bewild?",
    a: "Apartamento com mais de 15 anos de uso e obra fora da cidade de São Paulo: o foco são unidades recém-entregues, no contrapiso, e a Bewild não atende a Grande São Paulo nem o interior. Também não há preço publicado por item: a base tem o valor da reforma completa, e o escopo parcial é calculado no orçamento.",
  },
  {
    q: "De onde vêm as faixas de preço desta página?",
    a: `Dos ${BASE_CUSTO.contratos} contratos de reforma completa do Índice Bewild de custo de reforma, edição de ${INDICE_EDICAO}, com o valor do contrato na assinatura, sem aditivos. A faixa da calculadora é a metade central desses contratos: de ${brl(BASE_CUSTO.m2P25)} a ${brl(BASE_CUSTO.m2P75)} por m², com mediana de ${CUSTO_M2_MEDIANO} por m².`,
  },
  {
    q: "Por que imóveis pequenos custam mais por m²?",
    a: `Porque cozinha, banheiro e marcenaria pesam igual em pouca área. Na base do Índice, a mediana foi de ${brl(MENOR.m2Mediano)} por m² nos imóveis ${MENOR.faixa.toLowerCase()} e de ${brl(COMUM.m2Mediano)} por m² na faixa de ${COMUM.faixa}. Por isso o preço total muda menos que a metragem: compare o orçamento inteiro, não só o valor por m².`,
  },
  {
    q: "Qual é o prazo e a garantia da reforma completa?",
    a: `O prazo começa 5 dias úteis depois do projeto aprovado e da autorização do condomínio. Studios e compactos de até ${PRAZO.areaMaxM2} m² levam cerca de ${PRAZO.diasUteisMax} dias úteis de obra, e a data exata fica no contrato: a Bewild assina prazo para apartamentos de até 140 m². A garantia é de 5 anos, para a obra e para a marcenaria.`,
  },
  {
    q: "E se eu quiser só parte do serviço?",
    a: "Marque só os itens que quer nas perguntas desta página e leve o resumo ao pedido de orçamento, que calcula o seu escopo com memorial item a item. Faixa de preço só existe para a reforma completa, porque a base da Bewild tem o valor do contrato inteiro, não o de cada item.",
  },
];

export const ESCOPO_JSONLD: Array<Record<string, unknown>> = [faqJsonLd(ESCOPO_FAQ)];
