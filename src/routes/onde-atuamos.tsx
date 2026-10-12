import { createFileRoute } from "@tanstack/react-router";
import OndeAtuamosPage from "@/pages/OndeAtuamosPage";
import { ONDE_ATUAMOS_DESCRIPTION, ONDE_ATUAMOS_JSONLD, ONDE_ATUAMOS_TITLE } from "@/content/pages/onde-atuamos";
import { seoHead } from "@/lib/routeHead";
import { loadBairroLinks } from "@/lib/contentLoaders";

export const Route = createFileRoute("/onde-atuamos")({
  loader: () => loadBairroLinks(),
  component: RouteComponent,
  head: () => seoHead({ title: ONDE_ATUAMOS_TITLE, description: ONDE_ATUAMOS_DESCRIPTION, path: "/onde-atuamos", jsonLd: ONDE_ATUAMOS_JSONLD }),
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <OndeAtuamosPage bairroPages={data?.bairroPages ?? null} />;
}
