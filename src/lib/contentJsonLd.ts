/**
 * JSON-LD das páginas de conteúdo, em funções puras compartilhadas entre o
 * `head()` das rotas (HTML do servidor) e o fallback das páginas no cliente
 * (só quando o loader falhou). Mesma lógica que antes vivia em cada página.
 * A trilha de navegação NÃO sai aqui: ela fica só dentro do WebPage do
 * `seoHead` (sem BreadcrumbList solta).
 */
import { bewildCategoryLabel, type BewildPost } from "@/lib/useBewildPosts";
import { postAuthorJsonLd, postDates } from "@/lib/postSeo";
import { itemListJsonLd, projectJsonLd } from "@/lib/useSeo";
import { neighborhoodSlug } from "@/lib/portfolioFilter";
import { projectFriendlyName, projectMetaDescription, type ProjectSeoInput } from "@/lib/projectSeo";

export type JsonLdNode = Record<string, unknown>;

const BASE = "https://bewild.com.br";

/** Article (+ FAQPage quando o post tem FAQ). */
export function postJsonLd(post: BewildPost): JsonLdNode[] {
  const articleUrl = `${BASE}/conteudos/${post.slug}`;
  const dates = postDates(post);
  const arr: JsonLdNode[] = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description:
        post.meta_description ||
        post.excerpt ||
        `${post.title}. Conteúdo Bewild sobre reformas de apartamentos e imóveis prontos.`,
      image: post.cover_image ? [post.cover_image] : undefined,
      author: postAuthorJsonLd(post.author),
      publisher: {
        "@type": "Organization",
        "@id": `${BASE}/#org`,
        name: "Bewild",
        url: `${BASE}/`,
        logo: { "@type": "ImageObject", url: `${BASE}/brand/bewild-logo.png` },
      },
      datePublished: dates.published,
      dateModified: dates.modified,
      mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
      inLanguage: "pt-BR",
      articleSection: bewildCategoryLabel(post.category),
    },
  ];
  if (post.faq && post.faq.length > 0) {
    arr.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: post.faq.map((q) => ({
        "@type": "Question",
        name: q.question,
        acceptedAnswer: { "@type": "Answer", text: q.answer },
      })),
    });
  }
  return arr;
}

/** ItemList dos posts de /conteudos. */
export function postListJsonLd(posts: Array<Pick<BewildPost, "slug" | "title" | "cover_image">>): JsonLdNode[] {
  return [
    itemListJsonLd(
      null as never,
      posts.map((p) => ({ name: p.title, path: `/conteudos/${p.slug}`, image: p.cover_image ?? undefined })),
    ),
  ];
}

/** Projetos de um bairro (mesmo filtro da BairroPage). */
export function bairroProjects<T extends { cover_url?: string | null; neighborhood?: string | null }>(
  projects: T[],
  slug: string,
): T[] {
  return projects.filter((p) => p.cover_url && p.neighborhood && neighborhoodSlug(p.neighborhood) === slug);
}

/** ItemList dos projetos (/portfolio e /reforma/$slug). */
export function projectListJsonLd(
  projects: Array<{ slug: string; title: string; cover_url?: string | null }>,
): JsonLdNode[] {
  return [
    itemListJsonLd(
      null as never,
      projects.map((p) => ({ name: p.title, path: `/portfolio/${p.slug}`, image: p.cover_url ?? undefined })),
    ),
  ];
}

type ProjectLd = ProjectSeoInput & {
  slug: string;
  title: string;
  og_image_url?: string | null;
  cover_url?: string | null;
  neighborhood?: string | null;
  location?: string | null;
  project_type?: string | null;
};

/** CreativeWork da página de projeto (o mesmo que a página publicava). */
export function projectPageJsonLd(project: ProjectLd): JsonLdNode[] {
  return [
    projectJsonLd(null as never, {
      slug: project.slug,
      title: projectFriendlyName(project) || project.title,
      summary:
        [project.summary, project.intro].filter((text) => text?.trim()).join(" ").replace(/\s+/g, " ").trim() ||
        projectMetaDescription(project, "Projeto de arquitetura e interiores da Bewild em São Paulo-SP."),
      cover: project.og_image_url ?? project.cover_url ?? undefined,
      location: project.neighborhood ?? project.location ?? undefined,
      tag: project.project_type ?? undefined,
    }),
  ];
}
