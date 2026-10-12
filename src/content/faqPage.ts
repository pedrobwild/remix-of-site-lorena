import { BAIRROS_ATENDIDOS, PROVA_FRASE } from "@/content/provas";
import { faqJsonLd } from "@/lib/useSeo";
import type { KbItem } from "@/lib/assistant/assistantEngine";

/**
 * Perguntas fixas de /faq (fonte única do texto visível e do FAQPage do
 * head() da rota, no HTML do servidor).
 */
export type FaqItem = { q: string; a: string; href?: string; linkLabel?: string };

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "O que é uma reforma turnkey?",
    a: "Turnkey quer dizer chave na mão. Você assina um contrato, a gente executa tudo e devolve o imóvel pronto para usar. É o modelo da Bewild desde o primeiro projeto.",
  },
  {
    q: "O que vocês chamam de contrato fechado?",
    a: "Preço e prazo definidos e assinados antes de a obra começar. Se o valor ultrapassar o combinado, a diferença é por nossa conta.",
  },
  {
    q: "Vocês só reformam para Airbnb?",
    a: "Não. Reformamos para morar, para alugar em curta ou longa temporada e para vender. O projeto muda conforme o objetivo.",
  },
  {
    q: "Preciso ir à obra?",
    a: "Só se você quiser. Todo o acompanhamento acontece pelo Bwild Workflow. E moradores de fora de São Paulo contam com vistoria por procuração, ligação de energia e instalação de internet feitas pela gente.",
  },
  {
    q: "Quanto tempo leva uma reforma?",
    a: "Cerca de 60 dias úteis de obra para studios e apartamentos compactos de até 30 m²; imóveis maiores ou com integração de varanda levam mais. A sua data exata fica escrita no contrato, antes de a obra começar.",
  },
  {
    q: "Onde vocês atuam?",
    a: "Só em São Paulo capital, com obras entregues em mais de 27 bairros. Não atendemos a Grande São Paulo nem o interior, mas o dono do imóvel pode morar em qualquer cidade: o acompanhamento é todo à distância.",
  },
];

/* Complemento da lista principal só enquanto o banco não carregou (ou se
 * falhar), para o HTML do servidor não perder preço, atraso, garantia,
 * condomínio e portfólio. Espelha os itens `preco`, `atraso`, `garantia`,
 * `condominio` e `confianca` do banco. Com o banco no ar, some. */
export const FAQ_ITEMS_SEM_BANCO: FaqItem[] = [
  {
    q: "Vocês fazem a gestão do Airbnb depois da obra?",
    a: "Sim. Além de entregar o imóvel pronto para fotografar e anunciar, a Bewild faz a gestão do Airbnb. Se preferir, a operação pode ficar com você ou com quem você escolher, e o blog compara gestão própria e gestora profissional.",
  },
  {
    q: "Quanto custa uma reforma?",
    a: "Nas 58 obras completas da nossa base de 2025 (fevereiro a outubro), em imóveis de 21 a 35 m², a mediana foi de R$ 63.763 por obra, ou R$ 2.389 por metro quadrado, com projeto, obra, marcenaria sob medida, mobília e eletros incluídos. Metade das obras ficou entre R$ 2.107 e R$ 2.716 por m². O valor do seu imóvel sai fechado na proposta, com memorial item a item, antes de a obra começar.",
    href: "/orcamento",
    linkLabel: "Pedir um orçamento →",
  },
  {
    q: "E se a obra atrasar?",
    a: "A data de entrega entra no contrato antes de a obra começar. Se o atraso for por nossa conta, pagamos multa por dia de atraso, prevista em contrato. E cada etapa fica registrada no Bwild Workflow, visível para você do começo ao fim.",
  },
  {
    q: "Qual é a garantia?",
    a: "São 5 anos de garantia em contrato, para a obra e para a marcenaria. Se algo falhar nesse período, quem resolve é a Bewild.",
  },
  {
    q: "Preciso de autorização do condomínio para reformar?",
    a: "Sim. A maioria dos condomínios pede comunicado prévio, plano de reforma com ART ou RRT do responsável técnico (NBR 16280) e horários definidos para obra e elevador. Essa documentação e o pedido de liberação ficam com a Bewild, antes de a obra começar: você não precisa tratar com a administradora.",
    href: "/autorizacao-condominio",
    linkLabel: "Guia completo: autorização de reforma no condomínio →",
  },
  {
    q: "Posso ver obras que a Bewild já entregou?",
    a: `Pode. São ${PROVA_FRASE} em mais de ${BAIRROS_ATENDIDOS} bairros de São Paulo, e o portfólio tem uma página para cada projeto, com fotos reais, metragem, bairro e o que foi feito. Para saber se há obra no seu prédio ou uma unidade para visitar, a equipe confere para você.`,
    href: "/portfolio",
    linkLabel: "Ver o portfólio completo →",
  },
];

/** Lista principal quando o banco não está disponível. */
export const FALLBACK_ITEMS: FaqItem[] = [...FAQ_ITEMS, ...FAQ_ITEMS_SEM_BANCO];

/* Bloco de conteúdo (não é copy travada da home): responde a buscas do tipo
 * "como fazer uma reforma de apartamento" e "por onde começar uma reforma".
 * Preço, prazo e condomínio ficam só na lista principal. */
export const GUIA_ITEMS: FaqItem[] = [
  {
    q: "Como fazer uma reforma de apartamento, passo a passo?",
    a: "Na ordem: pedido de orçamento com a planta e o objetivo do imóvel (morar, alugar ou vender); proposta com preço, prazo e memorial item a item; projeto 3D revisado até a sua aprovação; projeto executivo, ART e liberação no condomínio; obra com equipe e marcenaria próprias, acompanhada pelo Bwild Workflow; e entrega com vistoria final. Na Bewild, tudo isso cabe num contrato só, com um único responsável.",
    href: "/como-funciona",
    linkLabel: "Ver como funciona, etapa por etapa →",
  },
  {
    q: "Por onde começar uma reforma de apartamento?",
    a: "Comece pelo objetivo, não pelo acabamento. Um apartamento para short stay pede layout, marcenaria e mobília pensados para alta rotatividade; um para morar pede outra coisa. Definido o objetivo, o passo seguinte é o projeto — decidir tudo no papel e no 3D é o que evita mudança cara no meio da obra.",
  },
  {
    q: "Reforma com empresa única ou contratando profissionais separados?",
    a: "Contratar arquiteto, empreiteiro, marceneiro e mobiliário separadamente costuma sair mais barato no papel e mais caro na conta final: cada um culpa o outro pelo atraso e o custo escapa. Com um contrato único, preço e prazo são fechados e existe um só responsável pelo resultado.",
  },
  {
    q: "Quais erros mais atrasam uma reforma de apartamento?",
    a: "Mudar de ideia depois que a obra começou, deixar elétrica e hidráulica para decidir na hora, comprar acabamento sem medida definida e contratar por orçamento aberto. Projeto aprovado em 3D antes de quebrar a primeira parede resolve quase todos eles.",
  },
];

/* Bloco "Indicações e comissões": regras do programa de indicações (parceiros
 * e clientes). Contrato fechado, atraso e garantia ficam na lista principal.
 * Copy segue as decisões travadas do dono: sem percentual público de
 * comissão — o valor é definido no termo individual. */
export const INDICACAO_ITEMS: FaqItem[] = [
  {
    q: "Como funciona a comissão para parceiros que indicam?",
    a: "Corretores, imobiliárias, incorporadoras, arquitetos e administradoras de locação recebem comissão por contrato indicado. O percentual não é público: é definido no termo individual, conforme o perfil e o volume de indicações, calculado sobre o valor líquido do contrato e com relatório mensal. O pagamento acontece após o recebimento da Bewild.",
    href: "/parceiros",
    linkLabel: "Ver o programa de indicações para parceiros →",
  },
  {
    q: "Como funciona a recompensa para quem indica um amigo?",
    a: "Qualquer pessoa pode indicar, sem precisar ser do mercado. O valor da recompensa é combinado com você e confirmado por escrito no momento do registro, e o pagamento é feito por Pix após o fechamento do contrato e a confirmação do primeiro pagamento do indicado.",
    href: "/indique-um-amigo",
    linkLabel: "Indicar um amigo agora →",
  },
  {
    q: "Por quanto tempo vale uma indicação?",
    a: "A indicação vale por 12 meses contados do registro. Se a pessoa indicada fechar contrato dentro desse período, a recompensa ou a comissão é sua.",
  },
  {
    q: "Meu indicado já estava negociando com a Bewild. Conta?",
    a: "Não. A indicação só vale para quem ainda não estava em negociação com a Bewild nem chegou por um canal próprio da empresa. A regra evita disputa entre indicadores e vale para todo mundo.",
  },
];

/* Bloco "Portfólio": exemplos de obras entregues, cada um ligado a um projeto
 * ou case real. "Posso ver as obras?", preço e região ficam na lista
 * principal. Links usam slugs reais do banco — se um projeto sair do ar,
 * trocar o href aqui. */
export const PORTFOLIO_ITEMS: FaqItem[] = [
  {
    q: "Vocês já reformaram um studio pequeno, de uns 25 m²?",
    a: "Sim, é a nossa especialidade. Um exemplo é o AB – Península Vila Madalena, um studio de 23 m² reformado para locação, com marcenaria sob medida para aproveitar cada centímetro.",
    href: "/portfolio/ab-peninsula-vila-madalena",
    linkLabel: "Ver o projeto na Vila Madalena →",
  },
  {
    q: "Dá para ver o antes e depois de um studio para short stay?",
    a: "Dá. O FG – Nurban Vila Madalena é um studio de 26 m² reformado para aluguel de curta temporada, e o case mostra a obra da medição à entrega: fotos do antes, da obra e do resultado, com o passo a passo de cada decisão. Layout, marcenaria e mobília foram pensados para alta rotatividade e boas fotos de anúncio.",
    href: "/conteudos/antes-e-depois-studio-26-m2-vila-madalena",
    linkLabel: "Ler o case de antes e depois →",
  },
];

/**
 * FAQPage único de /faq, com exatamente as perguntas visíveis: as do banco (ou
 * a lista fixa) + os blocos Portfólio, Como fazer uma reforma e Indicações.
 * Usado no head() da rota (HTML do servidor).
 */
export function faqPageJsonLd(kb: KbItem[] | null) {
  return faqJsonLd([
    ...(kb ? kb.map((i) => ({ q: i.pergunta, a: i.resposta })) : FALLBACK_ITEMS.map((i) => ({ q: i.q, a: i.a }))),
    ...PORTFOLIO_ITEMS.map((i) => ({ q: i.q, a: i.a })),
    ...GUIA_ITEMS.map((i) => ({ q: i.q, a: i.a })),
    ...INDICACAO_ITEMS.map((i) => ({ q: i.q, a: i.a })),
  ]);
}

