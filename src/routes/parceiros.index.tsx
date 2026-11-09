import { createFileRoute } from "@tanstack/react-router";
import ParceirosPage from "@/pages/ParceirosPage";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";
// Conteúdo da página (JSON-LD, FAQ, textos) só por import dinâmico no loader:
// o head() e o loader de toda rota entram no pacote inicial de QUALQUER página
// (velocidade, 09/11/2026). Ver "montadores pesados" em routesCodeSplit.test.ts.

export const Route = createFileRoute("/parceiros/")({
  loader: () => import("@/content/pages/parceiros").then((m) => ({ jsonLd: m.PARCEIROS_JSONLD })),
  component: ParceirosPage,
  head: ({ loaderData, matches }) =>
    seoHead({
      pagesSeo: rootPagesSeo(matches),
      title: "Programa de indicações para parceiros profissionais | Bewild",
      description: "Indique clientes para a Bewild, acompanhe cada oportunidade e receba comissão conforme o termo. Para corretores, imobiliárias, incorporadoras e arquitetos.",
      path: "/parceiros",
      keywords: "escritório de arquitetura e engenharia em SP, reforma de apartamento em SP, parceria corretor reforma, indicação reforma comissão, reforma de studio para investidor, reforma apartamento compacto São Paulo, incorporadora reforma pós-chaves, custo de reforma, Bewild parceiros",
      jsonLd: loaderData?.jsonLd ?? null,
    }),
});
