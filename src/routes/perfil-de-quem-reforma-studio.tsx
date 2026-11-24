import { createFileRoute } from "@tanstack/react-router";
import PerfilReformaPage from "@/pages/PerfilReformaPage";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";
// Conteúdo do estudo (src/content/perfilReforma.ts + dados em JSON) só por
// import dinâmico no loader: o head() entra no pacote inicial de toda página.

export const Route = createFileRoute("/perfil-de-quem-reforma-studio")({
  loader: async () => {
    const m = await import("@/content/perfilReforma");
    const { postAuthorJsonLd } = await import("@/lib/postSeo");
    return {
      title: m.PERFIL_TITLE,
      description: m.PERFIL_DESCRIPTION,
      path: m.PERFIL_CANONICAL,
      jsonLd: m.PERFIL_JSONLD,
      ogImage: m.PERFIL_OG_IMAGE,
      ogImageAlt: m.PERFIL_OG_ALT,
      // Revisão técnica do estudo no nó WebPage, como nos artigos.
      pageJsonLd: { reviewedBy: postAuthorJsonLd(m.PERFIL_REVISOR.nome), lastReviewed: m.PERFIL_REVISADO_EM },
    };
  },
  component: PerfilReformaPage,
  head: ({ loaderData, matches }) =>
    seoHead({
      pagesSeo: rootPagesSeo(matches),
      title: loaderData?.title ?? "Perfil Bewild de Quem Reforma Studio",
      description: loaderData?.description ?? "Perfil Bewild de quem pede orçamento de reforma de studio em São Paulo, com dados abertos da base de pedidos.",
      path: loaderData?.path ?? "/perfil-de-quem-reforma-studio",
      jsonLd: loaderData?.jsonLd ?? null,
      ogImage: loaderData?.ogImage ?? null,
      ogImageAlt: loaderData?.ogImageAlt,
      pageJsonLd: loaderData?.pageJsonLd ?? null,
    }),
});
