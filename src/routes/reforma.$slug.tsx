import { createFileRoute, redirect } from "@tanstack/react-router";
import { bairroRedirectTarget } from "@/lib/bairroRedirects";
import BairroPage from "@/pages/BairroPage";
import { seoHead } from "@/lib/routeHead";
import { loadBairroContent } from "@/lib/contentLoaders";
import { bairroProjects, projectListJsonLd } from "@/lib/contentJsonLd";
import { faqJsonLd } from "@/lib/useSeo";
import { bairroContent } from "@/content/bairros";
import { optimizedImageUrl } from "@/lib/imageUrl";
import { bairroTitle } from "@/lib/bairroSeo";

export const Route = createFileRoute("/reforma/$slug")({
  beforeLoad: ({ params }) => {
    const target = bairroRedirectTarget(params.slug);
    if (target) throw redirect({ href: target, statusCode: 301 });
  },
  loader: ({ params }) => loadBairroContent(params.slug),
  component: RouteComponent,
  head: ({ loaderData: ld, params }) => {
    const loaderData = ld?.seo;
    return seoHead({
      title: loaderData?.title ?? bairroTitle(),
      description:
        loaderData?.description ??
        "Apartamentos reformados pela Bewild em São Paulo: fotos reais de cada obra e orçamento sem custo.",
      path: `/reforma/${params.slug}`,
      noindex: !ld || loaderData?.notFound,
      // Capa do primeiro projeto entregue no bairro: imagem própria da página.
      ogImage: (() => {
        const cover = ld?.projects ? bairroProjects(ld.projects, params.slug)[0]?.cover_url : null;
        return cover ? optimizedImageUrl(cover, 1200, 80) : null;
      })(),
      jsonLd: ld?.projects
        ? [
            ...projectListJsonLd(bairroProjects(ld.projects, params.slug)),
            // FAQ do bairro (src/content/bairros.ts): só nos bairros com texto próprio.
            ...(bairroContent(params.slug) ? [faqJsonLd(bairroContent(params.slug)!.faq)] : []),
          ]
        : null,
    });
  },
});

function RouteComponent() {
  const { slug } = Route.useParams();
  const projects = Route.useLoaderData()?.projects ?? null;
  return <BairroPage slug={slug} initialProjects={projects} />;
}
