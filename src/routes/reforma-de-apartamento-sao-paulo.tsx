import { createFileRoute } from "@tanstack/react-router";
import ReformaApartamentoSpPage from "@/pages/ReformaApartamentoSpPage";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";
// Título e descrição num módulo pequeno (.seo): o head() tem o mesmo texto
// mesmo sem os dados do loader.
import { SEO_DESCRIPTION, SEO_TITLE } from "@/content/pages/reforma-de-apartamento-sao-paulo.seo";
// Import tardio: o loader da rota entra no pacote de TODA página; assim os
// carregadores de conteúdo (posts, projetos, vídeos…) só baixam quando usados.
const contentLoaders = () => import("@/lib/contentLoaders");
// Conteúdo da página (JSON-LD, FAQ, textos) só por import dinâmico no loader:
// o head() e o loader de toda rota entram no pacote inicial de QUALQUER página
// (velocidade, 09/11/2026). Ver "montadores pesados" em routesCodeSplit.test.ts.
const content = () => import("@/content/pages/reforma-de-apartamento-sao-paulo");

export const Route = createFileRoute("/reforma-de-apartamento-sao-paulo")({
  loader: async () => {
    // A lista de projetos é a mesma dos links de bairro (serverMemo de 60 s,
    // chamadas simultâneas dividem a mesma consulta): dela saem os projetos de
    // até 50 m² da seção "Reforma de apartamento pequeno em São Paulo".
    const [[links, { projects }], { SEO_KEYWORDS, APARTAMENTO_SP_JSONLD, projetosApartamentoPequeno }] = await Promise.all([
      contentLoaders().then((m) => Promise.all([m.loadBairroLinks(), m.loadProjectList()])),
      content(),
    ]);
    return {
      ...links,
      projetosPequenos: projetosApartamentoPequeno(projects),
      seo: { title: SEO_TITLE, description: SEO_DESCRIPTION, keywords: SEO_KEYWORDS, jsonLd: APARTAMENTO_SP_JSONLD },
    };
  },
  component: RouteComponent,
  head: ({ loaderData, matches }) =>
    seoHead({
      pagesSeo: rootPagesSeo(matches),
      title: loaderData?.seo.title ?? SEO_TITLE,
      description: loaderData?.seo.description ?? SEO_DESCRIPTION,
      keywords: loaderData?.seo.keywords,
      path: "/reforma-de-apartamento-sao-paulo",
      jsonLd: loaderData?.seo.jsonLd ?? null,
    }),
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return (
    <ReformaApartamentoSpPage
      bairroPages={data?.bairroPages ?? null}
      projetosPequenos={data?.projetosPequenos ?? null}
    />
  );
}
