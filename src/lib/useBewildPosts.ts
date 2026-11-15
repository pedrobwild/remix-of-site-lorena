import { useEffect, useState } from "react";
import { getSupabase } from "@/integrations/supabase/lazyClient";
import { publicSelect } from "@/integrations/supabase/publicRest";
import { devWarn } from "@/lib/devLog";
import { bewildCalendarDay } from "@/lib/postSeo";
import { toPostIndexItem, type PostIndexItem } from "@/lib/conteudosPagination";

export type BewildPostCategory =
  | "mercado"
  | "investimento"
  | "reforma"
  | "operacao"
  | "fiscal";

export type BewildFaqItem = { question: string; answer: string };

export type BewildPost = {
  id: string;
  slug: string;
  title: string;
  meta_title: string | null;
  meta_description: string | null;
  og_image?: string | null;
  category: BewildPostCategory | null;
  excerpt: string | null;
  cover_image: string | null;
  body: string;
  /** Vídeo opcional de abertura. */
  youtube_video_id?: string | null;
  faq: BewildFaqItem[] | null;
  reading_time: number | null;
  author: string | null;
  featured: boolean;
  published: boolean;
  published_at: string | null;
  created_at: string;
  /** Último update de qualquer coluna (trigger set_updated_at). Só vale como data quando `content_updated_at` não veio. */
  updated_at?: string | null;
  /** Última edição de CONTEÚDO (migration 20261006150000). Alimenta dateModified e "Atualizado em". */
  content_updated_at?: string | null;
};

/**
 * Normaliza o campo `faq` vindo do banco. O JSONB pode chegar como:
 *  - array de objetos `{q, a}` (formato historicamente gravado pelo editor)
 *  - array de objetos `{question, answer}` (formato esperado pelo render)
 *  - string JSON, ou null
 * Sempre devolve `Array<{question, answer}>` (vazio se inválido). Resiliente
 * a chaves alternativas (pergunta/resposta) e ignora itens malformados.
 */
export function normalizeBewildFaq(raw: unknown): BewildFaqItem[] {
  let data: unknown = raw;
  if (typeof data === "string") {
    try { data = JSON.parse(data); } catch { return []; }
  }
  if (!Array.isArray(data)) return [];
  const out: BewildFaqItem[] = [];
  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const question = (r.question ?? r.q ?? r.pergunta ?? "") as string;
    const answer = (r.answer ?? r.a ?? r.resposta ?? "") as string;
    if (typeof question === "string" && typeof answer === "string" && question.trim() && answer.trim()) {
      out.push({ question: question.trim(), answer: answer.trim() });
    }
  }
  return out;
}

/** Aplica `normalizeBewildFaq` a um post bruto vindo do Supabase. */
export function normalizeBewildPost<T extends { faq?: unknown }>(row: T): T & { faq: BewildFaqItem[] } {
  return { ...row, faq: normalizeBewildFaq(row?.faq) };
}

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

/** Colunas do card da lista de /conteudos (sem corpo, FAQ, og:image e meta). */
export const POST_CARD_COLS =
  "id, slug, title, category, excerpt, cover_image, reading_time, featured, published_at, created_at";

/** Card + meta description: a busca de /conteudos e /buscar procura no título e na descrição. */
export const POST_INDEX_COLS = `${POST_CARD_COLS}, meta_description`;

/**
 * Listas do cliente (fallback de /conteudos, /mapa-do-site e /buscar sem dado
 * do servidor): mesmo recorte do índice. Antes vinha o corpo de todos os posts.
 */
const SELECT_COLS = POST_INDEX_COLS;

/**
 * useBewildPosts — lê posts do blog Bewild (`bewild_posts.published = true`).
 * Independente do `useBlog` antigo (legado).
 */
export function useBewildPosts(initial?: BewildPost[] | null) {
  const [posts, setPosts] = useState<BewildPost[]>(initial ?? []);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) return; // dados do loader: não refaz a busca
    let mounted = true;
    getSupabase()
      .then((sb) =>
        sb
          .from("bewild_posts" as never)
          .select(SELECT_COLS)
          .eq("published", true)
          .order("published_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false }),
      )
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          devWarn("[useBewildPosts] fetch falhou:", error);
          setError(error.message);
          setLoading(false);
          return;
        }
        const rows = (data ?? []) as unknown as BewildPost[];
        setPosts(rows.map(normalizeBewildPost) as BewildPost[]);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só na montagem
  }, []);

  // Destaque: post mais recente com featured=true; resto vai pra grade.
  const featured = posts.find((p) => p.featured) ?? null;
  const grid = featured ? posts.filter((p) => p.id !== featured.id) : posts;

  return { posts, featured, grid, loading, error };
}

let indexPromise: Promise<PostIndexItem[]> | null = null;

/**
 * Índice completo para a busca e os filtros de /conteudos (que valem para todos
 * os artigos, não só a página na tela). Pedido uma vez só, sob demanda, direto
 * na API REST (sem o SDK do Supabase); falha libera nova tentativa.
 */
export function fetchPostIndex(): Promise<PostIndexItem[]> {
  if (!indexPromise) {
    indexPromise = publicSelect<PostIndexItem>("bewild_posts", {
      select: POST_INDEX_COLS,
      published: "eq.true",
      order: "published_at.desc.nullslast,created_at.desc",
    }).then(({ data, error }) => {
      if (error || !data) {
        indexPromise = null;
        throw new Error(error?.message || "Falha ao carregar os artigos.");
      }
      return data.map(toPostIndexItem);
    });
  }
  return indexPromise;
}

/** Só para testes. */
export function resetPostIndex(): void {
  indexPromise = null;
}

/**
 * `usePostIndex(enabled, initial)`: o índice completo, buscado só quando
 * `enabled` (busca digitada, filtro de categoria ou foco no campo de busca).
 * `initial` = índice que o servidor já mandou (URL com `?q=`).
 */
export function usePostIndex(enabled: boolean, initial?: PostIndexItem[] | null) {
  const [index, setIndex] = useState<PostIndexItem[] | null>(initial ?? null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!enabled || index) return;
    let mounted = true;
    fetchPostIndex().then(
      (rows) => {
        if (mounted) setIndex(rows);
      },
      (err: unknown) => {
        devWarn("[usePostIndex] fetch falhou:", err);
        if (mounted) setError(true);
      },
    );
    return () => {
      mounted = false;
    };
  }, [enabled, index]);
  return { index, loading: enabled && !index && !error, error };
}

/**
 * "22 de set. de 2026" — o dia civil em São Paulo (ver `bewildCalendarDay`),
 * igual para qualquer visitante e coerente com o "Atualizado em" de
 * `postDates`. Antes usava o fuso do navegador: `2026-09-22` saía "21 set".
 */
export function formatBewildDate(iso: string | null | undefined): string {
  const day = bewildCalendarDay(iso);
  if (!day) return "";
  try {
    const [y, m, d] = day.split("-").map(Number);
    // Meio-dia UTC formatado em UTC: o mesmo dia civil em qualquer fuso.
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    })
      .format(new Date(Date.UTC(y, m - 1, d, 12)))
      .replace(/\.$/, "");
  } catch {
    return "";
  }
}
