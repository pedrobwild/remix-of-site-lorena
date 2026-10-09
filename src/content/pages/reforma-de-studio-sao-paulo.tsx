/**
 * Dados e JSON-LD de /reforma-de-studio-sao-paulo — módulo sem componentes nem CSS.
 *
 * O `head()` da rota (src/routes/reforma-de-studio-sao-paulo.tsx) precisa do JSON-LD de forma
 * síncrona e fica no grafo carregado em TODA página (routeTree). Enquanto a
 * constante morava em src/pages/ReformaStudioSpPage.tsx, o CSS e os componentes da
 * página inteira iam junto para todas as rotas (auditoria de SEO 06/10/2026,
 * item 3: 9–11 folhas de estilo bloqueantes por página).
 */
import type { ReactNode } from "react";
import { faqJsonLd } from "@/lib/useSeo";

export const CANONICAL = "/reforma-de-studio-sao-paulo";

/** Seção "Reforma de studio para Airbnb e short stay" (rodada 3, 06/10/2026). */
export const AIRBNB_CHECK: { n: string; t: string }[] = [
  { n: "01", t: "Cama de casal de qualidade, blackout e isolamento de ruído: a avaliação de sono pesa mais que qualquer acabamento." },
  { n: "02", t: "Ar-condicionado dimensionado pela tabela de BTU e infraestrutura aprovada pelo condomínio." },
  { n: "03", t: "Wi-fi rápido, bancada de trabalho e tomadas onde o hóspede usa: a demanda de semana é de quem trabalha." },
  { n: "04", t: "Cozinha compacta com o que o anúncio promete (micro-ondas, cooktop, frigobar ou geladeira) e enxoval completo." },
  { n: "05", t: "Materiais de limpeza fácil e marcenaria fechada: a faxina entre reservas precisa caber em poucas horas." },
  { n: "06", t: "Iluminação em camadas e paleta pensada para a foto do anúncio, que é o que decide a reserva." },
];

export const FAQ: { q: string; a: string; node?: ReactNode }[] = [
  {
    q: "Vale a pena reformar um studio para Airbnb?",
    a: "Depende de bairro, convenção do condomínio e operação. A Bewild não garante renda nem ocupação.",
    node: (
      <>
        Depende de bairro, convenção do condomínio e operação. A Bewild não
        garante renda nem ocupação — as contas linha a linha estão em{" "}
        <a href="/conteudos/quanto-rende-studio-short-stay-sao-paulo">
          quanto rende um studio no short stay em São Paulo
        </a>
        .
      </>
    ),
  },
  {
    q: "O condomínio pode proibir Airbnb?",
    a: "Pode: a convenção e as decisões em assembleia mandam, e é preciso checar antes de comprar.",
    node: (
      <>
        Pode: a convenção e as decisões em assembleia mandam, e é preciso checar
        antes de comprar. O que a lei permite hoje está em{" "}
        <a href="/conteudos/studios-airbnb-sao-paulo-o-que-a-lei-permite">
          studios e Airbnb em São Paulo: o que a lei permite
        </a>
        .
      </>
    ),
  },
  {
    q: "Quanto tempo demora a reforma de um studio?",
    a: "A referência é cerca de 60 dias úteis de obra. A data exata sai no contrato.",
    node: (
      <>
        A referência é cerca de 60 dias úteis de obra, e a data exata sai no
        contrato. Data a data em{" "}
        <a href="/conteudos/quanto-tempo-demora-reforma-apartamento">
          quanto tempo demora uma reforma de apartamento
        </a>
        .
      </>
    ),
  },
  {
    q: "Comprei na planta e ainda não tenho as chaves, já posso começar?",
    a: "Sim. Projeto e proposta são feitos antes das chaves, para a obra começar assim que o imóvel for entregue.",
    node: (
      <>
        Sim. Projeto e proposta são feitos antes das chaves, para a obra começar
        assim que o imóvel for entregue — o que adiantar está em{" "}
        <a href="/conteudos/comprou-studio-na-planta-antes-das-chaves">
          comprou studio na planta: o que fazer antes das chaves
        </a>
        .
      </>
    ),
  },
  {
    q: "Quanto custa a reforma de um studio para Airbnb?",
    a: "Nos 188 contratos de reforma completa de até 50 m² analisados pela Bewild, a mediana foi R$ 71.850 (R$ 2.744 por m²), com projeto, obra, marcenaria, mobiliário e eletrodomésticos. Para short stay, o enxoval e os eletros entram no escopo; o que mais muda o valor é a metragem e o padrão de acabamento.",
    node: (
      <>
        Nos 188 contratos de reforma completa de até 50 m² analisados pela Bewild, a mediana
        foi R$ 71.850 (R$ 2.744 por m²), com projeto, obra, marcenaria, mobiliário e
        eletrodomésticos. A tabela por metragem está em{" "}
        <a href="/conteudos/quanto-custa-reformar-studio-short-stay-sao-paulo">
          quanto custa reformar um studio para short stay em São Paulo
        </a>
        .
      </>
    ),
  },
  {
    q: "Vocês fazem a gestão do Airbnb?",
    a: "Sim. Além de entregar o studio pronto para anunciar, a Bewild faz a gestão do Airbnb. Se preferir, a operação pode ficar com você ou com quem você escolher, sem exclusividade.",
  },
  {
    q: "Moro fora de São Paulo?",
    a: "Sim, dá para reformar. Vistoria por procuração, energia, internet e emergências ficam com a Bewild, e você acompanha tudo pelo Bwild Workflow.",
  },
];

export const STUDIO_SP_JSONLD: Array<Record<string, unknown>> = [
  {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Reforma completa de studios em São Paulo",
    serviceType: "Reforma de apartamento",
    provider: { "@id": "https://bewild.com.br/#org" },
    areaServed: { "@type": "City", name: "São Paulo" },
    url: `https://bewild.com.br${CANONICAL}`,
  },
  faqJsonLd(FAQ.map((f) => ({ q: f.q, a: f.a }))),
];
