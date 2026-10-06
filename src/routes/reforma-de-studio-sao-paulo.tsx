import { createFileRoute } from "@tanstack/react-router";
import ReformaStudioSpPage from "@/pages/ReformaStudioSpPage";
import { STUDIO_SP_JSONLD } from "@/content/pages/reforma-de-studio-sao-paulo";
import { seoHead } from "@/lib/routeHead";
import { loadBairroLinks } from "@/lib/contentLoaders";

export const Route = createFileRoute("/reforma-de-studio-sao-paulo")({
  loader: () => loadBairroLinks(),
  component: RouteComponent,
  head: () => seoHead({ title: "Reforma de studio em São Paulo para morar ou alugar | Bewild", description: "Reforma de studio em São Paulo, pronto para morar ou para short stay: projeto, obra, marcenaria e mobília em um contrato, preço fechado e 5 anos de garantia.", path: "/reforma-de-studio-sao-paulo", jsonLd: STUDIO_SP_JSONLD }),
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <ReformaStudioSpPage bairroPages={data?.bairroPages ?? null} />;
}
