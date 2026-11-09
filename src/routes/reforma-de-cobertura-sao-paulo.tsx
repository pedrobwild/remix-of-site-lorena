import { createFileRoute } from "@tanstack/react-router";
import ReformaCoberturaSpPage from "@/pages/ReformaCoberturaSpPage";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";
// Conteúdo da página (JSON-LD, FAQ, textos) só por import dinâmico no loader:
// o head() e o loader de toda rota entram no pacote inicial de QUALQUER página
// (velocidade, 09/11/2026). Ver "montadores pesados" em routesCodeSplit.test.ts.

export const Route = createFileRoute("/reforma-de-cobertura-sao-paulo")({
  loader: () => import("@/content/pages/reforma-de-cobertura-sao-paulo").then((m) => ({ jsonLd: m.COBERTURA_SP_JSONLD })),
  component: ReformaCoberturaSpPage,
  head: ({ loaderData, matches }) =>
    seoHead({
      pagesSeo: rootPagesSeo(matches),
      title: "Reforma de cobertura em São Paulo | Projeto, obra e mobília — Bewild",
      description: "Reforma completa de cobertura em São Paulo: projeto 3D, obra, terraço, marcenaria e mobília em um contrato, com preço fechado, prazo e 5 anos de garantia.",
      path: "/reforma-de-cobertura-sao-paulo",
      jsonLd: loaderData?.jsonLd ?? null,
    }),
});
