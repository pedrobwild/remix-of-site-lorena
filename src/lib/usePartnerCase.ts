import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { devWarn } from "./devLog";

/* ============================================================
 * usePartnerCase — linha da tabela partner_cases e os projetos
 * do case, na ordem de `project_slugs`.
 * Usado pela /parceiros/incorporadoras e pelo card Leal Moreira
 * da /parceiros, para atualizar números sem publicar código.
 * ============================================================ */

export type Stat = { value: string; label: string };
export type TimelineItem = { when: string; text: string };

export type PartnerCase = {
  slug: string;
  partner_name: string;
  stats: Stat[];
  timeline: TimelineItem[];
  project_slugs: string[];
  quote_text: string | null;
  quote_author: string | null;
  quote_role: string | null;
  updated_on: string | null;
  published: boolean;
};

export type CaseProject = {
  slug: string;
  title: string;
  cover_url: string | null;
  cover_alt: string | null;
  status: string | null;
};

/** Lista de objetos vinda de uma coluna jsonb, com os campos esperados. */
function asList<T extends object>(raw: unknown, keys: (keyof T)[]): T[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is T =>
      !!item && typeof item === "object" && keys.every((k) => typeof (item as T)[k] === "string"),
  );
}

/** Data ISO (YYYY-MM-DD) do banco em dd/mm/aaaa, sem fuso horário no meio. */
export function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : null;
}

/** Case + projetos do case, na ordem de `project_slugs`. `enabled = false` não consulta. */
export function usePartnerCase(slug: string, enabled = true) {
  const [data, setData] = useState<PartnerCase | null>(null);
  const [projects, setProjects] = useState<CaseProject[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;
    void (async () => {
      const { data: row, error } = await supabase
        .from("partner_cases")
        .select(
          "slug, partner_name, stats, timeline, project_slugs, quote_text, quote_author, quote_role, updated_on, published",
        )
        .eq("slug", slug)
        .maybeSingle();
      if (!mounted) return;
      if (error) {
        devWarn("[partner_cases] fetch falhou:", error);
        return;
      }
      if (!row) return;

      const caseRow: PartnerCase = {
        slug: row.slug,
        partner_name: row.partner_name,
        stats: asList<Stat>(row.stats, ["value", "label"]),
        timeline: asList<TimelineItem>(row.timeline, ["when", "text"]),
        project_slugs: Array.isArray(row.project_slugs) ? row.project_slugs : [],
        quote_text: row.quote_text,
        quote_author: row.quote_author,
        quote_role: row.quote_role,
        updated_on: row.updated_on,
        published: row.published,
      };
      setData(caseRow);

      if (caseRow.project_slugs.length === 0) return;
      const { data: rows, error: projError } = await supabase
        .from("projects")
        .select("slug, title, cover_url, cover_alt, status")
        .in("slug", caseRow.project_slugs)
        .eq("published", true);
      if (!mounted) return;
      if (projError) {
        devWarn("[partner_cases] projetos do case falharam:", projError);
        return;
      }
      const bySlug = new Map((rows ?? []).map((p) => [p.slug, p as CaseProject]));
      setProjects(
        caseRow.project_slugs
          .map((s) => bySlug.get(s))
          .filter((p): p is CaseProject => Boolean(p)),
      );
    })();
    return () => {
      mounted = false;
    };
  }, [slug]);

  return { data, projects };
}
