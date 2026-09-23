/**
 * useBewildPost / useBewildRelatedPosts — leitura pública de um post
 * individual de `bewild_posts` e seus relacionados.
 *
 * Independente do `useBlog` antigo (legado). RLS já restringe
 * a `published = true` para anônimos.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { devWarn } from "@/lib/devLog";
import { normalizeBewildPost, type BewildPost, type BewildPostCategory } from "@/lib/useBewildPosts";

const SELECT_COLS =
  "id, slug, title, meta_title, meta_description, category, excerpt, cover_image, body, faq, reading_time, author, featured, published, published_at, created_at, updated_at";

/**
 * Estado sempre coerente com o `slug` ATUAL: a troca de slug zera o post na
 * hora (antes o post A continuava na tela — com title/canonical de A — sob a
 * URL de B até a resposta chegar) e erro também zera (antes: post antigo ou
 * skeleton eterno). `retry()` refaz a leitura depois de um erro.
 */
export function useBewildPost(slug: string | undefined) {
  const [post, setPost] = useState<BewildPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setPost(null);
    setError(null);
    if (!slug) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let mounted = true;
    setLoading(true);
    setNotFound(false);

    supabase
      .from("bewild_posts" as never)
      .select(SELECT_COLS)
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle()
      .then(
        ({ data, error }) => {
          if (!mounted) return;
          if (error) {
            devWarn("[useBewildPost] fetch falhou:", error);
            setError(error.message || "Falha ao carregar o conteúdo.");
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
        },
        (err: unknown) => {
          // Falha de rede que rejeita a promise (supabase-js normalmente
          // devolve `{ error }`, mas fetch abortado/offline pode lançar).
          if (!mounted) return;
          devWarn("[useBewildPost] fetch lançou:", err);
          setError(err instanceof Error ? err.message : "Falha ao carregar o conteúdo.");
          setLoading(false);
        },
      );

    return () => {
      mounted = false;
    };
  }, [slug, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { post, loading, notFound, error, retry };
}

export function useBewildRelatedPosts(
  category: BewildPostCategory | null | undefined,
  excludeId: string | undefined,
  limit = 3,
) {
  const [related, setRelated] = useState<BewildPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Zera na troca: relacionados do post anterior não aparecem no novo.
    setRelated([]);
    if (!category || !excludeId) {
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
