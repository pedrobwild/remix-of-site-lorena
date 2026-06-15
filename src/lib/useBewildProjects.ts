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
export function useBewildProjects() {
  const [projects, setProjects] = useState<BewildProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("projects")
      .select(
        "id, slug, title, cover_url, project_type, neighborhood, location, area_m2, duration, sort_order, created_at"
      )
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
  }, []);

  return { projects, loading, error };
}
