import { createFileRoute } from "@tanstack/react-router";
import BewildPostPage from "@/pages/BewildPostPage";
import { seoHead } from "@/lib/routeHead";
import { loadPostContent } from "@/lib/contentLoaders";
import { postJsonLd } from "@/lib/contentJsonLd";
import { authorForPage, authorProfileJsonLd, postDates } from "@/lib/postSeo";

export const Route = createFileRoute("/conteudos/$slug")({
  loader: ({ params }) => loadPostContent(params.slug),
  component: RouteComponent,
  head: ({ loaderData: ld, params }) => {
    const loaderData = ld?.seo;
    // Página de autor (ex.: "quem é o CEO"): WebPage vira ProfilePage com a Person.
    const author = ld?.post ? authorForPage(ld.post.slug) : null;
    const dates = ld?.post ? postDates(ld.post) : null;
    return seoHead({
      title: loaderData?.title ?? "Conteúdos | Bewild",
      description:
        loaderData?.description ??
        "Guias práticos da Bewild sobre arquitetura, engenharia e reforma de apartamento em São Paulo.",
      path: `/conteudos/${params.slug}`,
      ogImage: loaderData?.ogImage,
      ogType: author ? "profile" : "article",
      // Sem loaderData = loader lançou notFound() (404).
      noindex: !ld || loaderData?.notFound,
      jsonLd: ld?.post ? postJsonLd(ld.post) : null,
      pageJsonLd: author
        ? authorProfileJsonLd(author, {
            image: ld?.post?.cover_image,
            dateCreated: dates?.published,
            dateModified: dates?.modified,
          })
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
