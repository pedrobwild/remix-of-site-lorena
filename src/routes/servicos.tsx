import { createFileRoute } from "@tanstack/react-router";
import ServicosPage from "@/pages/ServicosPage";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";
import { loadBastidoresSeo, loadPageSeo } from "@/lib/pageSeo.functions";
import { resolvePageSeo } from "@/lib/pageSeo";
import { bastidoresJsonLd } from "@/lib/bastidoresJsonLd";
// Conteúdo da página (JSON-LD, FAQ, textos) só por import dinâmico no loader:
// o head() e o loader de toda rota entram no pacote inicial de QUALQUER página
// (velocidade, 09/11/2026). Ver "montadores pesados" em routesCodeSplit.test.ts.

export const Route = createFileRoute("/servicos")({
  loader: async () => {
    const [seo, bastidores, content] = await Promise.all([
      loadPageSeo({ data: "/servicos" }),
      loadBastidoresSeo().catch(() => ({})),
      import("@/content/pages/servicos"),
    ]);
    return { seo, bastidores, jsonLd: content.SERVICOS_JSONLD };
  },
  component: ServicosPage,
  head: ({ loaderData, matches }) =>
    seoHead({ pagesSeo: rootPagesSeo(matches),
      ...(loaderData?.seo ?? resolvePageSeo("/servicos")),
      path: "/servicos",
      jsonLd: [...(loaderData?.jsonLd ?? []), bastidoresJsonLd(undefined, loaderData?.bastidores ?? {})],
    }),
});
