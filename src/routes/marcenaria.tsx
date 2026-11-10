import { createFileRoute } from "@tanstack/react-router";
import MarcenariaPage from "@/pages/MarcenariaPage";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";
// Só os metadados (módulo pequeno), os mesmos do useSeo da página.
import { MARCENARIA_SEO } from "@/content/pages/marcenaria.seo";
// Conteúdo da página (JSON-LD, FAQ, textos) só por import dinâmico no loader:
// o head() e o loader de toda rota entram no pacote inicial de QUALQUER página
// (velocidade, 09/11/2026). Ver "montadores pesados" em routesCodeSplit.test.ts.

export const Route = createFileRoute("/marcenaria")({
  loader: () => import("@/content/pages/marcenaria").then((m) => ({ jsonLd: m.MARCENARIA_JSONLD })),
  component: MarcenariaPage,
  head: ({ loaderData, matches }) =>
    seoHead({
      pagesSeo: rootPagesSeo(matches),
      title: MARCENARIA_SEO.title,
      description: MARCENARIA_SEO.description,
      path: "/marcenaria",
      keywords: MARCENARIA_SEO.keywords,
      jsonLd: loaderData?.jsonLd ?? null,
    }),
});
