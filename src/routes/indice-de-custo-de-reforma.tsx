import { createFileRoute } from "@tanstack/react-router";
import IndiceCustoPage from "@/pages/IndiceCustoPage";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";
// Conteúdo do índice (src/content/indiceCusto.ts, ~10 kB) só por import
// dinâmico no loader: o head() entra no pacote inicial de toda página.

export const Route = createFileRoute("/indice-de-custo-de-reforma")({
  loader: async () => {
    const m = await import("@/content/indiceCusto");
    return { title: m.INDICE_TITLE, description: m.INDICE_DESCRIPTION, path: m.INDICE_CANONICAL, jsonLd: m.INDICE_JSONLD };
  },
  component: IndiceCustoPage,
  head: ({ loaderData, matches }) =>
    seoHead({
      pagesSeo: rootPagesSeo(matches),
      title: loaderData?.title ?? "Índice de custo de reforma em São Paulo | Bewild",
      description: loaderData?.description ?? "Índice Bewild de custo de reforma de apartamentos em São Paulo, com dados abertos da base de contratos.",
      path: loaderData?.path ?? "/indice-de-custo-de-reforma",
      jsonLd: loaderData?.jsonLd ?? null,
    }),
});
