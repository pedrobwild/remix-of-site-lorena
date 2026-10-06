import { createFileRoute } from "@tanstack/react-router";
import ReformaApartamentoSpPage from "@/pages/ReformaApartamentoSpPage";
import { APARTAMENTO_SP_JSONLD } from "@/content/pages/reforma-de-apartamento-sao-paulo";
import { seoHead } from "@/lib/routeHead";
import { loadBairroLinks } from "@/lib/contentLoaders";

export const Route = createFileRoute("/reforma-de-apartamento-sao-paulo")({
  loader: () => loadBairroLinks(),
  component: RouteComponent,
  head: () => seoHead({ title: "Empresa de reforma de apartamento em São Paulo | Bewild", description: "Reforma de apartamento em SP com arquitetura e engenharia próprias: projeto 3D, obra, marcenaria e mobília num contrato, preço fechado e 5 anos de garantia.", path: "/reforma-de-apartamento-sao-paulo", jsonLd: APARTAMENTO_SP_JSONLD }),
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <ReformaApartamentoSpPage bairroPages={data?.bairroPages ?? null} />;
}
