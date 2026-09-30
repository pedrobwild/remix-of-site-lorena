import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { devWarn } from "@/lib/devLog";
import type { ProjectSeoPeer } from "@/lib/projectSeo";

/**
 * Campos mínimos de todos os projetos publicados, só para saber se o título
 * de uma página se repete em outra (ver projectSeoTitleUnique). Falha em
 * silêncio: sem a lista, a página usa o título normal.
 */
export const PEER_COLUMNS =
  "id, title, neighborhood, location, area_m2, project_type, status, seo_title, created_at";

export function useProjectSeoPeers(initial?: ProjectSeoPeer[] | null): ProjectSeoPeer[] {
  const [peers, setPeers] = useState<ProjectSeoPeer[]>(initial ?? []);

  useEffect(() => {
    if (initial) return; // dados do loader: não refaz a busca
    let mounted = true;
    Promise.resolve(
      supabase
        .from("projects")
        .select(PEER_COLUMNS)
        .eq("published", true)
        .limit(1000),
    )
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          devWarn("[useProjectSeoPeers] fetch falhou:", error);
          return;
        }
        setPeers((data ?? []) as unknown as ProjectSeoPeer[]);
      })
      .catch((e) => devWarn("[useProjectSeoPeers] erro:", e));
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só na montagem
  }, []);

  return peers;
}
