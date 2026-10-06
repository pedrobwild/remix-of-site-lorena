/**
 * Busca de artigos por título e descrição (resumo + meta descrição).
 * Ignora maiúsculas e acentos; todos os termos digitados precisam aparecer.
 * Resultados com o termo no título vêm primeiro; o resto segue a ordem original.
 */
import type { BewildPost } from "@/lib/useBewildPosts";

export function normalizeSearchText(s: string | null | undefined): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function searchTerms(query: string): string[] {
  return normalizeSearchText(query).split(" ").filter(Boolean);
}

export function searchPosts(posts: BewildPost[], query: string): BewildPost[] {
  const terms = searchTerms(query);
  if (terms.length === 0) return posts;
  const scored: { post: BewildPost; score: number; idx: number }[] = [];
  posts.forEach((post, idx) => {
    const title = normalizeSearchText(post.title);
    const desc = normalizeSearchText(`${post.excerpt ?? ""} ${post.meta_description ?? ""}`);
    let score = 0;
    for (const t of terms) {
      const inTitle = title.includes(t);
      const inDesc = desc.includes(t);
      if (!inTitle && !inDesc) return;
      score += inTitle ? 2 : 1;
    }
    scored.push({ post, score, idx });
  });
  return scored.sort((a, b) => b.score - a.score || a.idx - b.idx).map((s) => s.post);
}
