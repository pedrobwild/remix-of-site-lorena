import { createFileRoute } from "@tanstack/react-router";
import EscopoPage from "@/pages/EscopoPage";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";
import { ESCOPO_DESCRIPTION, ESCOPO_PATH, ESCOPO_TITLE } from "@/content/pages/escopo.seo";

// /escopo: o que entra e o que não entra na reforma completa, perguntas para
// montar o escopo e faixa de investimento por m². Substitui o "Escopo com IA"
// (tirado do ar em 09/10/2026): não usa IA, não chama função nenhuma e só
// calcula no navegador com números publicados. Conteúdo e FAQPage (D4 do
// Pedro, 09/11/2026) chegam pelo loader com import dinâmico: o head() entra
// no pacote inicial de toda página.
export const Route = createFileRoute("/escopo")({
  loader: () => import("@/content/pages/escopo").then((m) => ({ jsonLd: m.ESCOPO_JSONLD })),
  component: EscopoPage,
  head: ({ loaderData, matches }) =>
    seoHead({ pagesSeo: rootPagesSeo(matches),
      title: ESCOPO_TITLE,
      description: ESCOPO_DESCRIPTION,
      path: ESCOPO_PATH,
      jsonLd: loaderData?.jsonLd ?? null,
    }),
});
