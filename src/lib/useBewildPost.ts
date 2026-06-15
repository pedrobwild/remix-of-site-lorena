/**
 * useBewildPost / useBewildRelatedPosts — leitura pública de um post
 * individual de `bewild_posts` e seus relacionados.
 *
 * Independente do `useBlog` antigo (legado). RLS já restringe
 * a `published = true` para anônimos.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { devWarn } from "@/lib/devLog";
import { normalizeBewildPost, type BewildPost, type BewildPostCategory } from "@/lib/useBewildPosts";

const SELECT_COLS =
  "id, slug, title, meta_title, meta_description, category, excerpt, cover_image, body, faq, reading_time, author, featured, published, published_at, created_at";

export function useBewildPost(slug: string | undefined) {
  const [post, setPost] = useState<BewildPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let mounted = true;
    setLoading(true);
    setNotFound(false);
    setError(null);

    supabase
      .from("bewild_posts" as never)
      .select(SELECT_COLS)
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          devWarn("[useBewildPost] fetch falhou:", error);
          setError(error.message);
          setLoading(false);
          return;
        }
        if (!data) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setPost(normalizeBewildPost(data as unknown as BewildPost) as BewildPost);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  return { post, loading, notFound, error };
}

export function useBewildRelatedPosts(
  category: BewildPostCategory | null | undefined,
  excludeId: string | undefined,
  limit = 3,
) {
  const [related, setRelated] = useState<BewildPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!category || !excludeId) {
      setRelated([]);
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);

    supabase
      .from("bewild_posts" as never)
      .select(SELECT_COLS)
      .eq("published", true)
      .eq("category", category)
      .neq("id", excludeId)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit)
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          devWarn("[useBewildRelatedPosts] fetch falhou:", error);
          setRelated([]);
          setLoading(false);
          return;
        }
        setRelated(((data ?? []) as unknown as BewildPost[]).map(normalizeBewildPost) as BewildPost[]);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [category, excludeId, limit]);

  return { related, loading };
}
