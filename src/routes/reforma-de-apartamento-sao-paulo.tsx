import { createFileRoute } from "@tanstack/react-router";
import ReformaApartamentoSpPage from "@/pages/ReformaApartamentoSpPage";
import { APARTAMENTO_SP_JSONLD, SEO_TITLE, SEO_DESCRIPTION, SEO_KEYWORDS } from "@/content/pages/reforma-de-apartamento-sao-paulo";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";
// Import tardio: o loader da rota entra no pacote de TODA página; assim os
// carregadores de conteúdo (posts, projetos, vídeos…) só baixam quando usados.
const contentLoaders = () => import("@/lib/contentLoaders");

export const Route = createFileRoute("/reforma-de-apartamento-sao-paulo")({
  loader: () => contentLoaders().then((m) => m.loadBairroLinks()),
  component: RouteComponent,
  head: ({ matches }) => seoHead({ pagesSeo: rootPagesSeo(matches), title: SEO_TITLE, description: SEO_DESCRIPTION, keywords: SEO_KEYWORDS, path: "/reforma-de-apartamento-sao-paulo", jsonLd: APARTAMENTO_SP_JSONLD }),
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <ReformaApartamentoSpPage bairroPages={data?.bairroPages ?? null} />;
}
