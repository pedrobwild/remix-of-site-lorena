import { createFileRoute, useNavigate } from "@tanstack/react-router";
import BewildConteudosPage from "@/pages/BewildConteudosPage";
import { seoHead } from "@/lib/routeHead";
import { loadPostList } from "@/lib/contentLoaders";
import { postListJsonLd } from "@/lib/contentJsonLd";

export const Route = createFileRoute("/conteudos/")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => ({
    q: typeof s.q === "string" && s.q ? s.q.slice(0, 120) : undefined,
  }),
  loader: () => loadPostList(),
  component: RouteComponent,
  head: ({ loaderData }) => seoHead({ jsonLd: loaderData?.posts ? postListJsonLd(loaderData.posts) : null, title: "Arquitetura, engenharia e custo de reforma em SP: guias | Bewild", description: "Guias práticos da Bewild sobre projeto de arquitetura, engenharia, custo, etapas e prazo de obra para reformar apartamento em São Paulo.", path: "/conteudos", keywords: "projeto de arquitetura, arquitetura e engenharia, engenharia civil, custo de reforma, quanto custa reformar um apartamento, custo de reforma de apartamento em SP, etapas de uma reforma, prazo de reforma de apartamento, reforma de apartamento em SP, Bewild" }),
});

function RouteComponent() {
  const posts = Route.useLoaderData()?.posts ?? null;
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/conteudos/" });
  return <BewildConteudosPage initialPosts={posts} query={q ?? ""} onQueryChange={(next) => navigate({ search: { q: next || undefined }, replace: true, resetScroll: false })} />;
}
