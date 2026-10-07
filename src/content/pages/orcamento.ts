/**
 * Conteúdo de /orcamento — módulo sem componentes nem CSS (o `head()` da rota
 * importa o JSON-LD daqui; ver src/content/pages/README em servicos.ts).
 *
 * Rodada 3 da auditoria de SEO de 06/10/2026: a página tinha 341 palavras e
 * aparecia na posição 38 para "reforma turnkey orçamento". Os números abaixo
 * são os publicados nos posts da Bewild (188 contratos analisados) — se os
 * posts mudarem, mude aqui também.
 */
import { CONTRATOS_ANALISADOS } from "@/content/provas";
import { faqJsonLd } from "@/lib/useSeo";
import type { LeadObjetivo } from "@/lib/leadForm";

export const CANONICAL = "/orcamento";

export const PILAR_CUSTO = "/conteudos/quanto-custa-reformar-apartamento-studio-ate-50-m2";

/**
 * Números do bloco "Quanto custa" ao lado do formulário. Fixos (não mudam
 * conforme o preenchimento) e os mesmos dos posts de custo — se os posts
 * mudarem, mude aqui. A contagem de contratos vem de provas.ts.
 */
export const CUSTO = { contratos: CONTRATOS_ANALISADOS, mediana: 71850, m2: 2744 } as const;

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
    a: "Nos 188 contratos de reforma completa de até 50 m² analisados pela Bewild, a mediana foi R$ 71.850, ou R$ 2.744 por m², com projeto, obra, marcenaria, mobiliário e eletrodomésticos. Quatro em cada dez contratos ficaram entre R$ 65 mil e R$ 75 mil, e nenhum abaixo de R$ 55 mil. A tabela por metragem está no guia de custo da Bewild.",
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
];

/** JSON-LD da página no HTML do servidor (head() da rota): FAQ. */
export const ORCAMENTO_JSONLD: Array<Record<string, unknown>> = [faqJsonLd(FAQ)];
