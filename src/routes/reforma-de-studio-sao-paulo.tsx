import { createFileRoute } from "@tanstack/react-router";
import ReformaStudioSpPage from "@/pages/ReformaStudioSpPage";
import { STUDIO_SP_JSONLD } from "@/content/pages/reforma-de-studio-sao-paulo";
import { seoHead } from "@/lib/routeHead";
import { loadBairroLinks } from "@/lib/contentLoaders";

export const Route = createFileRoute("/reforma-de-studio-sao-paulo")({
  loader: () => loadBairroLinks(),
  component: RouteComponent,
  head: () => seoHead({ title: "Reforma de studios em SP: morar, alugar ou Airbnb | Bewild", description: "Reforma de studios em São Paulo para morar, alugar ou anunciar no Airbnb: projeto 3D, obra, marcenaria e mobília em um contrato, preço fechado, 60 dias úteis e 5 anos de garantia.", path: "/reforma-de-studio-sao-paulo", jsonLd: STUDIO_SP_JSONLD }),
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <ReformaStudioSpPage bairroPages={data?.bairroPages ?? null} />;
}
