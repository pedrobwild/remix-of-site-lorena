import { createFileRoute } from "@tanstack/react-router";
import PerfilReformaPage from "@/pages/PerfilReformaPage";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";
// Conteúdo do estudo (src/content/perfilReforma.ts + dados em JSON) só por
// import dinâmico no loader: o head() entra no pacote inicial de toda página.

export const Route = createFileRoute("/perfil-de-quem-reforma-studio")({
  loader: async () => {
    const m = await import("@/content/perfilReforma");
    return { title: m.PERFIL_TITLE, description: m.PERFIL_DESCRIPTION, path: m.PERFIL_CANONICAL, jsonLd: m.PERFIL_JSONLD };
  },
  component: PerfilReformaPage,
  head: ({ loaderData, matches }) =>
    seoHead({
      pagesSeo: rootPagesSeo(matches),
      title: loaderData?.title ?? "Quem reforma studio em São Paulo | Perfil Bewild",
      description: loaderData?.description ?? "Perfil Bewild de quem pede orçamento de reforma de studio em São Paulo, com dados abertos da base de pedidos.",
      path: loaderData?.path ?? "/perfil-de-quem-reforma-studio",
      jsonLd: loaderData?.jsonLd ?? null,
    }),
});
