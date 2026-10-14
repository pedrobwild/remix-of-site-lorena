import { createFileRoute } from "@tanstack/react-router";
import AtribuicaoPage from "@/pages/AtribuicaoPage";
import { ATRIBUICAO_CANONICAL, ATRIBUICAO_SEO } from "@/content/pages/atribuicao";
import { seoHead, rootPagesSeo } from "@/lib/routeHead";

export const Route = createFileRoute("/atribuicao")({
  component: RouteComponent,
  head: ({ matches }) =>
    seoHead({
      pagesSeo: rootPagesSeo(matches),
      ...ATRIBUICAO_SEO,
      path: ATRIBUICAO_CANONICAL,
      ogType: "website",
      extraMeta: [{ name: "twitter:card", content: "summary_large_image" }],
    }),
});

function RouteComponent() {
  return <AtribuicaoPage />;
}
