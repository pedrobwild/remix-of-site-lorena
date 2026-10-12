/**
 * JSON-LD das páginas de conteúdo, em funções puras compartilhadas entre o
 * `head()` das rotas (HTML do servidor) e o fallback das páginas no cliente
 * (só quando o loader falhou). Mesma lógica que antes vivia em cada página.
 * A trilha de navegação NÃO sai aqui: ela fica só dentro do WebPage do
 * `seoHead` (sem BreadcrumbList solta).
 */
import { bewildCategoryLabel, type BewildPost } from "@/lib/useBewildPosts";
import { bewildTypeLabel, type BewildProjectType } from "@/lib/useBewildProjects";
import { authorForPage, postAuthorJsonLd, postDates, resolvePostAuthor } from "@/lib/postSeo";
import { keywordsForPost } from "@/lib/postKeywords";
import { itemListJsonLd, projectJsonLd } from "@/lib/useSeo";
import { extractYouTubeEmbeds, isoDurationSeconds, youtubeEmbedUrl, youtubeThumbnailUrl } from "@/lib/youtube";
import { fileMeta, videoUploadDate, ytMeta } from "@/lib/videoMeta";
import { postYouTubeVideo } from "@/lib/postYouTubeVideo";
import { neighborhoodSlug } from "@/lib/portfolioFilter";
import { projectFriendlyName, projectMetaDescription, type ProjectSeoInput } from "@/lib/projectSeo";

export type JsonLdNode = Record<string, unknown>;

const BASE = "https://bewild.com.br";

// Dados reais do vídeo (título, descrição, miniatura, duração e data do próprio
// vídeo) e a regra da data com fuso moram em src/lib/videoMeta.ts, a mesma fonte
// das páginas de vídeo (/videos/<slug>). Reexportado para quem já importava daqui.
export { videoUploadDate };

/**
 * Data ISO 8601 no fuso de São Paulo (-03:00; sem horário de verão desde 2019).
 * "2026-09-01T00:00:00Z" → "2026-08-31T21:00:00-03:00"; só a data → meia-noite
 * de SP. Valor inválido não sai.
 */
export function saoPauloIso(value: string | null | undefined): string | undefined {
  const v = (value ?? "").trim();
  if (!v) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T00:00:00-03:00`;
  const hasTz = /(Z|[+-]\d{2}:?\d{2})$/i.test(v);
  const ms = Date.parse(hasTz ? v.replace(" ", "T") : `${v.replace(" ", "T")}Z`);
  if (Number.isNaN(ms)) return undefined;
  return `${new Date(ms - 3 * 3600_000).toISOString().slice(0, 19)}-03:00`;
}

/** Autor do Article: Pedro e Thiago só por @id (o nó completo está no root). */
function articleAuthor(author: string | null | undefined): JsonLdNode {
  const person = resolvePostAuthor(author);
  if (person?.id) return { "@type": "Person", "@id": person.id, name: person.name };
  return postAuthorJsonLd(author);
}

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
  const meta = fileMeta(src);
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
    name: meta.name || label || caption || post.title,
    description: meta.description || post.meta_description || post.excerpt || post.title,
    thumbnailUrl: [abs(meta.thumbnailUrl || poster)],
    ...(meta.duration ? { duration: meta.duration } : {}),
    contentUrl: abs(src),
    uploadDate: videoUploadDate(meta.uploadDate ?? dates.published),
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
export type PostJsonLdExtras = {
  /** Palavras do corpo visível (Article.wordCount). */
  wordCount?: number;
};

export function postJsonLd(post: BewildPost, extras: PostJsonLdExtras = {}): JsonLdNode[] {
  const articleUrl = `${BASE}/conteudos/${post.slug}`;
  const dates = postDates(post);
  const arr: JsonLdNode[] = [];
  const leadingVideo = postYouTubeVideo(post);
  if (!authorForPage(post.slug)) {
    arr.push({
      "@context": "https://schema.org",
      "@type": "Article",
      "@id": `${articleUrl}#article`,
      headline: post.title,
      description:
        post.meta_description ||
        post.excerpt ||
        `${post.title}. Conteúdo Bewild sobre reformas de apartamentos e imóveis prontos.`,
      image: post.cover_image ? [abs(post.cover_image)] : undefined,
      author: articleAuthor(post.author),
      // O nó completo da Organization já sai no grafo do root.
      publisher: { "@id": `${BASE}/#org` },
      datePublished: saoPauloIso(dates.published),
      dateModified: saoPauloIso(dates.modified),
      mainEntityOfPage: articleUrl,
      isPartOf: { "@id": `${BASE}/#website` },
      url: articleUrl,
      inLanguage: "pt-BR",
      articleSection: bewildCategoryLabel(post.category),
      keywords: keywordsForPost(post.slug),
      ...(extras.wordCount ? { wordCount: extras.wordCount } : {}),
      isAccessibleForFree: true,
      ...(leadingVideo ? { video: { "@id": `${articleUrl}#video-${leadingVideo.id}` } } : {}),
    });
  }
  if (leadingVideo) {
    // Descrição, duração e data do próprio vídeo quando cadastradas (videoMeta.json):
    // o mesmo dado da página do vídeo. Sem cadastro, valem os do artigo.
    const meta = ytMeta(leadingVideo.id);
    arr.push({
      "@context": "https://schema.org", "@type": "VideoObject",
      "@id": `${articleUrl}#video-${leadingVideo.id}`,
      name: leadingVideo.title,
      description: meta.description || post.excerpt || post.meta_description || post.title,
      thumbnailUrl: [abs(leadingVideo.thumbnail)], uploadDate: videoUploadDate(meta.uploadDate ?? dates.published),
      ...(meta.duration ? { duration: meta.duration } : {}),
      // Só o endereço do player (o mesmo do <iframe>). contentUrl é para arquivo de
      // mídia; a página do YouTube não é um arquivo e não entra.
      embedUrl: youtubeEmbedUrl(leadingVideo.id),
      publisher: { "@id": `${BASE}/#org` },
      inLanguage: "pt-BR", isPartOf: { "@id": `${articleUrl}#webpage` },
    });
  }
  // Vídeos do YouTube no corpo: VideoObject é o que leva o Google a indexar o vídeo da página.
  for (const v of extractYouTubeEmbeds(post.body)) {
    if (v.id === leadingVideo?.id) continue;
    const meta = ytMeta(v.id);
    const name = meta.name || v.title || post.title;
    // Trecho indicado no artigo (?start=): Clip diz ao Google onde o momento começa
    // e termina, com link direto para ele (key moments). O fim vem do `end=` do embed
    // ou, sem ele, da duração cadastrada em videoMeta.json (trecho vai até o fim).
    // Sem início ou sem fim conhecido, só o vídeo: Clip sem endOffset gera aviso
    // no Search Console ("endOffset" não encontrado em "hasPart").
    const total = isoDurationSeconds(meta.duration);
    const end = v.start
      ? v.end && v.end > v.start
        ? v.end
        : total && total > v.start
          ? total
          : null
      : null;
    const clip = v.start && end
      ? {
          hasPart: [
            {
              "@type": "Clip",
              name: `${name} — trecho citado no artigo`,
              startOffset: v.start,
              endOffset: end,
              url: `https://www.youtube.com/watch?v=${v.id}&t=${v.start}s`,
            },
          ],
        }
      : {};
    arr.push({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name,
      description: meta.description || post.meta_description || post.excerpt || name,
      thumbnailUrl: [abs(meta.thumbnailUrl || youtubeThumbnailUrl(v.id))],
      ...(meta.duration ? { duration: meta.duration } : {}),
      uploadDate: videoUploadDate(meta.uploadDate ?? dates.published),
      embedUrl: youtubeEmbedUrl(v.id, v.start ?? undefined),
      url: `https://www.youtube.com/watch?v=${v.id}`,
      inLanguage: "pt-BR",
      publisher: { "@id": `${BASE}/#org` },
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

/**
 * Propriedades do WebPage de um post: `reviewedBy` com o revisor citado no
 * próprio texto ("Revisão técnica: Thiago Dantas") e `lastReviewed`. Só sai
 * quando o revisor é uma pessoa diferente do autor; nada é inventado.
 */
export function postPageJsonLd(
  post: Pick<BewildPost, "author" | "published_at" | "created_at" | "updated_at"> & { content_updated_at?: string | null },
  reviewer: string | null | undefined,
): JsonLdNode | null {
  if (!reviewer) return null;
  const rev = resolvePostAuthor(reviewer);
  if (!rev) return null;
  const author = resolvePostAuthor(post.author);
  if (author && author.name === rev.name) return null;
  const dates = postDates(post);
  return {
    reviewedBy: postAuthorJsonLd(rev.name),
    ...(dates.modified ? { lastReviewed: saoPauloIso(dates.modified) } : {}),
  };
}

/** ItemList dos posts de /conteudos. */
export function postListJsonLd(
  posts: Array<Pick<BewildPost, "slug" | "title" | "cover_image"> & { featured?: boolean | null }>,
): JsonLdNode[] {
  // Mesma ordem da tela: o destaque (primeiro com featured) vem antes da grade.
  const featured = posts.find((p) => p.featured);
  const ordered = featured ? [featured, ...posts.filter((p) => p !== featured)] : posts;
  return [
    itemListJsonLd(
      null as never,
      ordered.map((p) => ({ name: p.title, path: `/conteudos/${p.slug}`, image: p.cover_image ?? undefined })),
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
      // Só os que a tela mostra (com capa), na mesma ordem (curadoria = ordem do banco).
      // Nome sem o código interno do cliente, como no <title> e no H1 do projeto.
      projects.filter((p) => !!p.cover_url).map((p) => ({
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
