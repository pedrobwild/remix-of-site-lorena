import { createFileRoute, redirect } from "@tanstack/react-router";
import BewildPostPage from "@/pages/BewildPostPage";
import { seoHead } from "@/lib/routeHead";
// Import tardio: o loader da rota entra no pacote de TODA página; assim os
// carregadores de conteúdo (posts, projetos, vídeos…) só baixam quando usados.
const contentLoaders = () => import("@/lib/contentLoaders");
// Dados estruturados, autor e datas são montados no loader (import tardio):
// o head() roda no pacote de toda página e esses montadores puxam vídeos e posts.
import { destinoDoPostFundido } from "@/lib/postsFundidos";

export const Route = createFileRoute("/conteudos/$slug")({
  // Artigo fundido em outro: 301 no servidor, antes de carregar o post.
  beforeLoad: ({ params }) => {
    const destino = destinoDoPostFundido(params.slug);
    if (destino) throw redirect({ to: "/conteudos/$slug", params: { slug: destino }, statusCode: 301 });
  },
  loader: async ({ params }) => {
    const ld = await contentLoaders().then((m) => m.loadPostContent(params.slug));
    if (!ld?.post) return { ...ld, head: null };
    const [{ postJsonLd, postPageJsonLd, saoPauloIso }, { authorForPage, authorProfileJsonLd, postAuthorJsonLd, postDates }, { keywordsForPost }, { bodyWordCount, structurePostBody }, { bewildCategoryLabel }] =
      await Promise.all([
        import("@/lib/contentJsonLd"),
        import("@/lib/postSeo"),
        import("@/lib/postKeywords"),
        import("@/lib/postStructure"),
        import("@/lib/useBewildPosts"),
      ]);
    const post = ld.post;
    // Página de autor (ex.: "quem é o CEO"): WebPage vira ProfilePage com a Person.
    const author = authorForPage(post.slug);
    const dates = postDates(post);
    const body = ld.bodyHtml ? structurePostBody(ld.bodyHtml) : null;
    const authorNode = postAuthorJsonLd(post.author);
    const authorUrl = typeof authorNode?.url === "string" ? authorNode.url : null;
    return {
      ...ld,
      head: {
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
      },
    };
  },
  component: RouteComponent,
  head: ({ loaderData: ld, params }) => {
    const loaderData = ld?.seo;
    const h = ld?.head ?? null;
    return seoHead({
      title: loaderData?.title ?? "Conteúdos | Bewild",
      description:
        loaderData?.description ??
        "Guias práticos da Bewild sobre arquitetura, engenharia e reforma de apartamento em São Paulo.",
      path: `/conteudos/${params.slug}`,
      ogImage: loaderData?.ogImage,
      ogType: h?.isAuthor ? "profile" : "article",
      ogImageAlt: ld?.post?.title,
      keywords: h?.keywords,
      extraMeta: h?.extraMeta ?? null,
      // Sem loaderData = loader lançou notFound() (404).
      noindex: !ld || loaderData?.notFound,
      jsonLd: h?.jsonLd ?? null,
      pageJsonLd: h?.pageJsonLd ?? null,
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
