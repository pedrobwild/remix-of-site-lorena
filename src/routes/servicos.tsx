import { createFileRoute } from "@tanstack/react-router";
import ServicosPage from "@/pages/ServicosPage";
import { SERVICOS_JSONLD } from "@/content/pages/servicos";
import { seoHead } from "@/lib/routeHead";
import { loadBastidoresSeo, loadPageSeo } from "@/lib/pageSeo.functions";
import { resolvePageSeo } from "@/lib/pageSeo";
import { bastidoresJsonLd } from "@/lib/bastidoresJsonLd";

export const Route = createFileRoute("/servicos")({
  loader: async () => {
    const [seo, bastidores] = await Promise.all([
      loadPageSeo({ data: "/servicos" }),
      loadBastidoresSeo().catch(() => ({})),
    ]);
    return { seo, bastidores };
  },
  component: ServicosPage,
  head: ({ loaderData }) =>
    seoHead({
      ...(loaderData?.seo ?? resolvePageSeo("/servicos")),
      path: "/servicos",
      jsonLd: [...SERVICOS_JSONLD, bastidoresJsonLd(undefined, loaderData?.bastidores ?? {})],
    }),
});
