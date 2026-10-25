import { createFileRoute } from "@tanstack/react-router";
import OndeAtuamosPage from "@/pages/OndeAtuamosPage";
import { ONDE_ATUAMOS_DESCRIPTION, ONDE_ATUAMOS_JSONLD, ONDE_ATUAMOS_TITLE } from "@/content/pages/onde-atuamos";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";
// Import tardio: o loader da rota entra no pacote de TODA página; assim os
// carregadores de conteúdo (posts, projetos, vídeos…) só baixam quando usados.
const contentLoaders = () => import("@/lib/contentLoaders");

export const Route = createFileRoute("/onde-atuamos")({
  loader: () => contentLoaders().then((m) => m.loadBairroLinks()),
  component: RouteComponent,
  head: ({ matches }) => seoHead({ pagesSeo: rootPagesSeo(matches), title: ONDE_ATUAMOS_TITLE, description: ONDE_ATUAMOS_DESCRIPTION, path: "/onde-atuamos", jsonLd: ONDE_ATUAMOS_JSONLD }),
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <OndeAtuamosPage bairroPages={data?.bairroPages ?? null} />;
}
