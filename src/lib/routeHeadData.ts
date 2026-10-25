/**
 * Dados do <head> que dependem dos montadores pesados (JSON-LD de posts,
 * projetos e vídeos, autor, palavras-chave). As rotas chamam estas funções no
 * LOADER por import dinâmico e o head() só lê o resultado: o arquivo de rota
 * (head + loader) entra no pacote inicial de TODA página, então importar os
 * montadores ali levava vídeos, posts e projetos para a página de studio.
 */
import { bairroProjects, postJsonLd, postListJsonLd, postPageJsonLd, projectListJsonLd, projectPageJsonLd, saoPauloIso, type JsonLdNode } from "@/lib/contentJsonLd";
import { authorForPage, authorProfileJsonLd, postAuthorJsonLd, postDates } from "@/lib/postSeo";
import { keywordsForPost } from "@/lib/postKeywords";
import { bodyWordCount, structurePostBody } from "@/lib/postStructure";
import { bewildCategoryLabel, type BewildPost } from "@/lib/useBewildPosts";

export type PostHeadData = {
  isAuthor: boolean;
  keywords: string | undefined;
  extraMeta: Record<string, string>[] | null;
  jsonLd: JsonLdNode[] | null;
  pageJsonLd: JsonLdNode | null;
};

export function postHeadData(post: BewildPost, bodyHtml: string | null | undefined): PostHeadData {
  // Página de autor (ex.: "quem é o CEO"): WebPage vira ProfilePage com a Person.
  const author = authorForPage(post.slug);
  const dates = postDates(post);
  const body = bodyHtml ? structurePostBody(bodyHtml) : null;
  const authorNode = postAuthorJsonLd(post.author);
  const authorUrl = typeof authorNode?.url === "string" ? authorNode.url : null;
  return {
    isAuthor: !!author,
    keywords: keywordsForPost(post.slug),
    extraMeta: author
      ? null
      : [
          { name: "author", content: String(authorNode?.name ?? "Bewild") },
          { property: "article:published_time", content: dates?.published ?? "" },
          { property: "article:modified_time", content: dates?.modified ?? "" },
          { property: "article:section", content: bewildCategoryLabel(post.category) },
          { property: "article:author", content: authorUrl ?? "" },
        ],
    jsonLd: postJsonLd(post, { wordCount: bodyWordCount(body?.html) }),
    pageJsonLd: author
      ? authorProfileJsonLd(author, {
          image: post.cover_image,
          dateCreated: saoPauloIso(dates?.published),
          dateModified: saoPauloIso(dates?.modified),
        })
      : postPageJsonLd(post, body?.credits.reviewer),
  };
}

export { bairroProjects, postListJsonLd, projectListJsonLd, projectPageJsonLd };
