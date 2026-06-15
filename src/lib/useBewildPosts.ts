import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { devWarn } from "@/lib/devLog";

export type BewildPostCategory =
  | "mercado"
  | "investimento"
  | "reforma"
  | "operacao"
  | "fiscal";

export type BewildPost = {
  id: string;
  slug: string;
  title: string;
  meta_title: string | null;
  meta_description: string | null;
  category: BewildPostCategory | null;
  excerpt: string | null;
  cover_image: string | null;
  body: string;
  faq: Array<{ question: string; answer: string }> | null;
  reading_time: number | null;
  author: string | null;
  featured: boolean;
  published: boolean;
  published_at: string | null;
  created_at: string;
};

const CATEGORY_LABEL: Record<BewildPostCategory, string> = {
  mercado: "Mercado",
  investimento: "Investimento",
  reforma: "Reforma",
  operacao: "Operação",
  fiscal: "Fiscal",
};

export function bewildCategoryLabel(c: BewildPostCategory | null | undefined): string {
  if (!c) return "Conteúdo";
  return CATEGORY_LABEL[c] ?? "Conteúdo";
}

export const BEWILD_CATEGORIES: BewildPostCategory[] = [
  "mercado",
  "investimento",
  "reforma",
  "operacao",
  "fiscal",
];

const SELECT_COLS =
  "id, slug, title, meta_title, meta_description, category, excerpt, cover_image, body, faq, reading_time, author, featured, published, published_at, created_at";

/**
 * useBewildPosts — lê posts do blog Bewild (`bewild_posts.published = true`).
 * Independente do `useBlog` antigo (legado).
 */
export function useBewildPosts() {
  const [posts, setPosts] = useState<BewildPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("bewild_posts" as never)
      .select(SELECT_COLS)
      .eq("published", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          devWarn("[useBewildPosts] fetch falhou:", error);
          setError(error.message);
          setLoading(false);
          return;
        }
        setPosts((data ?? []) as unknown as BewildPost[]);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Destaque: post mais recente com featured=true; resto vai pra grade.
  const featured = posts.find((p) => p.featured) ?? null;
  const grid = featured ? posts.filter((p) => p.id !== featured.id) : posts;

  return { posts, featured, grid, loading, error };
}

export function formatBewildDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
      .format(d)
      .replace(/\.$/, "");
  } catch {
    return "";
  }
}
