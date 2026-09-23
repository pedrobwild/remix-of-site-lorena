/**
 * Links internos por post de /conteudos.
 *
 * Objetivo de SEO: cada artigo precisa apontar para as páginas de destino
 * (orçamento, portfólio, guias, autorização) com texto-âncora descritivo.
 * Isso dá ao Google caminhos de rastreamento a partir de qualquer artigo e
 * reforça o tema de cada destino ("reforma de apartamento em SP",
 * "custo de reforma", "autorização de reforma condomínio").
 *
 * Regra: só links que fazem sentido para o assunto do texto — link forçado
 * não ajuda ninguém e dilui o sinal.
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
    description: "NBR 16280, documentos e o que o síndico costuma exigir.",
  },
  comoFunciona: {
    href: "/como-funciona",
    label: "Como funciona a reforma turn-key",
    description: "Do diagnóstico à entrega, etapa por etapa.",
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
  diagnostico: {
    href: "/orcamento",
    label: "Diagnóstico gratuito do seu imóvel",
    description: "Leitura inicial de escopo, prazo e investimento.",
  },
} satisfies Record<string, InternalLink>;

const BY_CATEGORY: Record<BewildPostCategory, InternalLink[]> = {
  reforma: [L.reformaApartamentoSp, L.reformaCoberturaSp, L.orcamento, L.portfolio, L.conteudos, L.autorizacao, L.comoFunciona],
  investimento: [L.reformaStudioSp, L.orcamento, L.portfolio, L.conteudos, L.ondeAtuamos, L.comoFunciona, L.faq],
  mercado: [L.reformaStudioSp, L.portfolio, L.ondeAtuamos, L.conteudos, L.orcamento, L.comoFunciona, L.faq],
  operacao: [L.reformaStudioSp, L.portfolio, L.conteudos, L.orcamento, L.ondeAtuamos, L.comoFunciona, L.faq],
  fiscal: [L.conteudos, L.orcamento, L.portfolio, L.autorizacao, L.comoFunciona, L.faq],
};

const FALLBACK: InternalLink[] = [
  L.orcamento,
  L.portfolio,
  L.conteudos,
  L.autorizacao,
  L.comoFunciona,
  L.faq,
];

/** Links internos priorizados para o post (slug tem precedência sobre categoria). */
export function internalLinksForPost(
  slug: string,
  category?: BewildPostCategory | null,
): InternalLink[] {
  const base = category ? (BY_CATEGORY[category] ?? FALLBACK) : FALLBACK;
  // Artigos sobre condomínio/obra sempre apontam para a página de autorização.
  const condominio = /condominio|sindico|nbr|varanda/.test(slug);
  const list = condominio ? [L.autorizacao, ...base] : base;
  const seen = new Set<string>();
  return list.filter((l) => (seen.has(l.href) ? false : (seen.add(l.href), true))).slice(0, 6);
}
