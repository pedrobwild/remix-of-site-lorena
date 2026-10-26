import { createFileRoute, redirect } from "@tanstack/react-router";
import { bairroRedirectTarget } from "@/lib/bairroRedirects";
import BairroPage from "@/pages/BairroPage";
import { seoHead } from "@/lib/routeHead";
// Import tardio: o loader da rota entra no pacote de TODA página; assim os
// carregadores de conteúdo (posts, projetos, vídeos…) só baixam quando usados.
const contentLoaders = () => import("@/lib/contentLoaders");
// Os dados estruturados são montados no loader (import tardio): o head() roda
// no pacote de toda página, e o montador puxa vídeos, posts e projetos.
import { faqJsonLd } from "@/lib/useSeo";
import { bairroContent } from "@/content/bairros";
import { optimizedImageUrl } from "@/lib/imageUrl";
import { bairroHeading, bairroTitle } from "@/lib/bairroSeo";
import { neighborhoodPages } from "@/lib/portfolioFilter";

export const Route = createFileRoute("/reforma/$slug")({
  beforeLoad: ({ params }) => {
    const target = bairroRedirectTarget(params.slug);
    if (target) throw redirect({ href: target, statusCode: 301 });
  },
  loader: async ({ params }) => {
    const data = await contentLoaders().then((m) => m.loadBairroContent(params.slug));
    if (!data.projects) return { ...data, jsonLd: null, coverUrl: null };
    const { bairroProjects, projectListJsonLd } = await import("@/lib/routeHeadData");
    const doBairro = bairroProjects(data.projects, params.slug);
    return { ...data, jsonLd: projectListJsonLd(doBairro), coverUrl: doBairro[0]?.cover_url ?? null };
  },
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
      pageJsonLd: ld?.projects
        ? { name: bairroHeading(neighborhoodPages(ld.projects).find((p) => p.slug === params.slug)?.label) }
        : null,
      // Capa do primeiro projeto entregue no bairro: imagem própria da página.
      ogImage: (() => {
        const cover = ld?.coverUrl;
        return cover ? optimizedImageUrl(cover, 1200, 80) : null;
      })(),
      jsonLd: ld?.projects
        ? [
            ...(ld.jsonLd ?? []),
            // FAQ do bairro (src/content/bairros.ts): só nos bairros com texto próprio.
             ...(bairroContent(params.slug)?.faq ? [faqJsonLd(bairroContent(params.slug)?.faq ?? [])] : []),
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
