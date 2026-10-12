import { pageSeoOverride, type PagesSeoMap } from "@/lib/publicPages";

/** Textos iniciais das cinco páginas; o painel pode substituí-los por campo. */
export const PAGE_SEO_DEFAULTS = {
  "/portfolio": {
    title: "Portfólio de reformas e projetos em São Paulo | Bewild",
    description: "Conheça os projetos e reformas de studios e apartamentos da Bewild em São Paulo. Veja imagens, metragem e soluções para morar ou alugar.",
  },
  "/conteudos": {
    title: "Guias de reforma de studios e apartamentos | Bewild",
    description: "Leia os guias da Bewild sobre custo, prazo, projeto e etapas da reforma em São Paulo. Conteúdos para preparar seu studio ou apartamento para morar ou alugar.",
  },
  "/servicos": {
    title: "Arquitetura, reforma e marcenaria em SP | Bewild",
    description: "Projeto 3D, engenharia, obra e marcenaria sob medida em um único contrato. Conheça os serviços da Bewild para reformar seu apartamento em São Paulo.",
  },
  "/orcamento": {
    title: "Orçamento de reforma de studio e apartamento em SP | Bewild",
    description: "Peça o orçamento da reforma do seu studio ou apartamento em São Paulo: faixa de investimento em 1 dia útil, projeto 3D, preço fechado e prazo em contrato.",
  },
  "/contato": {
    title: "Contato: arquitetura e reforma em São Paulo | Bewild",
    description: "Fale com a Bewild por WhatsApp, e-mail ou formulário e converse sobre a reforma do seu studio ou apartamento. Escritório no Brooklin, São Paulo-SP.",
  },
} as const;

export type EditablePagePath = keyof typeof PAGE_SEO_DEFAULTS;

export function resolvePageSeo(path: EditablePagePath, map?: PagesSeoMap | null) {
  const defaults = PAGE_SEO_DEFAULTS[path];
  const override = pageSeoOverride(map, path);
  return {
    title: override.title || defaults.title,
    description: override.description || defaults.description,
    ogTitle: override.og_title || override.title || defaults.title,
    ogDescription: override.og_description || override.description || defaults.description,
    ogImage: override.og_image,
  };
}
