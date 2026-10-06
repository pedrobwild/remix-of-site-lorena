import { createFileRoute, useNavigate } from "@tanstack/react-router";
import BewildBuscaPage from "@/pages/BewildBuscaPage";
import { seoHead } from "@/lib/routeHead";
import { loadPostList } from "@/lib/contentLoaders";

export const Route = createFileRoute("/buscar")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => ({
    q: typeof s.q === "string" && s.q ? s.q.slice(0, 120) : undefined,
  }),
  loader: () => loadPostList(),
  component: RouteComponent,
  head: () => seoHead({ title: "Buscar artigos | Bewild", description: "Pesquise os guias da Bewild sobre reforma, custo de obra, investimento e short stay em São Paulo pelo título ou pela descrição.", path: "/buscar", noindex: true }),
});

function RouteComponent() {
  const posts = Route.useLoaderData()?.posts ?? null;
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/buscar" });
  return (
    <BewildBuscaPage
      initialPosts={posts}
      query={q ?? ""}
      onQueryChange={(next) => navigate({ search: { q: next || undefined }, replace: true })}
    />
  );
}
