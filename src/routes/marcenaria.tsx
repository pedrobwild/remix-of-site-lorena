import { createFileRoute } from "@tanstack/react-router";
import MarcenariaPage from "@/pages/MarcenariaPage";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";
// Conteúdo da página (JSON-LD, FAQ, textos) só por import dinâmico no loader:
// o head() e o loader de toda rota entram no pacote inicial de QUALQUER página
// (velocidade, 09/11/2026). Ver "montadores pesados" em routesCodeSplit.test.ts.

export const Route = createFileRoute("/marcenaria")({
  loader: () => import("@/content/pages/marcenaria").then((m) => ({ jsonLd: m.MARCENARIA_JSONLD })),
  component: MarcenariaPage,
  head: ({ loaderData, matches }) =>
    seoHead({
      pagesSeo: rootPagesSeo(matches),
      title: "Marcenaria sob medida em São Paulo | Fábrica própria — Bewild",
      description: "Marcenaria planejada sob medida em São Paulo, com fábrica própria: MDF certificado, mais de 40 modelos e cores e 5 anos de garantia, no contrato da reforma.",
      path: "/marcenaria",
      keywords: "marcenaria sob medida São Paulo, marcenaria planejada SP, móveis planejados apartamento, armário sob medida, cozinha planejada São Paulo, Bewild",
      jsonLd: loaderData?.jsonLd ?? null,
    }),
});
