import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { devWarn } from "@/lib/devLog";
import type { BewildProjectType } from "@/lib/useBewildProjects";

export type BewildProjectFull = {
  id: string;
  slug: string;
  title: string;
  project_type: BewildProjectType | null;
  neighborhood: string | null;
  location: string | null;
  area_m2: number | null;
  duration: string | null;
  summary: string | null;
  challenge: string | null;
  solution: string | null;
  result_text: string | null;
  scope: string[] | null;
  testimonial: string | null;
  testimonial_author: string | null;
  cover_url: string | null;
  cover_alt: string | null;
  before_image_url: string | null;
  after_image_url: string | null;
  gallery_urls: string[] | null;
  /** Fotos da obra pronta (apartamento entregue). gallery_urls = projeto 3D. */
  ready_gallery_urls: string[] | null;
  og_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
};

const COLUMNS =
  "id, slug, title, project_type, neighborhood, location, area_m2, duration, " +
  "summary, challenge, solution, result_text, scope, testimonial, testimonial_author, " +
  "cover_url, cover_alt, before_image_url, after_image_url, gallery_urls, ready_gallery_urls, " +
  "og_image_url, seo_title, seo_description";

/**
 * useBewildProject — carrega um projeto Bewild pelo slug, somente publicado.
 * Retorna `notFound = true` quando não existe ou está em rascunho.
 */
export function useBewildProject(slug: string) {
  const [project, setProject] = useState<BewildProjectFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setNotFound(false);
    setError(null);
    setProject(null);

    supabase
      .from("projects")
      .select(COLUMNS)
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          devWarn("[useBewildProject] fetch falhou:", error);
          setError(error.message);
          setLoading(false);
          return;
        }
        if (!data) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setProject(data as unknown as BewildProjectFull);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  return { project, loading, error, notFound };
}
