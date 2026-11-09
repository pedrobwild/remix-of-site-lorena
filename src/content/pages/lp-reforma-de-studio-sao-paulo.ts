/**
 * Conteúdo de /lp/reforma-de-studio-sao-paulo — página de destino dos
 * anúncios do Google para "reforma de studio em São Paulo" (handoff de
 * 02/11/2026, opção 1a: formulário no topo). Módulo sem componentes nem CSS,
 * como os outros de src/content/pages.
 *
 * A página orgânica /reforma-de-studio-sao-paulo continua intacta (preço,
 * FAQ, bairros, links internos): esta LP é `noindex`, fica fora do sitemap e
 * só recebe tráfego pago. Números de prova vêm de src/content/provas.ts e
 * src/content/baseCusto.ts — nenhum escrito à mão aqui.
 */
import type { TopoVariante } from "@/lib/googleAdsVariant";
import { HOME_SLIDES, type HomeSlideName } from "@/content/homeSlides";
import { CLIENTES_FORA_DA_CAPITAL_PCT, CONTRATOS_ANALISADOS, PROVA_REFORMAS, REFORMAS_ENTREGUES } from "@/content/provas";
import { CUSTO_M2_MEDIANO, ORCAMENTO_MEDIANO, STUDIO_TABELA_VIGENTE } from "@/content/baseCusto";
import { HERO_STUDIO, type HeroStudio } from "@/content/pages/reforma-de-studio-sao-paulo";

export { LP_PATH, LP_TITLE, LP_DESCRIPTION } from "@/content/pages/lp-reforma-de-studio-sao-paulo.seo";

/** Variantes com topo próprio na LP; qualquer outra cai em `investidor`. */
export type LpVariante = "investidor" | "planta" | "custo";

/**
 * Topo por variante (handoff, "Copy do topo por variante"). `investidor` e
 * `planta` são os mesmos da página orgânica; `custo` tira a última frase
 * ("a faixa por metragem está logo abaixo"), porque a LP não tem tabela.
 */
export const LP_HERO: Record<LpVariante, HeroStudio> = {
  investidor: HERO_STUDIO.investidor,
  planta: HERO_STUDIO.planta,
  custo: {
    h1: HERO_STUDIO.custo.h1,
    destaque: HERO_STUDIO.custo.destaque,
    lead: `É a mediana de ${CONTRATOS_ANALISADOS} contratos de reforma completa da Bewild em unidades de até 50 m² (${ORCAMENTO_MEDIANO} por reforma), com projeto, obra, marcenaria, mobília e eletros num contrato de preço fechado.`,
  },
};

/** A LP não tem topo "padrão": todo anúncio fala com o investidor (26/10/2026). */
export function lpVarianteDaBusca(variante: TopoVariante): LpVariante {
  return variante === "planta" || variante === "custo" ? variante : "investidor";
}

/** Grade de 4 números do hero (provas do handoff, seção 1). `sufixo` sai menor. */
export const LP_NUMEROS: ReadonlyArray<{ valor: string; sufixo?: string; legenda: string }> = [
  { valor: `+${REFORMAS_ENTREGUES}`, legenda: "reformas entregues em São Paulo" },
  { valor: CUSTO_M2_MEDIANO, sufixo: "/m²", legenda: `mediana de ${CONTRATOS_ANALISADOS} contratos de reforma completa` },
  { valor: `${CLIENTES_FORA_DA_CAPITAL_PCT}%`, legenda: "dos clientes moram fora da capital" },
  { valor: String(STUDIO_TABELA_VIGENTE.prazo.diasUteisMax), sufixo: " dias úteis", legenda: `de obra para studio de até ${STUDIO_TABELA_VIGENTE.prazo.areaMaxM2} m², com a data no contrato` },
];

/** Faixa de provas em linha: reformas entregues · custo/m² · % fora de SP · garantia. */
export const LP_PROVA_INLINE = `${PROVA_REFORMAS} · ${CUSTO_M2_MEDIANO}/m² · ${CLIENTES_FORA_DA_CAPITAL_PCT}% fora de SP · 5 anos de garantia`;

export type LpFoto = {
  slide: HomeSlideName;
  /** Legenda curta sobreposta ("Studio Pinheiros · 28 m²"). */
  legenda: string;
  alt: string;
};

/**
 * Fotos já publicadas na home (src/assets/home-slides). As legendas com
 * bairro e metragem são as que a home publica na vitrine de projetos
 * (02/11/2026); onde a home não publica bairro/metragem, a legenda fica sem
 * número — conferir com o portfólio antes de completar (handoff, seção 1).
 */
export const LP_FOTO_HERO: LpFoto = {
  slide: "studio-tijolo",
  legenda: "Studio · entregue pronto para anunciar",
  alt: "Studio compacto reformado pela Bewild, com parede de tijolinhos clara, cabeceira de madeira e luminárias de luz quente",
};

export const LP_FOTOS: readonly LpFoto[] = [
  { slide: "marcos-10-4", legenda: "Studio Pinheiros · 28 m²", alt: "Studio em Pinheiros com cama, mesa redonda, parede de tijolinhos e varanda ao fundo" },
  { slide: "rodrigo-8", legenda: "Studio Vila Olímpia · 24 m²", alt: "Studio na Vila Olímpia com sala integrada, painel de mármore escuro e marcenaria iluminada" },
  { slide: "premium-7-4", legenda: "Studio Brooklin · 32 m²", alt: "Studio no Brooklin com quarto, janelas amplas, cortinas claras e bancada de trabalho" },
  { slide: "marcos-6-2", legenda: "Studio Vila Olímpia · short stay", alt: "Quarto de studio com painel de madeira iluminado e cortina clara" },
  { slide: "studio-tijolo", legenda: "Studio · short stay", alt: "Studio com parede de tijolinhos clara, remos decorativos sobre a cama e cabeceira de madeira" },
  { slide: "rodrigo-1", legenda: "Apartamento · moradia", alt: "Sala de jantar integrada reformada pela Bewild, com mesa de madeira maciça, parede de pedra e marcenaria iluminada" },
];

export const lpSlide = (nome: HomeSlideName) => HOME_SLIDES[nome];

/** "O que entra no preço fechado" — os 6 itens do contrato da página orgânica. */
export const LP_CONTRATO: ReadonlyArray<{ n: string; t: string }> = [
  { n: "01", t: "Projeto aprovado em 3D antes da obra" },
  { n: "02", t: "Preço fechado — se a obra custar mais do que o combinado, a diferença é por nossa conta" },
  { n: "03", t: "Prazo em contrato — você sabe a data de entrega na assinatura" },
  { n: "04", t: "Time e marcenaria próprios" },
  { n: "05", t: "Mobília, eletros e entrega das chaves com vistoria de engenheiro" },
  { n: "06", t: "Bwild Workflow e 5 anos de garantia" },
];

/** Bloco navy "A reforma começa antes das chaves" (4 itens, handoff 1a). */
export const LP_PLANTA_ITENS: ReadonlyArray<{ n: string; t: string }> = [
  { n: "01", t: "Vistoria de entrega por procuração" },
  { n: "02", t: "Ligação de energia e instalação de internet" },
  { n: "03", t: "Atendimento de emergências durante a obra" },
  { n: "04", t: "Acompanhamento de tudo pelo Bwild Workflow" },
];

/** Promessa acima do formulário e microcopy de sucesso (handoff, seção 2). */
export const LP_FORM_PROMESSA = "Retorno em até 1 dia útil, pelo WhatsApp. Sem visita obrigatória para a primeira conversa.";
export const LP_FORM_SUCESSO = "Um arquiteto da Bewild chama você no WhatsApp em até 1 dia útil com as primeiras perguntas sobre o studio.";
