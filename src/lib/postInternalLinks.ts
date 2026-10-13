/**
 * Links internos por post de /conteudos.
 *
 * Objetivo de SEO: cada artigo precisa apontar para as páginas de destino
 * (serviço, orçamento, portfólio, guias) com texto-âncora descritivo.
 * Isso dá ao Google caminhos de rastreamento a partir de qualquer artigo e
 * reforça o tema de cada destino ("reforma de studio em São Paulo",
 * "reforma de apartamento em São Paulo", "short stay", "NBR 16280").
 *
 * Regra: só links que fazem sentido para o assunto do texto — link forçado
 * não ajuda ninguém e dilui o sinal.
 *
 * Uma palavra-chave, um destino (análise de palavras-chave de 11/10/2026):
 *  - "reforma de studio" → /reforma-de-studio-sao-paulo. Os artigos de studio
 *    (a maioria da categoria "reforma") mostravam só as páginas de
 *    apartamento e de cobertura; a de studio ficava de fora.
 *  - "short stay" → /conteudos/o-que-e-short-stay. Só um artigo citava o
 *    pilar no corpo do texto.
 *  - "NBR 16280" → o artigo da norma; /autorizacao-condominio fica com
 *    "autorização de reforma em condomínio".
 */
import type { BewildPostCategory } from "@/lib/useBewildPosts";

export type InternalLink = {
  href: string;
  label: string;
  description: string;
};

const L = {
  orcamento: {
    href: "/orcamento",
    label: "Orçamento de reforma de apartamento em SP",
    description: "Preço e prazo fechados em contrato, sem aditivo surpresa.",
  },
  portfolio: {
    href: "/portfolio",
    label: "Portfólio de reformas em SP",
    description: "Projetos entregues, com metragem, bairro e finalidade.",
  },
  conteudos: {
    href: "/conteudos",
    label: "Guias de custo de reforma",
    description: "Custos, etapas e prazos de reforma de apartamento em São Paulo.",
  },
  autorizacao: {
    href: "/autorizacao-condominio",
    label: "Autorização de reforma em condomínio",
    description: "Documentos, prazo de aprovação e o que o síndico costuma exigir.",
  },
  comoFunciona: {
    href: "/como-funciona",
    label: "Como funciona a reforma turn-key",
    description: "Do briefing à entrega, etapa por etapa.",
  },
  ondeAtuamos: {
    href: "/onde-atuamos",
    label: "Bairros de São Paulo atendidos",
    description: "Onde a Bewild executa reforma de apartamento e studio.",
  },
  faq: {
    href: "/faq",
    label: "Dúvidas frequentes sobre reforma",
    description: "Prazo, garantia, pagamento e obra à distância.",
  },
  reformaApartamentoSp: {
    href: "/reforma-de-apartamento-sao-paulo",
    label: "Reforma de apartamento em São Paulo",
    description: "Projeto, obra, marcenaria e mobília em um único contrato.",
  },
  reformaStudioSp: {
    href: "/reforma-de-studio-sao-paulo",
    label: "Reforma de studio em São Paulo",
    description: "Studio entregue pronto para morar ou para anunciar.",
  },
  reformaCoberturaSp: {
    href: "/reforma-de-cobertura-sao-paulo",
    label: "Reforma de cobertura em São Paulo",
    description: "Cobertura entregue pronta para morar, do terraço à marcenaria.",
  },
  marcenaria: {
    href: "/marcenaria",
    label: "Marcenaria sob medida em São Paulo",
    description: "Fábrica própria, MDF certificado e 5 anos de garantia.",
  },
  shortStay: {
    href: "/conteudos/o-que-e-short-stay",
    label: "Short stay: o que é, regras e quanto rende",
    description: "Locação por temporada em São Paulo e o que o studio precisa ter.",
  },
  guiaInvestidor: {
    href: "https://radar.bewild.com.br/",
    label: "Radar Bewild: guia do investidor em studios para short stay",
    description: "Guia de decisão para investir em studio de short stay em São Paulo.",
  },
  nbr16280: {
    href: "/conteudos/nbr-16280-reforma-studio-condominio",
    label: "NBR 16280: o que o condomínio exige na reforma",
    description: "Plano de reforma, ART ou RRT e o que o síndico pode pedir.",
  },
} satisfies Record<string, InternalLink>;

/** Artigos de reforma: as duas páginas de serviço primeiro, depois o caminho de compra. */
const REFORMA: InternalLink[] = [
  L.reformaApartamentoSp,
  L.reformaStudioSp,
  L.orcamento,
  L.portfolio,
  L.marcenaria,
  L.autorizacao,
  L.comoFunciona,
  L.reformaCoberturaSp,
  L.conteudos,
];

/** Artigos de short stay (investimento, mercado, operação): studio + pilar + guia. */
const SHORT_STAY: InternalLink[] = [
  L.reformaStudioSp,
  L.shortStay,
  L.guiaInvestidor,
  L.orcamento,
  L.portfolio,
  L.ondeAtuamos,
  L.comoFunciona,
  L.faq,
];

const BY_CATEGORY: Record<BewildPostCategory, InternalLink[]> = {
  reforma: REFORMA,
  investimento: SHORT_STAY,
  mercado: SHORT_STAY,
  operacao: SHORT_STAY,
  fiscal: [L.shortStay, L.guiaInvestidor, L.reformaStudioSp, L.orcamento, L.portfolio, L.faq],
};

const FALLBACK: InternalLink[] = [
  L.orcamento,
  L.portfolio,
  L.conteudos,
  L.autorizacao,
  L.comoFunciona,
  L.faq,
];

/** Assunto lido do slug: decide quais destinos sobem para o começo da lista. */
const TEMA = {
  condominio: /condominio|sindico|nbr|varanda/,
  studio: /studio/,
  apartamento: /apartamento/,
  shortStay: /short-stay|airbnb/,
};

const MAX_LINKS = 6;

/** Links internos priorizados para o post (o assunto do slug vem antes da categoria). */
export function internalLinksForPost(
  slug: string,
  category?: BewildPostCategory | null,
): InternalLink[] {
  const studio = TEMA.studio.test(slug);
  const apartamento = TEMA.apartamento.test(slug);
  const shortStay = TEMA.shortStay.test(slug);

  // Artigo só de apartamento (ex.: financiamento da reforma) é de reforma,
  // mesmo quando a categoria no painel é "investimento".
  const reforma = category === "reforma" || (apartamento && !studio && !shortStay);
  const base = reforma ? REFORMA : category ? (BY_CATEGORY[category] ?? FALLBACK) : FALLBACK;

  const lead: InternalLink[] = [];
  // Condomínio e obra: a norma (artigo) e a página de autorização, nessa ordem.
  if (TEMA.condominio.test(slug)) lead.push(L.nbr16280, L.autorizacao);
  // A página de serviço do imóvel de que o artigo trata vem primeiro.
  if (studio && apartamento) {
    const [first, second] =
      slug.indexOf("apartamento") < slug.indexOf("studio")
        ? [L.reformaApartamentoSp, L.reformaStudioSp]
        : [L.reformaStudioSp, L.reformaApartamentoSp];
    lead.push(first, second);
  } else if (studio) lead.push(L.reformaStudioSp);
  else if (apartamento) lead.push(L.reformaApartamentoSp);
  if (shortStay) lead.push(L.shortStay);

  const self = `/conteudos/${slug}`;
  const seen = new Set<string>([self]);
  return [...lead, ...base]
    .filter((l) => (seen.has(l.href) ? false : (seen.add(l.href), true)))
    .slice(0, MAX_LINKS);
}
