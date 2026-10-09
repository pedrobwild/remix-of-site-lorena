import { createFileRoute, useNavigate } from "@tanstack/react-router";
import BewildConteudosPage from "@/pages/BewildConteudosPage";
import { seoHead } from "@/lib/routeHead";
import { loadPageSeo } from "@/lib/pageSeo.functions";
import { resolvePageSeo } from "@/lib/pageSeo";
import { loadPostList } from "@/lib/contentLoaders";
import { postListJsonLd } from "@/lib/contentJsonLd";

export const Route = createFileRoute("/conteudos/")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => ({
    q: typeof s.q === "string" && s.q ? s.q.slice(0, 120) : undefined,
  }),
  loader: async () => {
    const [content, seo] = await Promise.all([loadPostList(), loadPageSeo({ data: "/conteudos" })]);
    return { ...content, seo };
  },
  component: RouteComponent,
  head: ({ loaderData }) => seoHead({ jsonLd: loaderData?.posts ? postListJsonLd(loaderData.posts) : null, ...(loaderData?.seo ?? resolvePageSeo("/conteudos")), path: "/conteudos", keywords: "projeto de arquitetura, arquitetura e engenharia, engenharia civil, custo de reforma, quanto custa reformar um apartamento, custo de reforma de apartamento em SP, etapas de uma reforma, prazo de reforma de apartamento, reforma de apartamento em SP, Bewild" }),
});

function RouteComponent() {
  const posts = Route.useLoaderData()?.posts ?? null;
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/conteudos/" });
  return <BewildConteudosPage initialPosts={posts} query={q ?? ""} onQueryChange={(next) => navigate({ search: { q: next || undefined }, replace: true, resetScroll: false })} />;
}
