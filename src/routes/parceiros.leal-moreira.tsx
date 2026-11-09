import { createFileRoute } from "@tanstack/react-router";
import LealMoreiraPage from "@/pages/LealMoreiraPage";
import { seoHead, SITE_BASE , rootPagesSeo } from "@/lib/routeHead";
// Só os metadados (módulo pequeno): o conteúdo da página e o carregador dos
// projetos ficam fora do pacote inicial, que toda página baixa.
import { LEAL_HERO_ALT, LEAL_HERO_IMAGE, LEAL_PATH, LEAL_SEO } from "@/content/lealMoreira.seo";

function LealRoute() {
  const initial = Route.useLoaderData();
  return <LealMoreiraPage initial={initial} />;
}

export const Route = createFileRoute("/parceiros/leal-moreira")({
  loader: () => import("@/lib/lealMoreiraLoader").then((m) => m.loadLeal()),
  component: LealRoute,
  head: ({ matches }) =>
    seoHead({ pagesSeo: rootPagesSeo(matches),
      title: LEAL_SEO.title,
      description: LEAL_SEO.description,
      keywords: LEAL_SEO.keywords,
      path: LEAL_PATH,
      ogImage: `${SITE_BASE}${LEAL_HERO_IMAGE}`,
      ogImageAlt: LEAL_HERO_ALT,
    }),
});
