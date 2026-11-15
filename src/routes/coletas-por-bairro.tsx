import { createFileRoute } from "@tanstack/react-router";
import { searchBairro } from "@/lib/lightValidators";
import ColetasRadarPage from "@/pages/ColetasRadarPage";
import { getRadarColetas } from "@/lib/assistant/radarColetas.functions";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/coletas-por-bairro")({
  validateSearch: searchBairro,
  loaderDeps: ({ search }) => ({ bairro: search.bairro }),
  loader: ({ deps }) => getRadarColetas({ data: { bairro: deps.bairro } }),
  head: () =>
    seoHead({
      title: "Coletas do Radar Bewild por bairro | Bewild",
      description: "Histórico público das coletas de diária média do Radar Bewild em cada bairro de São Paulo: data, período, fonte, amostra e status.",
      path: "/coletas-por-bairro",
      // D5 do Pedro (auditoria de SEO, rodada 4, 09/11/2026): 67 palavras e
      // nenhum link interno. A página segue no ar (e /coletas continua
      // redirecionando para ela), mas sai do índice e dos dois geradores de
      // sitemap: noindex, follow.
      noindex: true,
      ogType: "website",
      extraMeta: [{ name: "twitter:card", content: "summary" }],
    }),
  component: RouteComponent,
  errorComponent: () => <p role="alert">O histórico de coletas está indisponível agora.</p>,
  notFoundComponent: () => <p>Página não encontrada.</p>,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <ColetasRadarPage data={data} />;
}
