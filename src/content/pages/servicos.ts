import { ESCOPO_FRASE } from "@/content/escopoOficial";
/**
 * Dados e JSON-LD de /servicos — módulo sem componentes nem CSS.
 *
 * O `head()` da rota (src/routes/servicos.tsx) precisa do JSON-LD de forma
 * síncrona e fica no grafo carregado em TODA página (routeTree). Enquanto a
 * constante morava em src/pages/ServicosPage.tsx, o CSS e os componentes da
 * página inteira iam junto para todas as rotas (auditoria de SEO 06/10/2026,
 * item 3: 9–11 folhas de estilo bloqueantes por página).
 */
import { faqJsonLd } from "@/lib/useSeo";

export const CANONICAL = "/servicos";

export const DESCRIPTION =
  "Arquitetura, engenharia e obra num contrato só: projeto 3D, reforma de apartamento, studio e cobertura, marcenaria própria, preço fechado e 5 anos de garantia.";


/**
 * Plano Studio Protegido — manutenção preventiva de ar-condicionado, elétrica
 * e hidráulica (seção #manutencao de /servicos). Escopo, preço e regras são os
 * confirmados pelo Pedro em 26/11/2026 (campanha "A conta do studio que
 * ninguém fez", versão 4). Fonte única: a página, o FAQ e o JSON-LD leem daqui.
 *
 * Os números da simulação de custo entraram a pedido do Pedro (26/11/2026) e
 * aparecem SEMPRE com a nota de que são estimativa (`simulacao.nota`): vêm de
 * um modelo com preços de mercado e premissas de frequência, não de chamados
 * reais. Quando houver 3 meses de chamados, trocar pelos números próprios.
 * Ficam FORA do site até decisão do Pedro: limite de chamados por mês e a
 * janela do prazo de atendimento (24 h ou horário comercial). Não é a garantia de obra: os
 * chamados de emergência da garantia seguem no FAQ "Qual é a garantia?".
 */
export const MANUTENCAO = {
  nome: "Plano Studio Protegido",
  /** Preço mensal em reais (número para o JSON-LD; texto para a página). */
  precoMensal: 200,
  precoTexto: "R$ 200 por mês",
  resumo:
    "Plano mensal de manutenção preventiva para studios em São Paulo: quatro visitas por ano revisam ar-condicionado, elétrica, hidráulica e vedações, e a mão de obra dos reparos já está incluída.",
  frentes: [
    {
      n: "01",
      titulo: "Ar-condicionado",
      t: "Revisão do aparelho em toda visita preventiva. O ar é o defeito mais caro e o mais urgente no verão, por isso a revisão vem antes de ele parar.",
    },
    {
      n: "02",
      titulo: "Elétrica",
      t: "Revisão da instalação elétrica a cada trimestre. Chuveiro, disjuntor ou tomada com defeito: a mão de obra do reparo está no plano.",
    },
    {
      n: "03",
      titulo: "Hidráulica e vedações",
      t: "Revisão de hidráulica e vedações em toda visita. Vazamento, descarga e desentupimento entram com mão de obra incluída.",
    },
  ],
  condicoes: [
    { valor: "4 visitas", rotulo: "preventivas por ano, uma por trimestre" },
    { valor: "Mão de obra", rotulo: "dos reparos incluída no plano" },
    { valor: "Até 6 horas", rotulo: "para o atendimento após o chamado" },
    { valor: "Sem fidelidade", rotulo: "você cancela quando quiser" },
  ],
  /** Regras que a página mostra sempre junto do preço (aprovadas em 26/11/2026). */
  regras:
    "Peças e material são cobrados à parte, sempre com orçamento antes. Carência de 30 dias para chamados de conserto; a visita preventiva vale desde o primeiro dia. Problema que já existia na data da assinatura é orçado à parte.",
  apoio:
    "O plano também cobre pequenos reparos, como fechadura, dobradiça e silicone. Para quem reformou com a Bewild, quem atende é o mesmo time que conhece cada instalação da obra.",
  /**
   * Simulação da campanha (cenário central: média de R$ 2.823 por ano; em 1 a
   * cada 10 anos, mais de R$ 4.745), arredondada para baixo como no material
   * aprovado. O valor do plano por ano é precoMensal × 12.
   */
  simulacao: {
    titulo: "A conta do studio sem plano, e com ele",
    itens: [
      { valor: "R$ 2.800", rotulo: "por ano, em média, é o que um studio de temporada gasta com manutenção sem plano" },
      { valor: "R$ 4.700", rotulo: "é o que a conta passa em 1 a cada 10 anos, sem plano" },
      { valor: "R$ 2.400", rotulo: "por ano com o plano: R$ 200 por mês, fixos" },
    ],
    nota:
      "Estimativa da Bewild para um studio de temporada em São Paulo, feita por simulação com preços de mercado de 2026 e premissas de frequência de defeitos, incluindo diárias perdidas. Não é dado de chamados reais: o custo de cada studio varia com a idade e o uso.",
  },
  whatsappTexto:
    "Olá! Quero saber mais sobre o Plano Studio Protegido, a manutenção preventiva do meu studio.",
} as const;

export const SERVICOS: { nome: string; path: string; texto: string }[] = [
  {
    nome: "Reforma de apartamento em São Paulo",
    path: "/reforma-de-apartamento-sao-paulo",
    texto:
      "Reforma completa de apartamentos e studios de até 140 m², com foco em studios e apartamentos pequenos: projeto 3D, obra, marcenaria e mobília em um único contrato.",
  },
  {
    nome: "Reforma de studio em São Paulo",
    path: "/reforma-de-studio-sao-paulo",
    texto:
      "Studio entregue pronto para morar ou anunciar, para locação por temporada (short stay) ou de longa duração.",
  },
  {
    nome: "Manutenção preventiva em São Paulo",
    path: "/manutencao-preventiva-sao-paulo",
    texto: MANUTENCAO.resumo,
  },
  {
    nome: "Marcenaria sob medida",
    path: "/marcenaria",
    texto:
      "Móveis planejados desenhados no projeto e fabricados pela Bewild: MDF certificado, estruturas em 25 mm e 5 anos de garantia.",
  },
];


export const FAQ: { q: string; a: string }[] = [
  {
    q: "O que a Bewild entrega em uma reforma?",
    a: "Arquitetura, engenharia e obra sob um único contrato: consultoria, projeto 3D, projeto executivo, documentação, obra com equipe própria, marcenaria, compra de material e mobília, e entrega das chaves com vistoria de engenheiro.",
  },
  {
    q: "O preço pode aumentar durante a obra?",
    a: "O valor do contrato é o valor final. Se a obra custar mais do que o combinado, a diferença é por conta da Bewild. Aditivo só existe se você mudar o escopo, e só com a sua aprovação.",
  },
  {
    q: "Quem cuida da documentação e da liberação no condomínio?",
    a: "A Bewild. RRT no CAU e liberação no condomínio ficam por nossa conta, para você não virar despachante.",
  },
  {
    q: "Posso contratar só a marcenaria?",
    a: "A marcenaria é desenhada no projeto e entregue dentro do mesmo contrato da reforma. Para outros formatos, peça um orçamento e conte o que você precisa.",
  },
  {
    q: "Moro fora de São Paulo. Consigo reformar?",
    a: "Sim. Você acompanha cronograma, fotos e relatório semanal pelo Bwild Workflow, e a vistoria de entrega pode ser feita por procuração.",
  },
  {
    q: "Qual é a garantia?",
    a: "São 5 anos de garantia de obra e marcenaria, além de 2 chamados de emergência por semestre, atendidos em até 4 horas.",
  },
  {
    q: "O que é o Plano Studio Protegido?",
    a: `É o plano de manutenção preventiva da Bewild para studios em São Paulo, por ${MANUTENCAO.precoTexto}. São 4 visitas preventivas por ano, uma por trimestre, com revisão de ar-condicionado, elétrica, hidráulica e vedações, e a mão de obra dos reparos já está incluída. Peças e material são cobrados à parte, sempre com orçamento antes.`,
  },
  {
    q: "O plano de manutenção tem fidelidade ou carência?",
    a: "Não tem fidelidade. Há carência de 30 dias para chamados de conserto, e a visita preventiva vale desde o primeiro dia. Problema que já existia na data da assinatura é orçado à parte.",
  },
];

export const SERVICOS_JSONLD: Array<Record<string, unknown>> = [
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `https://bewild.com.br${CANONICAL}#service`,
    // name = H1 da página; description = texto de abertura visível.
    name: "Arquitetura, engenharia e obra sob a mesma responsabilidade. Um contrato, com preço, prazo e garantia por escrito.",
    serviceType: "Reforma de apartamento",
    description: ESCOPO_FRASE,
    provider: { "@id": "https://bewild.com.br/#org" },
    areaServed: { "@type": "City", name: "São Paulo" },
    url: `https://bewild.com.br${CANONICAL}`,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Serviços Bewild",
      itemListElement: [
        ...SERVICOS.map((s) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: s.nome,
            url: `https://bewild.com.br${s.path}`,
          },
        })),
        {
          "@type": "Offer",
          price: MANUTENCAO.precoMensal,
          priceCurrency: "BRL",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: MANUTENCAO.precoMensal,
            priceCurrency: "BRL",
            unitCode: "MON",
          },
          itemOffered: {
            "@type": "Service",
            name: MANUTENCAO.nome,
            serviceType: "Manutenção preventiva de ar-condicionado, elétrica e hidráulica",
            description: MANUTENCAO.resumo,
            areaServed: { "@type": "City", name: "São Paulo" },
            url: `https://bewild.com.br${CANONICAL}#manutencao`,
          },
        },
      ],
    },
  },
  faqJsonLd(FAQ),
];
