import { createFileRoute, redirect } from "@tanstack/react-router";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/buscar")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => ({
    q: typeof s.q === "string" && s.q ? s.q.slice(0, 120) : undefined,
  }),
  beforeLoad: ({ search }) => { throw redirect({ to: "/conteudos", search: { q: search.q }, statusCode: 301 }); },
  head: () => seoHead({ title: "Buscar artigos | Bewild", description: "Pesquise os guias da Bewild sobre reforma, custo de obra, investimento e short stay em São Paulo pelo título ou pela descrição.", path: "/buscar", noindex: true }),
});

