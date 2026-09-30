import { neighborhoodSlug } from "@/lib/portfolioFilter";
import { routes } from "@/lib/useHashRoute";

/**
 * Bairros de São Paulo com obras entregues e itens inclusos na reforma à
 * distância. Compartilhado por /onde-atuamos e pelas páginas de serviço
 * (/reforma-de-apartamento-sao-paulo e /reforma-de-studio-sao-paulo) para
 * não duplicar a mesma lista em três arquivos.
 *
 * Bairros reais com projetos publicados no portfólio (consulta ao banco em
 * set/2026). "São Paulo" genérico e grafias duplicadas ficam de fora.
 */
export const BAIRROS: string[] = [
  "Alto da Boa Vista",
  "Avenida Paulista",
  "Barra Funda",
  "Bela Vista",
  "Brooklin",
  "Butantã",
  "Campo Belo",
  "Cerqueira César",
  "Chácara Klabin",
  "Cidade Jardim",
  "Consolação",
  "Higienópolis",
  "Ibirapuera",
  "Indianópolis",
  "Ipiranga",
  "Itaim Bibi",
  "Jardim Paulista",
  "Liberdade",
  "Moema",
  "Paraíso",
  "Perdizes",
  "Pinheiros",
  "República",
  "Santo Amaro",
  "Vila Buarque",
  "Vila Clementino",
  "Vila Madalena",
  "Vila Mariana",
  "Vila Nova Conceição",
  "Vila Olímpia",
];

/** Página de bairro conhecida pelo servidor (mesma regra `neighborhoodPages` do sitemap). */
export type BairroPageLink = { slug: string; label: string };

/**
 * Destino de um bairro da lista: a página própria `/reforma/<bairro>` quando o
 * bairro tem projetos suficientes para tê-la; senão o portfólio geral. Antes
 * os 30 bairros das páginas de serviço e de /onde-atuamos apontavam todos
 * para /portfolio, e as 17 páginas de bairro só recebiam link do sitemap.
 */
export function bairroHref(label: string, pages: ReadonlyArray<BairroPageLink> | null | undefined): string {
  const slug = neighborhoodSlug(label);
  return pages?.some((p) => p.slug === slug) ? routes.bairro(slug) : routes.portfolio;
}

export const REMOTO_ITEMS: { n: string; t: string }[] = [
  { n: "01", t: "Vistoria por procuração" },
  { n: "02", t: "Ligação de energia" },
  { n: "03", t: "Prevenção de vícios de obra" },
  { n: "04", t: "Atendimento de emergências" },
  { n: "05", t: "Instalação de internet" },
  { n: "06", t: "Visibilidade total pelo Bwild Workflow" },
];
