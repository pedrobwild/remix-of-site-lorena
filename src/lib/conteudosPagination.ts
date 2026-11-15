/**
 * Paginação de /conteudos (auditoria de SEO, rodada 4, 09/11/2026, ação 12).
 *
 * A lista inteira (57 artigos) saía no HTML do servidor com FAQ, meta
 * description e og:image de cada post no payload de hidratação: 397 kB de
 * HTML, 228 kB de script inline e 1.183 elementos no DOM (LCP 5,4 s no
 * celular). Agora a página 1 (`/conteudos`) mostra o destaque e um lote de
 * {@link POSTS_POR_PAGINA} cards; o resto fica em `/conteudos?pagina=N`, com
 * link real em HTML, canonical próprio e título distinto. Essas páginas NÃO
 * entram no sitemap (cada artigo já está lá e em /mapa-do-site).
 *
 * Funções puras, sem import pesado: este módulo é lido pelo `head()` da rota,
 * que entra no pacote inicial de toda página.
 */
import type { BewildPost } from "@/lib/useBewildPosts";

export const POSTS_POR_PAGINA = 12;
export const CONTEUDOS_PATH = "/conteudos";
const SITE = "https://bewild.com.br";

/** O que o card da lista mostra (e nada além: sem corpo, FAQ e meta). */
export type PostCard = Pick<
  BewildPost,
  | "id"
  | "slug"
  | "title"
  | "category"
  | "excerpt"
  | "cover_image"
  | "reading_time"
  | "featured"
  | "published_at"
  | "created_at"
>;

/** Card + meta description: o que a busca por título e descrição precisa. */
export type PostIndexItem = PostCard & Pick<BewildPost, "meta_description">;

export type PaginaDeConteudos = {
  /** Destaque (primeiro post com `featured`): só na página 1. */
  featured: PostCard | null;
  posts: PostCard[];
  pagina: number;
  totalPaginas: number;
  /** Artigos publicados no índice inteiro (destaque incluído). */
  total: number;
};

export function toPostCard(p: PostCard): PostCard {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    category: p.category,
    excerpt: p.excerpt,
    cover_image: p.cover_image,
    reading_time: p.reading_time,
    featured: p.featured,
    published_at: p.published_at,
    created_at: p.created_at,
  };
}

export function toPostIndexItem(p: PostIndexItem): PostIndexItem {
  return { ...toPostCard(p), meta_description: p.meta_description ?? null };
}

/** `?pagina=` válido: inteiro ≥ 1 (o 1 existe só para virar 301). */
export function parsePagina(raw: unknown): number | undefined {
  const n =
    typeof raw === "number"
      ? raw
      : typeof raw === "string" && /^\d{1,4}$/.test(raw)
        ? Number(raw)
        : NaN;
  return Number.isInteger(n) && n >= 1 ? n : undefined;
}

/** Endereço da página N da lista; a página 1 é sempre `/conteudos`. */
export function conteudosPagePath(n: number): string {
  return n <= 1 ? CONTEUDOS_PATH : `${CONTEUDOS_PATH}?pagina=${n}`;
}

/**
 * Recorta a lista ordenada (mais recente primeiro) na página pedida. O
 * destaque sai da grade e aparece só na página 1, como antes. `null` = página
 * além da última (o loader responde 404).
 */
export function paginarPosts<T extends PostCard>(
  all: T[],
  pagina: number,
  porPagina = POSTS_POR_PAGINA
): PaginaDeConteudos | null {
  const featured = all.find((p) => p.featured) ?? null;
  const grade = featured ? all.filter((p) => p !== featured) : all;
  const totalPaginas = Math.max(1, Math.ceil(grade.length / porPagina));
  if (pagina > totalPaginas) return null;
  const inicio = (pagina - 1) * porPagina;
  return {
    featured: pagina === 1 && featured ? toPostCard(featured) : null,
    posts: grade.slice(inicio, inicio + porPagina).map(toPostCard),
    pagina,
    totalPaginas,
    total: all.length,
  };
}

/**
 * Título e descrição da página N (N ≥ 2): os da página 1 (já com o texto da
 * aba Páginas de /admin/seo) com o número da página, para cada endereço ter
 * título próprio. Sem o total ("de 5"): artigo novo não muda o título de
 * todas as páginas. A página 1 fica como está.
 */
export function seoDaPagina<S extends { title: string; description: string }>(
  seo: S,
  pagina: number
): S {
  if (pagina <= 1) return seo;
  const m = /^(.*?)(\s*\|\s*Bewild)$/.exec(seo.title);
  const title = m ? `${m[1]}, página ${pagina}${m[2]}` : `${seo.title}, página ${pagina}`;
  return { ...seo, title, description: `Página ${pagina}. ${seo.description}` };
}

type HeadLike = {
  meta: Array<Record<string, string>>;
  links: Array<Record<string, string>>;
  scripts: Array<{ type: string; children: string }>;
};

/**
 * O `seoHead` tira a query do endereço (canonical de toda rota é o caminho).
 * Na página N ≥ 2 o canonical, o hreflang, o og:url e o WebPage do JSON-LD
 * passam a apontar para `/conteudos?pagina=N`: cada página é canônica de si
 * mesma (nunca apontar a página 2 para a 1, que tem outros artigos).
 */
export function comCanonicalDaPagina<H extends HeadLike>(head: H, pagina: number): H {
  if (pagina <= 1) return head;
  const base = `${SITE}${CONTEUDOS_PATH}`;
  const url = `${SITE}${conteudosPagePath(pagina)}`;
  return {
    ...head,
    meta: head.meta.map((m) => (m.property === "og:url" ? { ...m, content: url } : m)),
    links: head.links.map((l) =>
      (l.rel === "canonical" || (l.rel === "alternate" && l.hrefLang)) && l.href === base
        ? { ...l, href: url }
        : l
    ),
    scripts: head.scripts.map((s) => {
      if (s.type !== "application/ld+json") return s;
      try {
        const node = JSON.parse(s.children) as Record<string, unknown>;
        if (node.url !== base) return s;
        return { ...s, children: JSON.stringify({ ...node, "@id": `${url}#webpage`, url }) };
      } catch {
        return s;
      }
    }),
  };
}
