import { createFileRoute } from "@tanstack/react-router";
import ProdutosRecomendadosPage from "@/pages/ProdutosRecomendadosPage";
import { seoHead, rootPagesSeo } from "@/lib/routeHead";
import { lerPerfil } from "@/lib/produtosRecomendados";
import { PRODUTOS_DESCRIPTION, PRODUTOS_PATH, PRODUTOS_TITLE } from "@/content/pages/produtosRecomendados.seo";

// /produtos-recomendados: produtos do Mercado Livre com link de afiliado, do
// catálogo de /admin/afiliados. O loader lê o catálogo no servidor (import
// dinâmico: o loader entra no pacote de toda página) para os cartões e o
// ItemList saírem no HTML. `?perfil=investidor|moradia` filtra; o canonical é
// sempre o endereço sem a query.
const contentLoaders = () => import("@/lib/contentLoaders");

export const Route = createFileRoute("/produtos-recomendados")({
  validateSearch: (search: Record<string, unknown>) => {
    const perfil = lerPerfil(search.perfil);
    return perfil ? { perfil } : {};
  },
  loader: () => contentLoaders().then((m) => m.loadProdutosRecomendados()),
  component: RouteComponent,
  head: ({ loaderData, matches }) => {
    const head = seoHead({
      pagesSeo: rootPagesSeo(matches),
      title: PRODUTOS_TITLE,
      description: PRODUTOS_DESCRIPTION,
      path: PRODUTOS_PATH,
      jsonLd: loaderData?.jsonLd ? [loaderData.jsonLd] : null,
    });
    // Sem capa absoluta de compartilhamento: não usar a imagem genérica da marca.
    return {
      ...head,
      meta: head.meta
        .filter((meta) => !["og:image", "og:image:type", "twitter:image"].includes(meta.property ?? meta.name ?? ""))
        .concat([{ name: "twitter:card", content: "summary" }]),
    };
  },
});

function RouteComponent() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  return <ProdutosRecomendadosPage produtos={data?.produtos ?? null} perfil={lerPerfil(search.perfil)} />;
}
