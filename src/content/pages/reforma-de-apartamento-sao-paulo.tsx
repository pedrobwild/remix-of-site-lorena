/**
 * Dados e JSON-LD de /reforma-de-apartamento-sao-paulo — módulo sem componentes nem CSS.
 *
 * O `head()` da rota (src/routes/reforma-de-apartamento-sao-paulo.tsx) precisa do JSON-LD de forma
 * síncrona e fica no grafo carregado em TODA página (routeTree). Enquanto a
 * constante morava em src/pages/ReformaApartamentoSpPage.tsx, o CSS e os componentes da
 * página inteira iam junto para todas as rotas (auditoria de SEO 06/10/2026,
 * item 3: 9–11 folhas de estilo bloqueantes por página).
 */
import type { ReactNode } from "react";
import { faqJsonLd } from "@/lib/useSeo";

export const CANONICAL = "/reforma-de-apartamento-sao-paulo";

export const FAQ: { q: string; a: string; node?: ReactNode }[] = [
  {
    q: "Vocês reformam apartamentos de qualquer tamanho?",
    a: "Sim: studios e apartamentos de qualquer metragem em São Paulo capital, e também escritórios. O escopo e a proposta são definidos após a leitura do imóvel.",
  },
  {
    q: "Quanto tempo demora?",
    a: "A referência é cerca de 60 dias úteis de obra. A data exata sai no contrato.",
    node: (
      <>
        A referência é cerca de 60 dias úteis de obra. A data exata sai no
        contrato — veja o detalhamento em{" "}
        <a href="/conteudos/quanto-tempo-demora-reforma-apartamento">
          quanto tempo demora uma reforma de apartamento
        </a>
        .
      </>
    ),
  },
  {
    q: "O preço pode mudar durante a obra?",
    a: "Só se você mudar o escopo, e você aprova antes. Sem mudança de escopo, a diferença é por nossa conta.",
    node: (
      <>
        Só se você mudar o escopo, e você aprova antes. Sem mudança de escopo, a
        diferença é por nossa conta. Para comparar propostas, veja{" "}
        <a href="/conteudos/como-comparar-orcamentos-de-reforma">
          como comparar orçamentos de reforma
        </a>
        .
      </>
    ),
  },
  {
    q: "Moro em outra cidade, consigo reformar?",
    a: "Sim. Vistoria por procuração, energia, internet e emergências ficam com a Bewild, e você acompanha tudo pelo Bwild Workflow.",
  },
  {
    q: "Vocês fazem só reforma completa?",
    a: "O modelo é reforma completa: projeto, obra, marcenaria e mobília em um contrato.",
  },
  {
    q: "Que garantia eu tenho?",
    a: "5 anos de garantia sobre a mão de obra, em termo contratual, mais manutenção preventiva e chamados de emergência conforme o contrato.",
  },
];

export const APARTAMENTO_SP_JSONLD: Array<Record<string, unknown>> = [
  {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Reforma de apartamento em São Paulo",
    alternateName: "Empresa de reforma de apartamento em São Paulo",
    serviceType: "Reforma de apartamento",
    description:
      "Reforma completa de apartamentos e studios em São Paulo: projeto aprovado em 3D, obra, marcenaria e mobília em um único contrato, com preço fechado, prazo em contrato e 5 anos de garantia sobre a mão de obra.",
    provider: { "@id": "https://bewild.com.br/#org" },
    areaServed: {
      "@type": "City",
      name: "São Paulo",
      containedInPlace: { "@type": "State", name: "São Paulo" },
    },
    url: `https://bewild.com.br${CANONICAL}`,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Escopo da reforma",
      itemListElement: [
        "Projeto aprovado em 3D antes da obra",
        "Obra com preço fechado e prazo em contrato",
        "Marcenaria, mobília e eletrodomésticos",
        "Vistoria e entrega das chaves",
      ].map((item) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: item },
      })),
    },
  },
  faqJsonLd(FAQ.map((f) => ({ q: f.q, a: f.a }))),
];
