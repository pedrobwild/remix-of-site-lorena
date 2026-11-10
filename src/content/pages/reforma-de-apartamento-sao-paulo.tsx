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
import { brl } from "@/content/baseCusto";
import { FAIXAS_METRAGEM, INDICE_EDICAO } from "@/content/indiceCusto";
import { formatAreaM2 } from "@/lib/formatArea";
import { projectFriendlyName } from "@/lib/projectSeo";
import type { BewildProject } from "@/lib/useBewildProjects";

export const CANONICAL = "/reforma-de-apartamento-sao-paulo";

/** Mesmos textos no HTML do servidor e após a navegação no site (módulo .seo, lido também pelo head()). */
export { SEO_TITLE, SEO_DESCRIPTION } from "./reforma-de-apartamento-sao-paulo.seo";
export const SEO_KEYWORDS =
  "reforma de apartamento em São Paulo, empresa de reforma de apartamento em SP, empresa de reforma de apartamento, reforma de apartamento pequeno em São Paulo, reforma completa de apartamento em São Paulo, projeto e obra de apartamento em SP, reforma de apartamento para alugar em São Paulo";

/**
 * Rodada 4 da auditoria de SEO (09/11/2026, ação 9): "reforma de apartamento
 * pequeno" tem 110 buscas por mês. A seção fala de apartamento de até 50 m²
 * e linka projetos do portfólio nessa faixa; studio e kitnet seguem com a
 * página /reforma-de-studio-sao-paulo, que tem preço e prazo do studio.
 * Custo só do Índice (indiceCusto.ts); nada sobre apartamento antigo (a
 * Bewild não atende imóvel com mais de 15 anos).
 */
export const APARTAMENTO_PEQUENO_AREA_MAX = 50;
const faixa = (nome: string) => FAIXAS_METRAGEM.find((f) => f.faixa === nome)!;
const ATE_20 = faixa("Até 20 m²");
const DE_28_A_32 = faixa("28 a 32 m²");

export const APARTAMENTO_PEQUENO = {
  titulo: "Reforma de apartamento pequeno em São Paulo",
  paragrafos: [
    `Num apartamento de até ${APARTAMENTO_PEQUENO_AREA_MAX} m², erro de layout custa caro: uma porta no lugar errado tira o armário, uma bancada fora de medida tira a mesa. Por isso a Bewild projeta antes de orçar: o estudo de layout define marcenaria, tomadas e pontos de água, e só então sai o orçamento item a item, com preço fechado.`,
    `Metro quadrado pequeno custa mais, porque cozinha, banheiro e marcenaria pesam igual em pouca área. No Índice Bewild de custo de reforma, edição de ${INDICE_EDICAO}, a mediana foi de ${brl(ATE_20.m2Mediano)} por m² nos contratos de até 20 m² e de ${brl(DE_28_A_32.m2Mediano)} por m² nos de 28 a 32 m². A maior parte das obras da Bewild é nessa faixa: studios e apartamentos compactos de 20 a 35 m², recém-entregues, no contrapiso.`,
  ],
  /** Antes do link para a página de studio. */
  studio: "Studio ou kitnet para alugar? O preço por metragem e o prazo do studio estão na",
  studioLink: "reforma de studio em São Paulo",
  projetos: `Projetos de até ${APARTAMENTO_PEQUENO_AREA_MAX} m² no portfólio:`,
} as const;

export type ProjetoPequeno = { slug: string; nome: string; area: string; bairro: string | null };

/**
 * Projetos publicados de até 50 m², com capa, do maior para o menor (os
 * maiores são os apartamentos pequenos; os studios têm a página própria).
 * `null` quando a lista não carregou: a seção mostra só o link do portfólio.
 */
export function projetosApartamentoPequeno(
  projects: ReadonlyArray<Pick<BewildProject, "slug" | "title" | "area_m2" | "neighborhood" | "cover_url">> | null,
  max = 6,
): ProjetoPequeno[] | null {
  if (!projects) return null;
  return projects
    .filter((p) => p.slug && p.cover_url && typeof p.area_m2 === "number" && p.area_m2 > 0 && p.area_m2 <= APARTAMENTO_PEQUENO_AREA_MAX)
    .sort((a, b) => (b.area_m2 as number) - (a.area_m2 as number))
    .slice(0, max)
    .map((p) => ({
      slug: p.slug,
      nome: projectFriendlyName(p) || p.title,
      area: formatAreaM2(p.area_m2) ?? "",
      bairro: p.neighborhood?.trim() || null,
    }));
}

/**
 * "Empresa de reforma de apartamento" (posição 5 a 7): o que pedir por
 * escrito a qualquer empresa, com o que o contrato da Bewild traz. Fatos do
 * site: preço fechado, prazo em contrato (contado a partir do projeto aprovado
 * e da autorização do condomínio; assinado até 140 m²), RRT do responsável
 * técnico (Thiago Dantas, CAU A162437-7, o mesmo do rodapé) e 5 anos de
 * garantia, inclusive marcenaria.
 */
export const EMPRESA_REFORMA = {
  titulo: "O que esperar de uma empresa de reforma de apartamento",
  intro:
    "O risco de uma reforma é a obra que estoura o orçamento, atrasa e fica sem responsável quando aparece o primeiro defeito. Antes de assinar com qualquer empresa de reforma de apartamento, peça estas quatro coisas por escrito; são as que o contrato da Bewild traz:",
  itens: [
    {
      t: "Preço fechado",
      d: "O valor do contrato é o valor final. Se a obra custar mais do que o combinado, a diferença é da empresa; aditivo só existe se você mudar o escopo, e com a sua aprovação por escrito.",
    },
    {
      t: "Prazo em contrato",
      d: "Data de entrega escrita, com multa por dia de atraso. Na Bewild, a contagem começa 5 dias úteis depois do projeto aprovado e da autorização do condomínio, e o prazo vai assinado para apartamentos de até 140 m².",
    },
    {
      t: "Responsável técnico com RRT",
      d: "O plano de reforma da NBR 16280 vai ao síndico antes da obra, com o RRT do responsável técnico. Na Bewild, é o arquiteto e urbanista Thiago Dantas (CAU A162437-7).",
    },
    {
      t: "5 anos de garantia",
      d: "Garantia de obra e marcenaria em termo contratual, com manutenção preventiva e chamados de emergência conforme o contrato.",
    },
  ],
} as const;

export const FAQ: { q: string; a: string; node?: ReactNode }[] = [
  {
    q: "Vocês reformam apartamentos de qualquer tamanho?",
    a: "Sim: studios, apartamentos pequenos e maiores, de qualquer metragem, em São Paulo capital, e também escritórios, desde que recém-entregues ou com até 15 anos de uso. O prazo de obra vai assinado em contrato para apartamentos de até 140 m². O escopo e a proposta são definidos após a leitura do imóvel.",
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
    a: "5 anos de garantia de obra e marcenaria, em termo contratual, mais manutenção preventiva e chamados de emergência conforme o contrato.",
  },
];

export const APARTAMENTO_SP_JSONLD: Array<Record<string, unknown>> = [
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `https://bewild.com.br${CANONICAL}#service`,
    // name = H1 da página; description = texto de abertura visível (sem contagens).
    name: "Empresa de reforma de apartamento em São Paulo. Você não vira gerente de obra.",
    alternateName: "Empresa de reforma de apartamento em São Paulo",
    serviceType: "Reforma de apartamento",
    description:
      "A Bewild é uma empresa de reforma especializada em apartamentos e studios recém-entregues em São Paulo, para alugar, anunciar no Airbnb ou morar, com arquitetura, engenharia e empreita sob a mesma responsabilidade. Entregamos projeto, obra, marcenaria e mobília em um único contrato, com preço fechado antes de a obra começar, prazo em contrato e 5 anos de garantia.",
    provider: { "@id": "https://bewild.com.br/#org" },
    areaServed: { "@type": "City", name: "São Paulo" },
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
