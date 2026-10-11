import { supabase } from "@/integrations/supabase/client";
import { LEAL_CASE_SLUG } from "@/content/lealMoreira";

/* Projetos do case Leal Moreira lidos no servidor (HTML inicial com as fotos
 * e os nomes que o Google lê). Mesma origem de dados do usePartnerCase:
 * RPC pública get_partner_case + projetos publicados na ordem do case.
 * Falha ou demora (2,5 s) devolve lista vazia: a página mostra o texto e
 * tenta de novo no navegador. */

export type LealProject = {
  slug: string;
  title: string;
  cover_url: string | null;
  cover_alt: string | null;
  status: string | null;
};

export type LealData = { published: boolean; projects: LealProject[] };

async function fetchLeal(): Promise<LealData | null> {
  const { data: row, error } = await supabase
    .rpc("get_partner_case", { p_slug: LEAL_CASE_SLUG })
    .maybeSingle();
  if (error || !row) return null;
  const slugs: string[] = Array.isArray(row.project_slugs) ? row.project_slugs : [];
  if (slugs.length === 0) return { published: row.published, projects: [] };
  const { data: rows, error: pErr } = await supabase
    .from("projects")
    .select("slug, title, cover_url, cover_alt, status")
    .in("slug", slugs)
    .eq("published", true);
  if (pErr) return null;
  const bySlug = new Map((rows ?? []).map((p) => [p.slug, p as LealProject]));
  return {
    published: row.published,
    projects: slugs.map((s) => bySlug.get(s)).filter((p): p is LealProject => Boolean(p)),
  };
}

export async function loadLeal(): Promise<LealData | null> {
  try {
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
    return await Promise.race([fetchLeal(), timeout]);
  } catch {
    return null;
  }
}
