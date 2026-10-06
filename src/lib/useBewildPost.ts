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

export const POST_SELECT_COLS =
  "id, slug, title, meta_title, meta_description, og_image, category, excerpt, cover_image, body, faq, reading_time, author, featured, published, published_at, created_at, updated_at";

/**
 * Estado sempre coerente com o `slug` ATUAL: a troca de slug zera o post na
 * hora (antes o post A continuava na tela — com title/canonical de A — sob a
 * URL de B até a resposta chegar) e erro também zera (antes: post antigo ou
 * skeleton eterno). `retry()` refaz a leitura depois de um erro.
 */
export type InitialPost = { slug: string; post: BewildPost | null };

export function useBewildPost(slug: string | undefined, initial?: InitialPost | null) {
  const hasInitial = !!initial && initial.slug === slug;
  const [post, setPost] = useState<BewildPost | null>(hasInitial ? initial!.post : null);
  const [loading, setLoading] = useState(!hasInitial);
  const [notFound, setNotFound] = useState(hasInitial ? initial!.post === null : false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Dados do loader (SSR/navegação) para este slug: não refaz a busca.
    if (attempt === 0 && initial && initial.slug === slug) {
      setPost(initial.post);
      setError(null);
      setNotFound(initial.post === null);
      setLoading(false);
      return;
    }
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
      .select(POST_SELECT_COLS)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `initial` acompanha o slug
  }, [slug, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { post, loading, notFound, error, retry };
}

export function useBewildRelatedPosts(
  category: BewildPostCategory | null | undefined,
  excludeId: string | undefined,
  limit = 3,
  initial?: { excludeId: string; related: BewildPost[] } | null,
) {
  const hasInitial = !!initial && initial.excludeId === excludeId;
  const [related, setRelated] = useState<BewildPost[]>(hasInitial ? initial!.related : []);
  const [loading, setLoading] = useState(!hasInitial);

  useEffect(() => {
    if (initial && initial.excludeId === excludeId) {
      setRelated(initial.related);
      setLoading(false);
      return;
    }
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
      .select(POST_SELECT_COLS)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `initial` acompanha o post
  }, [category, excludeId, limit]);

  return { related, loading };
}
