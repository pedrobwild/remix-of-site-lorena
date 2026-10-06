/**
 * JSON-LD das páginas de conteúdo, em funções puras compartilhadas entre o
 * `head()` das rotas (HTML do servidor) e o fallback das páginas no cliente
 * (só quando o loader falhou). Mesma lógica que antes vivia em cada página.
 * A trilha de navegação NÃO sai aqui: ela fica só dentro do WebPage do
 * `seoHead` (sem BreadcrumbList solta).
 */
import { bewildCategoryLabel, type BewildPost } from "@/lib/useBewildPosts";
import { bewildTypeLabel, type BewildProjectType } from "@/lib/useBewildProjects";
import { authorForPage, postAuthorJsonLd, postDates } from "@/lib/postSeo";
import { itemListJsonLd, projectJsonLd } from "@/lib/useSeo";
import { extractYouTubeEmbeds, youtubeEmbedUrl, youtubeThumbnailUrl } from "@/lib/youtube";
import { neighborhoodSlug } from "@/lib/portfolioFilter";
import { projectFriendlyName, projectMetaDescription, type ProjectSeoInput } from "@/lib/projectSeo";

export type JsonLdNode = Record<string, unknown>;

const BASE = "https://bewild.com.br";

const abs = (u: string) => (u.startsWith("http") ? u : `${BASE}${u.startsWith("/") ? u : `/${u}`}`);

/**
 * VideoObject para o vídeo que o post incorpora (`<video poster … ><source src …>`),
 * só quando ele existe no corpo: o Google exige que o vídeo esteja na página.
 * Nome = legenda da figura ou aria-label do vídeo; data = publicação do post.
 */
export function postVideoJsonLd(post: Pick<BewildPost, "body" | "title" | "meta_description" | "excerpt" | "slug" | "published_at" | "created_at">): JsonLdNode | null {
  const body = post.body || "";
  const video = body.match(/<video\b[^>]*>[\s\S]*?<\/video>/i)?.[0];
  if (!video) return null;
  const src = video.match(/<source\b[^>]*\bsrc="([^"]+)"/i)?.[1] || video.match(/\bsrc="([^"]+)"/i)?.[1];
  const poster = video.match(/\bposter="([^"]+)"/i)?.[1];
  if (!src || !poster) return null;
  const end = body.indexOf(video) + video.length;
  const caption = body
    .slice(end, end + 400)
    .match(/^\s*<figcaption>([\s\S]*?)<\/figcaption>/i)?.[1]
    ?.replace(/<[^>]+>/g, "")
    .trim();
  const label = video.match(/\baria-label="([^"]+)"/i)?.[1]?.replace(/^V[ií]deo:\s*/i, "").trim();
  const dates = postDates(post);
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: label || caption || post.title,
    description: post.meta_description || post.excerpt || post.title,
    thumbnailUrl: [abs(poster)],
    contentUrl: abs(src),
    uploadDate: dates.published,
    inLanguage: "pt-BR",
    publisher: { "@id": `${BASE}/#org` },
    url: `${BASE}/conteudos/${post.slug}`,
  };
}

/**
 * Article (+ FAQPage quando o post tem FAQ, + VideoObject quando tem vídeo).
 * A página de autor não é um artigo: sai sem Article (o nó da página vira
 * ProfilePage no head() da rota), só com os blocos restantes.
 */
export function postJsonLd(post: BewildPost): JsonLdNode[] {
  const articleUrl = `${BASE}/conteudos/${post.slug}`;
  const dates = postDates(post);
  const arr: JsonLdNode[] = [];
  if (!authorForPage(post.slug)) {
    arr.push({
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
    });
  }
  // Vídeos do YouTube no corpo: VideoObject é o que leva o Google a indexar o vídeo da página.
  for (const v of extractYouTubeEmbeds(post.body)) {
    const name = v.title || post.title;
    // Trecho indicado no artigo (?start=): Clip diz ao Google onde o momento começa,
    // com link direto para ele (key moments). Sem início, só o vídeo.
    const clip = v.start
      ? {
          hasPart: [
            {
              "@type": "Clip",
              name: `${name} — trecho citado no artigo`,
              startOffset: v.start,
              url: `https://www.youtube.com/watch?v=${v.id}&t=${v.start}s`,
            },
          ],
        }
      : {};
    arr.push({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name,
      description: post.meta_description || post.excerpt || name,
      thumbnailUrl: [youtubeThumbnailUrl(v.id)],
      uploadDate: dates.published,
      embedUrl: youtubeEmbedUrl(v.id, v.start ?? undefined),
      url: `https://www.youtube.com/watch?v=${v.id}`,
      inLanguage: "pt-BR",
      isPartOf: { "@type": "WebPage", "@id": articleUrl },
      ...clip,
    });
  }
  // Vídeo próprio (<video poster><source src>) no corpo: mesmo VideoObject, com o arquivo.
  const video = postVideoJsonLd(post);
  if (video) arr.push(video);
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
      // Nome sem o código interno do cliente, como no <title> e no H1 do projeto.
      projects.map((p) => ({
        name: projectFriendlyName(p) || p.title,
        path: `/portfolio/${p.slug}`,
        image: p.cover_url ?? undefined,
      })),
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
      summary: projectMetaDescription(project, "Apartamento reformado pela Bewild em São Paulo-SP."),
      cover: project.og_image_url ?? project.cover_url ?? undefined,
      location: project.neighborhood ?? project.location ?? undefined,
      // Rótulo legível ("Short stay"), não o código do banco ("short_stay").
      tag: project.project_type ? bewildTypeLabel(project.project_type as BewildProjectType) : undefined,
    }),
  ];
}
