/**
 * Conteúdo de /orcamento — módulo sem componentes nem CSS (o `head()` da rota
 * importa o JSON-LD daqui; ver src/content/pages/README em servicos.ts).
 *
 * Rodada 3 da auditoria de SEO de 06/10/2026: a página tinha 341 palavras e
 * aparecia na posição 38 para "reforma turnkey orçamento". Os números abaixo
 * são os publicados nos posts da Bewild (188 contratos analisados) — se os
 * posts mudarem, mude aqui também.
 */
import { faqJsonLd } from "@/lib/useSeo";
import type { LeadObjetivo } from "@/lib/leadForm";
import { CONTACT } from "@/components/landing/content";
import { CLIENTES_SHORT_STAY_PCT, CONTRATOS_ANALISADOS } from "@/content/provas";
import { CUSTO_M2_MEDIANO, ORCAMENTO_MEDIANO } from "@/content/baseCusto";
export { topoVarianteDaBusca, type TopoVariante } from "@/lib/googleAdsVariant";

export const CANONICAL = "/orcamento";

const BASE = "https://bewild.com.br";

export const PILAR_CUSTO = "/conteudos/quanto-custa-reformar-apartamento-studio-ate-50-m2";

export const TOPO_VARIANTES = {
  padrao: {
    h1: "Orçamento de reforma de apartamento e studio em SP.",
    subtitulo: "Reforma completa turnkey de studios e compactos recém-entregues, no contrapiso, para alugar, anunciar no Airbnb ou morar: projeto, obra, marcenaria, mobília e eletros em um contrato, com preço fechado e 5 anos de garantia.",
  },
  studio: {
    h1: "Orçamento de reforma de studio e apartamento pequeno em SP.",
    subtitulo: `Do contrapiso ao studio pronto para alugar ou anunciar no Airbnb. A maioria das obras da Bewild é em studios de 20 a 35 m², e ${CLIENTES_SHORT_STAY_PCT}% dos clientes reformam para short stay.`,
  },
  arquitetura: {
    h1: "Orçamento de arquitetura e reforma em SP.",
    subtitulo: "Projeto de arquitetura e obra no mesmo contrato, para studios e compactos que vão para aluguel, Airbnb ou moradia. O projeto aprovado em 3D vira o escopo do contrato, e o que está nele tem preço fechado.",
  },
  custo: {
    h1: "Quanto custa reformar seu apartamento em SP?",
    subtitulo: `A mediana dos ${CONTRATOS_ANALISADOS} contratos de reforma completa de até 50 m² da Bewild é ${CUSTO_M2_MEDIANO} por m², com projeto, obra, marcenaria, mobília e eletros, e o studio sai pronto para alugar. Informe bairro e metragem e receba a faixa do seu imóvel em até um dia útil.`,
  },
  investidor: {
    h1: "Orçamento de reforma de studio para alugar ou Airbnb.",
    subtitulo: `Projeto, obra, marcenaria, mobília e eletros: o studio sai pronto para fotografar e anunciar. ${CLIENTES_SHORT_STAY_PCT}% dos clientes da Bewild reformam para short stay, e a gestão do Airbnb também pode ficar com a Bewild, ou com quem você escolher.`,
  },
  // Anúncios "Comprou Estúdio na Planta? / Do Contrapiso ao Inquilino" e
  // palavras como "reforma apartamento novo" e "na planta".
  planta: {
    h1: "Comprou studio na planta? Orçamento da reforma, do contrapiso ao inquilino.",
    subtitulo: "A Bewild reforma unidades recém-entregues, no contrapiso: projeto, obra, marcenaria, mobília e eletros em um contrato, com preço fechado e 5 anos de garantia. O prazo começa 5 dias úteis depois do projeto aprovado e da autorização do condomínio, e a data de entrega fica escrita no contrato.",
  },
} as const;

/**
 * Linha fixa abaixo do subtítulo, em toda variante: diz logo quem a Bewild
 * atende, para quem tem casa, apartamento antigo ou imóvel fora da capital
 * não gastar o pedido (e o anúncio não pagar por esse lead).
 */
export const NOTA_ATENDIMENTO =
  "Atendemos só a cidade de São Paulo, em apartamentos novos ou com até 15 anos de uso. São só as informações iniciais para conhecermos o seu imóvel: um especialista da Bewild responde pelo WhatsApp em até um dia útil.";

/** Formulário em etapas: rótulo curto (barra de progresso) e pergunta (H2). */
export const ETAPAS: ReadonlyArray<{ rotulo: string; pergunta: string }> = [
  { rotulo: "Imóvel", pergunta: "Onde fica e qual o tamanho?" },
  { rotulo: "Objetivo", pergunta: "Para que é a reforma?" },
  { rotulo: "Situação", pergunta: "Em que pé está o imóvel?" },
  { rotulo: "Contato", pergunta: "Dados para contato" },
];

/**
 * O VALOR enviado é o canônico do CRM (o mesmo de /diagnostico); o rótulo e a
 * dica são o texto amigável desta página.
 */
export const OBJETIVOS: ReadonlyArray<{ value: LeadObjetivo; label: string; dica?: string }> = [
  { value: "Short stay", label: "Short stay (curta temporada)", dica: "Airbnb e afins" },
  { value: "Locação tradicional", label: "Locação tradicional", dica: "contrato de 30 meses" },
  { value: "Moradia", label: "Morar", dica: "para você ou a família" },
  { value: "Uso misto", label: "Uso misto", dica: "morar parte do ano" },
  { value: "Ainda avaliando", label: "Ainda avaliando" },
];

/** Estado do imóvel — não tem coluna no CRM; segue no `message` do lead. */
export const ESTADOS_IMOVEL = ["No contrapiso", "2 a 8 anos de uso", "9 a 15 anos de uso"] as const;
export type EstadoImovel = (typeof ESTADOS_IMOVEL)[number];

/** Slider de metragem (m²). */
export const AREA_SLIDER = { min: 15, max: 120, padrao: 28 } as const;

export const FAQ: { q: string; a: string }[] = [
  {
    q: "Quanto custa uma reforma turnkey em São Paulo?",
    a: `Nos ${CONTRATOS_ANALISADOS} contratos de reforma completa de até 50 m² analisados pela Bewild, a mediana foi ${ORCAMENTO_MEDIANO}, ou ${CUSTO_M2_MEDIANO} por m², com projeto, obra, marcenaria, mobiliário e eletrodomésticos. Quatro em cada dez contratos ficaram entre R$ 65 mil e R$ 75 mil, e nenhum abaixo de R$ 55 mil. A tabela por metragem está no guia de custo da Bewild.`,
  },
  {
    q: "O orçamento é gratuito?",
    a: "Sim. A faixa de investimento pelo WhatsApp, a visita técnica e a proposta não têm custo nem compromisso. O projeto executivo detalhado começa depois da assinatura do contrato.",
  },
  {
    q: "Em quanto tempo recebo a proposta?",
    a: "A faixa de investimento sai em até um dia útil depois do pedido. A proposta fechada, com projeto 3D e memorial, depende da visita e das revisões do estudo de layout — em geral, de uma a três semanas.",
  },
  {
    q: "O preço pode mudar depois de fechado?",
    a: "Não por conta de erro de orçamento: o contrato é a preço fechado, e se a obra custar mais do que o combinado a diferença é da Bewild. Aditivo só existe se você pedir uma mudança de escopo depois da assinatura, e ele é aprovado por escrito antes de executar.",
  },
  {
    q: "Quanto tempo demora a reforma?",
    a: "Cerca de 60 dias úteis de obra para studios e apartamentos compactos, com a data de entrega em contrato e multa por dia de atraso. Metragens maiores ou integração de varanda levam mais; o cronograma por etapa é definido antes de a obra começar.",
  },
  {
    q: "Ainda não tenho as chaves. Já posso pedir orçamento?",
    a: "Pode, e é o melhor momento: projeto e proposta são feitos pela planta e pelo memorial da construtora, para a obra começar assim que o imóvel for entregue.",
  },
  {
    q: "Moro fora de São Paulo. Como funciona?",
    a: "Vistoria por procuração, ligação de energia, instalação de internet e emergências ficam com a Bewild, e você acompanha projeto, obra e entrega pelo Bwild Workflow, com relatórios semanais e fotos.",
  },
  {
    q: "Vocês fazem o projeto de arquitetura e a decoração?",
    a: "Sim. Layout, marcenaria, iluminação, acabamentos e mobília saem de um projeto da Bewild, com arquiteto como responsável técnico, aprovado em 3D antes da obra. Projeto e obra ficam no mesmo contrato.",
  },
  {
    q: "Quem cuida da ART e do plano de reforma para o condomínio?",
    a: "A Bewild. Antes de a obra começar, entregamos ao síndico o plano de reforma exigido pela NBR 16280, com a ART ou RRT do responsável técnico, o cronograma e os horários de trabalho.",
  },
];

/**
 * JSON-LD da página no HTML do servidor (head() da rota): FAQ + as propriedades
 * que transformam o WebPage em ContactPage de leads — o ContactPoint do
 * orçamento (o mesmo contato oficial do site) e a ação de pedir orçamento.
 * O `@type` "ContactPage" vem do `pageTypeFor` do routeHead; aqui entram só as
 * propriedades extras, sobrepostas ao nó da página.
 */
export const ORCAMENTO_PAGE_JSONLD: Record<string, unknown> = {
  mainEntity: {
    "@type": "ContactPoint",
    name: "Pedido de orçamento de reforma",
    contactType: "sales",
    url: `${BASE}/orcamento`,
    telephone: `+${CONTACT.whatsappNumber}`,
    email: CONTACT.email,
    areaServed: "BR",
    availableLanguage: "Portuguese",
  },
  potentialAction: {
    "@type": "QuoteAction",
    name: "Pedir orçamento de reforma turnkey",
    target: `${BASE}/orcamento`,
    result: {
      "@type": "Quote",
      name: "Faixa de investimento da reforma (preço fechado)",
    },
    recipient: { "@id": `${BASE}/#org` },
  },
};

/** JSON-LD extra da página: FAQ. */
export const ORCAMENTO_JSONLD: Array<Record<string, unknown>> = [faqJsonLd(FAQ)];
