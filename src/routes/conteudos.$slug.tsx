import { createFileRoute } from "@tanstack/react-router";
import BewildPostPage from "@/pages/BewildPostPage";
import { seoHead } from "@/lib/routeHead";
import { bewildCategoryLabel } from "@/lib/useBewildPosts";
import { loadPostContent } from "@/lib/contentLoaders";
import { postJsonLd, postPageJsonLd } from "@/lib/contentJsonLd";
import { authorForPage, authorProfileJsonLd, postAuthorJsonLd, postDates } from "@/lib/postSeo";
import { keywordsForPost } from "@/lib/postKeywords";
import { bodyWordCount, structurePostBody } from "@/lib/postStructure";

export const Route = createFileRoute("/conteudos/$slug")({
  loader: ({ params }) => loadPostContent(params.slug),
  component: RouteComponent,
  head: ({ loaderData: ld, params }) => {
    const loaderData = ld?.seo;
    // Página de autor (ex.: "quem é o CEO"): WebPage vira ProfilePage com a Person.
    const author = ld?.post ? authorForPage(ld.post.slug) : null;
    const dates = ld?.post ? postDates(ld.post) : null;
    const body = ld?.bodyHtml ? structurePostBody(ld.bodyHtml) : null;
    const authorNode = ld?.post ? postAuthorJsonLd(ld.post.author) : null;
    const authorUrl = typeof authorNode?.url === "string" ? authorNode.url : null;
    return seoHead({
      title: loaderData?.title ?? "Conteúdos | Bewild",
      description:
        loaderData?.description ??
        "Guias práticos da Bewild sobre arquitetura, engenharia e reforma de apartamento em São Paulo.",
      path: `/conteudos/${params.slug}`,
      ogImage: loaderData?.ogImage,
      ogType: author ? "profile" : "article",
      ogImageAlt: ld?.post?.title,
      keywords: ld?.post ? keywordsForPost(ld.post.slug) : undefined,
      extraMeta:
        ld?.post && !author
          ? [
              { name: "author", content: String(authorNode?.name ?? "Bewild") },
              { property: "article:published_time", content: dates?.published ?? "" },
              { property: "article:modified_time", content: dates?.modified ?? "" },
              { property: "article:section", content: bewildCategoryLabel(ld.post.category) },
              { property: "article:author", content: authorUrl ?? "" },
            ]
          : null,
      // Sem loaderData = loader lançou notFound() (404).
      noindex: !ld || loaderData?.notFound,
      jsonLd: ld?.post ? postJsonLd(ld.post, { wordCount: bodyWordCount(body?.html) }) : null,
      pageJsonLd: author
        ? authorProfileJsonLd(author, {
            image: ld?.post?.cover_image,
            dateCreated: dates?.published,
            dateModified: dates?.modified,
          })
        : ld?.post
          ? postPageJsonLd(ld.post, body?.credits.reviewer)
          : null,
    });
  },
});

function RouteComponent() {
  const { slug } = Route.useParams();
  const data = Route.useLoaderData() ?? {};
  return (
    <BewildPostPage
      slug={slug}
      initial={data.post === undefined ? null : { post: data.post, related: data.related ?? null, bodyHtml: data.bodyHtml ?? null }}
    />
  );
}
