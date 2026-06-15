import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { devWarn } from "@/lib/devLog";

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
  category: BewildPostCategory | null;
  excerpt: string | null;
  cover_image: string | null;
  body: string;
  faq: BewildFaqItem[] | null;
  reading_time: number | null;
  author: string | null;
  featured: boolean;
  published: boolean;
  published_at: string | null;
  created_at: string;
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
        const rows = (data ?? []) as unknown as BewildPost[];
        setPosts(rows.map(normalizeBewildPost) as BewildPost[]);
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
