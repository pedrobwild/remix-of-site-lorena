import { createFileRoute } from "@tanstack/react-router";
import OndeAtuamosPage from "@/pages/OndeAtuamosPage";
import { ONDE_ATUAMOS_JSONLD } from "@/content/pages/onde-atuamos";
import { seoHead } from "@/lib/routeHead";
import { loadBairroLinks } from "@/lib/contentLoaders";

export const Route = createFileRoute("/onde-atuamos")({
  loader: () => loadBairroLinks(),
  component: RouteComponent,
  head: () => seoHead({ title: "Onde atuamos: arquitetura e reforma em São Paulo | Bewild", description: "A Bewild projeta e reforma apartamentos em São Paulo capital, em mais de 27 bairros, e atende à distância clientes de outras cidades.", path: "/onde-atuamos", jsonLd: ONDE_ATUAMOS_JSONLD }),
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <OndeAtuamosPage bairroPages={data?.bairroPages ?? null} />;
}
