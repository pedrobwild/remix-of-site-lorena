import { createFileRoute } from "@tanstack/react-router";
import ReformaApartamentoSpPage from "@/pages/ReformaApartamentoSpPage";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";
// Import tardio: o loader da rota entra no pacote de TODA página; assim os
// carregadores de conteúdo (posts, projetos, vídeos…) só baixam quando usados.
const contentLoaders = () => import("@/lib/contentLoaders");
// Conteúdo da página (JSON-LD, FAQ, textos) só por import dinâmico no loader:
// o head() e o loader de toda rota entram no pacote inicial de QUALQUER página
// (velocidade, 09/11/2026). Ver "montadores pesados" em routesCodeSplit.test.ts.
const content = () => import("@/content/pages/reforma-de-apartamento-sao-paulo");

export const Route = createFileRoute("/reforma-de-apartamento-sao-paulo")({
  loader: async () => {
    const [links, { SEO_TITLE, SEO_DESCRIPTION, SEO_KEYWORDS, APARTAMENTO_SP_JSONLD }] = await Promise.all([
      contentLoaders().then((m) => m.loadBairroLinks()),
      content(),
    ]);
    return {
      ...links,
      seo: { title: SEO_TITLE, description: SEO_DESCRIPTION, keywords: SEO_KEYWORDS, jsonLd: APARTAMENTO_SP_JSONLD },
    };
  },
  component: RouteComponent,
  head: ({ loaderData, matches }) =>
    seoHead({
      pagesSeo: rootPagesSeo(matches),
      title: loaderData?.seo.title ?? "Reforma de apartamento em São Paulo: projeto e obra | Bewild",
      description: loaderData?.seo.description ?? "Reforma de apartamento em São Paulo com projeto, obra, marcenaria e mobília pela Bewild.",
      keywords: loaderData?.seo.keywords,
      path: "/reforma-de-apartamento-sao-paulo",
      jsonLd: loaderData?.seo.jsonLd ?? null,
    }),
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <ReformaApartamentoSpPage bairroPages={data?.bairroPages ?? null} />;
}
