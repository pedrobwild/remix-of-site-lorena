import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { devWarn } from "@/lib/devLog";

export type BewildProjectType = "short_stay" | "turn_key" | "planta";

export type BewildProject = {
  id: string;
  slug: string;
  title: string;
  cover_url: string | null;
  project_type: BewildProjectType | null;
  neighborhood: string | null;
  location: string | null;
  area_m2: number | null;
  duration: string | null;
  sort_order: number | null;
  /** Data de publicação/cadastro; usada na ordenação do portfólio. */
  created_at: string | null;
  /** Fotos da obra pronta; define a tag "Obra pronta" e o filtro (projectPhotos.ts). */
  ready_gallery_urls: string[] | null;
  /** Faixa de investimento (filtro do portfólio); null = não informada. */
  budget_range?: string | null;
};

const PROJECT_TYPE_LABEL: Record<BewildProjectType, string> = {
  short_stay: "Short stay",
  turn_key: "Turn-key",
  planta: "Planta",
};

export function bewildTypeLabel(t: BewildProjectType | null | undefined): string {
  if (!t) return "Projeto";
  return PROJECT_TYPE_LABEL[t] ?? "Projeto";
}

/**
 * useBewildProjects — lê apenas projetos do novo portfólio Bewild
 * (published = true). Independente do `useProjects` antigo (legado).
 */
export const PROJECTS_LIST_COLUMNS =
  "id, slug, title, cover_url, project_type, neighborhood, location, area_m2, duration, sort_order, created_at, ready_gallery_urls, budget_range";

export function useBewildProjects(initial?: BewildProject[] | null) {
  const [projects, setProjects] = useState<BewildProject[]>(initial ?? []);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) return; // dados do loader: não refaz a busca
    let mounted = true;
    supabase
      .from("projects")
      .select(PROJECTS_LIST_COLUMNS)
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          devWarn("[useBewildProjects] fetch falhou:", error);
          setError(error.message);
          setLoading(false);
          return;
        }
        setProjects((data ?? []) as unknown as BewildProject[]);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só na montagem
  }, []);

  return { projects, loading, error };
}
