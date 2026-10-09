import { createFileRoute } from "@tanstack/react-router";
import ServicosPage from "@/pages/ServicosPage";
import { SERVICOS_JSONLD } from "@/content/pages/servicos";
import { seoHead } from "@/lib/routeHead";
import { loadPageSeo } from "@/lib/pageSeo.functions";
import { resolvePageSeo } from "@/lib/pageSeo";

export const Route = createFileRoute("/servicos")({
  loader: () => loadPageSeo({ data: "/servicos" }),
  component: ServicosPage,
  head: ({ loaderData }) => seoHead({ ...(loaderData ?? resolvePageSeo("/servicos")), path: "/servicos", jsonLd: SERVICOS_JSONLD }),
});
