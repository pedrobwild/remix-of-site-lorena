import { createFileRoute } from "@tanstack/react-router";
import IndiquePage from "@/pages/IndiquePage";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";
// Conteúdo da página (JSON-LD, FAQ, textos) só por import dinâmico no loader:
// o head() e o loader de toda rota entram no pacote inicial de QUALQUER página
// (velocidade, 09/11/2026). Ver "montadores pesados" em routesCodeSplit.test.ts.

export const Route = createFileRoute("/indique-um-amigo")({
  loader: () => import("@/content/pages/indique-um-amigo").then((m) => ({ jsonLd: m.INDIQUE_JSONLD })),
  component: IndiquePage,
  head: ({ loaderData, matches }) =>
    seoHead({
      pagesSeo: rootPagesSeo(matches),
      title: "Indique um amigo e ganhe no Pix | Programa de indicações Bewild",
      description: "Indique quem vai reformar apartamento, studio ou cobertura em São Paulo. Se o contrato fechar, você recebe a recompensa em Pix. Registro em 2 minutos.",
      path: "/indique-um-amigo",
      keywords: "indique e ganhe reforma, programa de indicação reforma São Paulo, recompensa por indicação apartamento, reforma de studio São Paulo, reforma de apartamento SP, Bewild indicações",
      jsonLd: loaderData?.jsonLd ?? null,
    }),
});
