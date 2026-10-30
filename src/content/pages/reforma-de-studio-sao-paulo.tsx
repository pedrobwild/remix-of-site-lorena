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
import { CLIENTES_SHORT_STAY_PCT, CONTRATOS_ANALISADOS } from "@/content/provas";
import { CUSTO_M2_MEDIANO, ORCAMENTO_MEDIANO } from "@/content/baseCusto";

export const CANONICAL = "/reforma-de-studio-sao-paulo";

/**
 * Título e descrição da página, iguais no `head()` da rota (HTML do servidor)
 * e no `useSeo` da página. Mantém a divisão de 11/10/2026: serviço no
 * singular, plural com a home. Em 26/10/2026 ganhou referência de preço.
 */
/** Resposta do prazo: mesmo texto na página e no FAQPage. */
const PRAZO_STUDIO = "A referência é cerca de 60 dias úteis de obra. A data exata sai no contrato.";

export const SEO_TITLE = "Reforma de studio em São Paulo: preço e prazo em contrato";
export const SEO_DESCRIPTION =
  `Reforma completa de studio e apartamento pequeno em SP: projeto, obra, marcenaria e mobília num contrato. Mediana de ${CUSTO_M2_MEDIANO}/m² em ${CONTRATOS_ANALISADOS} contratos.`;
export const SEO_KEYWORDS =
  "reforma de studio em São Paulo, reforma de studio SP, reforma de apartamento compacto em São Paulo, reforma de apartamento pequeno em SP, reforma de kitnet em São Paulo, reforma de studio para Airbnb em SP";

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
    a: PRAZO_STUDIO,
    node: (
      <>
        {PRAZO_STUDIO} Data a data em{" "}
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
    a: `Nos ${CONTRATOS_ANALISADOS} contratos de reforma completa de até 50 m² analisados pela Bewild, a mediana foi ${ORCAMENTO_MEDIANO} (${CUSTO_M2_MEDIANO} por m²), com projeto, obra, marcenaria, mobiliário e eletrodomésticos. Para short stay, o enxoval e os eletros entram no escopo; o que mais muda o valor é a metragem e o padrão de acabamento.`,
    node: (
      <>
        Nos {CONTRATOS_ANALISADOS} contratos de reforma completa de até 50 m² analisados pela Bewild, a mediana
        foi {ORCAMENTO_MEDIANO} ({CUSTO_M2_MEDIANO} por m²), com projeto, obra, marcenaria, mobiliário e
        eletrodomésticos. A análise completa está em{" "}
        <a href="/conteudos/quanto-custa-reformar-apartamento-studio-ate-50-m2">
          quanto custa reformar um apartamento ou studio de até 50 m²
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
  {
    q: "A Bewild faz o projeto de arquitetura ou só a obra?",
    a: "As duas coisas, no mesmo contrato: arquitetura, engenharia e empreita sob a mesma responsabilidade. Quem projeta responde pela obra, e o preço fechado vale para os dois.",
  },
];

export const STUDIO_SP_JSONLD: Array<Record<string, unknown>> = [
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `https://bewild.com.br${CANONICAL}#service`,
    // name = H1 da página; description = texto de abertura visível (sem contagens).
    name: "Reforma de studio em São Paulo, entregue pronto para alugar, anunciar no Airbnb ou morar.",
    alternateName: "Reforma completa de studios em São Paulo",
    serviceType: "Reforma de studio",
    description:
      "A Bewild é uma empresa de arquitetura e reforma especializada em studios e apartamentos pequenos em São Paulo, para locação (short stay e longa duração) ou para morar. Projeto, obra, marcenaria sob medida e mobília em um único contrato, com preço fechado, prazo em contrato e 5 anos de garantia.",
    provider: { "@id": "https://bewild.com.br/#org" },
    areaServed: { "@type": "City", name: "São Paulo" },
    url: `https://bewild.com.br${CANONICAL}`,
  },
  faqJsonLd(FAQ.map((f) => ({ q: f.q, a: f.a }))),
];

/**
 * Topo da página por intenção de busca (anúncios do Google). A variante sai
 * de `topoVarianteDaBusca` (palavra-chave → anúncio → campanha), a mesma
 * regra do /orcamento. Só muda o H1 e o primeiro parágrafo: título, descrição,
 * canonical e o resto da página são iguais para todo visitante, e quem chega
 * pela busca orgânica (sem utm_*) vê sempre o `padrao`.
 */
export type HeroStudio = { h1: string; destaque: string; lead: string };

const LEAD_PADRAO =
  "A Bewild é uma empresa de arquitetura e reforma especializada em studios e apartamentos pequenos em São Paulo, para locação (short stay e longa duração) ou para morar. Projeto, obra, marcenaria sob medida e mobília em um único contrato, com preço fechado, prazo em contrato e 5 anos de garantia.";

export const HERO_STUDIO: Record<"padrao" | "investidor" | "planta" | "custo", HeroStudio> = {
  padrao: {
    h1: "Reforma de studio em São Paulo,",
    destaque: "entregue pronto para alugar, anunciar no Airbnb ou morar.",
    lead: LEAD_PADRAO,
  },
  investidor: {
    h1: "Reforma de studio em São Paulo,",
    destaque: "entregue pronto para alugar ou anunciar no Airbnb.",
    lead: `Projeto, obra, marcenaria sob medida, mobília e eletros em um único contrato, com preço fechado, prazo em contrato e 5 anos de garantia. ${CLIENTES_SHORT_STAY_PCT}% dos clientes da Bewild reformam para short stay, e a gestão do Airbnb também pode ficar com a Bewild.`,
  },
  planta: {
    h1: "Comprou studio na planta em São Paulo?",
    destaque: "A reforma vai do contrapiso ao inquilino.",
    lead: "A Bewild reforma unidades recém-entregues, no contrapiso: projeto, obra, marcenaria sob medida, mobília e eletros em um único contrato, com preço fechado e 5 anos de garantia. O prazo começa 5 dias úteis depois do projeto aprovado e da autorização do condomínio, e a data de entrega fica escrita no contrato.",
  },
  custo: {
    h1: "Quanto custa a reforma de studio em São Paulo?",
    destaque: `Mediana de ${CUSTO_M2_MEDIANO} por m².`,
    lead: `É a mediana de ${CONTRATOS_ANALISADOS} contratos de reforma completa da Bewild em unidades de até 50 m² (${ORCAMENTO_MEDIANO} por reforma), com projeto, obra, marcenaria, mobília e eletros num contrato de preço fechado. A faixa por metragem está logo abaixo.`,
  },
};

/** Variantes do /orcamento que não têm topo próprio aqui caem no padrão. */
export function heroStudioDaVariante(variante: string): HeroStudio {
  return variante in HERO_STUDIO ? HERO_STUDIO[variante as keyof typeof HERO_STUDIO] : HERO_STUDIO.padrao;
}
