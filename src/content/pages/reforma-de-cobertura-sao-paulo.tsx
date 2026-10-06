/**
 * Dados e JSON-LD de /reforma-de-cobertura-sao-paulo — módulo sem componentes nem CSS.
 *
 * O `head()` da rota (src/routes/reforma-de-cobertura-sao-paulo.tsx) precisa do JSON-LD de forma
 * síncrona e fica no grafo carregado em TODA página (routeTree). Enquanto a
 * constante morava em src/pages/ReformaCoberturaSpPage.tsx, o CSS e os componentes da
 * página inteira iam junto para todas as rotas (auditoria de SEO 06/10/2026,
 * item 3: 9–11 folhas de estilo bloqueantes por página).
 */
import type { ReactNode } from "react";
import { faqJsonLd } from "@/lib/useSeo";

export const CANONICAL = "/reforma-de-cobertura-sao-paulo";

export const FAQ: { q: string; a: string; node?: ReactNode }[] = [
  {
    q: "Vocês reformam coberturas duplex e com terraço?",
    a: "Sim. O projeto considera os dois pavimentos, a área externa, a impermeabilização e as regras do condomínio antes de qualquer demolição.",
  },
  {
    q: "O terraço e a área externa entram no escopo?",
    a: "Entram, quando você quiser: piso, impermeabilização, churrasqueira, iluminação e marcenaria para a área externa fazem parte do projeto e do contrato.",
  },
  {
    q: "Quanto tempo demora a reforma de uma cobertura?",
    a: "Depende da metragem e do escopo — coberturas costumam levar mais do que os 60 dias úteis de referência de um studio. A data exata sai em contrato.",
    node: (
      <>
        Depende da metragem e do escopo — coberturas costumam levar mais do que
        os 60 dias úteis de referência de um studio, e a data exata sai em
        contrato. Os fatores que movem o prazo estão em{" "}
        <a href="/conteudos/quanto-tempo-demora-reforma-apartamento">
          quanto tempo demora uma reforma de apartamento
        </a>
        .
      </>
    ),
  },
  {
    q: "A obra em cobertura precisa de autorização do condomínio?",
    a: "Sim, como em qualquer apartamento — e em coberturas o síndico costuma olhar com mais atenção para fachada, área externa e horários. A Bewild prepara a documentação técnica exigida.",
    node: (
      <>
        Sim, como em qualquer apartamento — e em coberturas o síndico costuma
        olhar com mais atenção para fachada, área externa e horários. A Bewild
        prepara a documentação técnica exigida; o passo a passo está em{" "}
        <a href="/autorizacao-condominio">
          autorização de obra em condomínio
        </a>
        .
      </>
    ),
  },
  {
    q: "O preço pode mudar durante a obra?",
    a: "Só se você mudar o escopo, e você aprova antes. Sem mudança de escopo, a diferença é por nossa conta.",
  },
  {
    q: "Moro em outra cidade, consigo reformar?",
    a: "Sim. Vistoria por procuração, energia, internet e emergências ficam com a Bewild, e você acompanha tudo pelo Bwild Workflow.",
  },
];

export const COBERTURA_SP_JSONLD: Array<Record<string, unknown>> = [
  {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Reforma completa de coberturas em São Paulo",
    alternateName: "Reforma de cobertura em SP",
    serviceType: "Reforma de apartamento",
    description:
      "Projeto 3D, obra, área externa e terraço, marcenaria sob medida, mobília e entrega das chaves em um único contrato, com preço fechado e prazo em contrato.",
    provider: { "@id": "https://bewild.com.br/#org" },
    areaServed: { "@type": "City", name: "São Paulo" },
    url: `https://bewild.com.br${CANONICAL}`,
  },
  faqJsonLd(FAQ.map((f) => ({ q: f.q, a: f.a }))),
];
