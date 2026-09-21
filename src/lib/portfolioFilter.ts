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

type Filterable = WithGalleries & { project_type: BewildProjectType | null };

export function applyPortfolioFilter<T extends Filterable>(list: T[], filter: PortfolioFilter): T[] {
  if (filter === "all") return list;
  if (filter === "obra_pronta") return list.filter((p) => hasReadyPhotos(p));
  return list.filter((p) => p.project_type === filter);
}
