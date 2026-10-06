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

export const SERVICOS: { nome: string; path: string; texto: string }[] = [
  {
    nome: "Reforma de apartamento em São Paulo",
    path: "/reforma-de-apartamento-sao-paulo",
    texto:
      "Reforma completa de apartamentos e studios de qualquer metragem: projeto 3D, obra, marcenaria e mobília em um único contrato.",
  },
  {
    nome: "Reforma de studio em São Paulo",
    path: "/reforma-de-studio-sao-paulo",
    texto:
      "Studio entregue pronto para morar ou anunciar, para locação por temporada (short stay) ou de longa duração.",
  },
  {
    nome: "Reforma de cobertura em São Paulo",
    path: "/reforma-de-cobertura-sao-paulo",
    texto:
      "Reforma de cobertura com terraço e área externa, marcenaria sob medida e mobília, entregue pronta para morar.",
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
    a: "A Bewild. ART, CREA e liberação no condomínio ficam por nossa conta, para você não virar despachante.",
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
];

export const SERVICOS_JSONLD: Array<Record<string, unknown>> = [
  {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Arquitetura, reforma e marcenaria em São Paulo",
    serviceType: "Reforma de apartamento",
    description: DESCRIPTION,
    provider: { "@id": "https://bewild.com.br/#org" },
    areaServed: { "@type": "City", name: "São Paulo" },
    url: `https://bewild.com.br${CANONICAL}`,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Serviços Bewild",
      itemListElement: SERVICOS.map((s) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: s.nome,
          url: `https://bewild.com.br${s.path}`,
        },
      })),
    },
  },
  faqJsonLd(FAQ),
];
