import type { BewildProjectType } from "@/lib/useBewildProjects";
import { hasReadyPhotos, type WithGalleries } from "@/lib/projectPhotos";

/**
 * Filtros do portfólio (/portfolio). Os chips por tipo de projeto continuam;
 * "Obra pronta" é um chip a mais e usa a presença de fotos da obra como
 * critério (ver projectPhotos.ts).
 */
export type PortfolioFilter = "all" | BewildProjectType | "obra_pronta";

export const PORTFOLIO_FILTERS: { value: PortfolioFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "obra_pronta", label: "Obra pronta" },
  { value: "short_stay", label: "Short stay" },
  { value: "turn_key", label: "Turn-key" },
  { value: "planta", label: "Planta" },
];

/**
 * Chips que fazem sentido para a lista recebida.
 *
 * "Obra pronta" deriva de `ready_gallery_urls`, e hoje 0 dos 161 projetos
 * publicados têm esse campo preenchido: o chip aparecia sempre e garantia
 * "Nenhum projeto nesse filtro ainda" em 100% dos cliques. Só oferecemos o
 * filtro quando existe ao menos um projeto que ele consegue casar — quando o
 * campo começar a ser preenchido no admin, o chip volta sozinho.
 * Ver PORT-01 em docs/auditoria/rodada-2026-09-22.md.
 */
export function availablePortfolioFilters<T extends WithGalleries>(
  list: T[],
): { value: PortfolioFilter; label: string }[] {
  const temObraPronta = list.some((p) => hasReadyPhotos(p));
  return PORTFOLIO_FILTERS.filter((f) => f.value !== "obra_pronta" || temObraPronta);
}

type Filterable = WithGalleries & { project_type: BewildProjectType | null };

export function applyPortfolioFilter<T extends Filterable>(list: T[], filter: PortfolioFilter): T[] {
  if (filter === "all") return list;
  if (filter === "obra_pronta") return list.filter((p) => hasReadyPhotos(p));
  return list.filter((p) => p.project_type === filter);
}

/* ============================ Bairro ============================ */

export const ALL_NEIGHBORHOODS = "__all__";

type WithPlace = { neighborhood?: string | null; location?: string | null };

/** Bairro exibido no card (mesma regra do grid): bairro → cidade → São Paulo. */
export function placeOf(p: WithPlace): string {
  return (p.neighborhood || p.location || "São Paulo").trim();
}

/** Lista de bairros disponíveis, sem repetição, em ordem alfabética pt-BR. */
export function neighborhoodOptions<T extends WithPlace>(list: T[]): string[] {
  const set = new Set(list.map(placeOf).filter(Boolean));
  return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function applyNeighborhoodFilter<T extends WithPlace>(list: T[], value: string): T[] {
  if (!value || value === ALL_NEIGHBORHOODS) return list;
  return list.filter((p) => placeOf(p) === value);
}

/* =========================== Ordenação =========================== */

export type PortfolioSort = "curadoria" | "recentes" | "antigos" | "area_desc" | "area_asc";

export const PORTFOLIO_SORTS: { value: PortfolioSort; label: string }[] = [
  { value: "curadoria", label: "Curadoria Bewild" },
  { value: "recentes", label: "Publicados recentemente" },
  { value: "antigos", label: "Publicados há mais tempo" },
  { value: "area_desc", label: "Maior área (m²)" },
  { value: "area_asc", label: "Menor área (m²)" },
];

type Sortable = {
  created_at?: string | null;
  area_m2?: number | null;
  sort_order?: number | null;
};

const time = (v: string | null | undefined): number => {
  const t = v ? Date.parse(v) : Number.NaN;
  return Number.isNaN(t) ? 0 : t;
};

/** Ordena sem mutar a lista recebida. */
export function applyPortfolioSort<T extends Sortable>(list: T[], sort: PortfolioSort): T[] {
  const out = [...list];
  switch (sort) {
    case "recentes":
      return out.sort((a, b) => time(b.created_at) - time(a.created_at));
    case "antigos":
      return out.sort((a, b) => time(a.created_at) - time(b.created_at));
    case "area_desc":
      return out.sort((a, b) => (b.area_m2 ?? -1) - (a.area_m2 ?? -1));
    case "area_asc":
      return out.sort((a, b) => (a.area_m2 ?? Number.MAX_SAFE_INTEGER) - (b.area_m2 ?? Number.MAX_SAFE_INTEGER));
    case "curadoria":
    default:
      return out;
  }
}
