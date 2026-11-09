import { createFileRoute } from "@tanstack/react-router";
import OndeAtuamosPage from "@/pages/OndeAtuamosPage";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";
// Import tardio: o loader da rota entra no pacote de TODA página; assim os
// carregadores de conteúdo (posts, projetos, vídeos…) só baixam quando usados.
const contentLoaders = () => import("@/lib/contentLoaders");
// Conteúdo da página (JSON-LD, FAQ, textos) só por import dinâmico no loader:
// o head() e o loader de toda rota entram no pacote inicial de QUALQUER página
// (velocidade, 09/11/2026). Ver "montadores pesados" em routesCodeSplit.test.ts.

export const Route = createFileRoute("/onde-atuamos")({
  loader: async () => {
    const [links, c] = await Promise.all([
      contentLoaders().then((m) => m.loadBairroLinks()),
      import("@/content/pages/onde-atuamos"),
    ]);
    return { ...links, seo: { title: c.ONDE_ATUAMOS_TITLE, description: c.ONDE_ATUAMOS_DESCRIPTION, jsonLd: c.ONDE_ATUAMOS_JSONLD } };
  },
  component: RouteComponent,
  head: ({ loaderData, matches }) =>
    seoHead({
      pagesSeo: rootPagesSeo(matches),
      title: loaderData?.seo.title ?? "Onde a Bewild reforma em São Paulo | Bewild",
      description: loaderData?.seo.description ?? "Bairros de São Paulo com obra entregue pela Bewild: fotos reais de cada obra e orçamento sem custo.",
      path: "/onde-atuamos",
      jsonLd: loaderData?.seo.jsonLd ?? null,
    }),
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <OndeAtuamosPage bairroPages={data?.bairroPages ?? null} />;
}
