import { createFileRoute } from "@tanstack/react-router";
import AutorizacaoCondominioPage from "@/pages/AutorizacaoCondominioPage";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";
// Conteúdo da página (JSON-LD, FAQ, textos) só por import dinâmico no loader:
// o head() e o loader de toda rota entram no pacote inicial de QUALQUER página
// (velocidade, 09/11/2026). Ver "montadores pesados" em routesCodeSplit.test.ts.

export const Route = createFileRoute("/autorizacao-condominio")({
  loader: () => import("@/content/pages/autorizacao-condominio").then((m) => ({ jsonLd: m.AUTORIZACAO_JSONLD })),
  component: AutorizacaoCondominioPage,
  head: ({ loaderData, matches }) =>
    seoHead({
      pagesSeo: rootPagesSeo(matches),
      title: "Autorização de reforma em condomínio: guia completo | Bewild",
      description: "Autorização de reforma em condomínio: documentos que o síndico pede (ART, seguro, cronograma), prazo de aprovação, horários de obra e quem cuida da burocracia.",
      path: "/autorizacao-condominio",
      keywords: "autorização de reforma condomínio, ART de engenharia para reforma, responsável técnico de obra, autorização de reforma em condomínio, autorização de obra em condomínio, documentos para reforma em condomínio, ART de reforma, regras de reforma em apartamento, síndico autorização reforma, Bewild",
      jsonLd: loaderData?.jsonLd ?? null,
    }),
});
