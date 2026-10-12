import { createFileRoute } from "@tanstack/react-router";
import ContatoPage from "@/pages/ContatoPage";
import { seoHead } from "@/lib/routeHead";
import { loadPageSeo } from "@/lib/pageSeo.functions";
import { resolvePageSeo } from "@/lib/pageSeo";

export const Route = createFileRoute("/contato")({
  loader: () => loadPageSeo({ data: "/contato" }),
  component: ContatoPage,
  head: ({ loaderData }) => seoHead({ ...(loaderData ?? resolvePageSeo("/contato")), path: "/contato" }),
});
