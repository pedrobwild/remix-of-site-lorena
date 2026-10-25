import { createFileRoute } from "@tanstack/react-router";
import ReformaApartamentoSpPage from "@/pages/ReformaApartamentoSpPage";
import { APARTAMENTO_SP_JSONLD } from "@/content/pages/reforma-de-apartamento-sao-paulo";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";
// Import tardio: o loader da rota entra no pacote de TODA página; assim os
// carregadores de conteúdo (posts, projetos, vídeos…) só baixam quando usados.
const contentLoaders = () => import("@/lib/contentLoaders");

export const Route = createFileRoute("/reforma-de-apartamento-sao-paulo")({
  loader: () => contentLoaders().then((m) => m.loadBairroLinks()),
  component: RouteComponent,
  head: ({ matches }) => seoHead({ pagesSeo: rootPagesSeo(matches), title: "Empresa de reforma de apartamento em São Paulo | Bewild", description: "Reforma de apartamento em SP com arquitetura e engenharia próprias: projeto 3D, obra, marcenaria e mobília num contrato, preço fechado e 5 anos de garantia.", path: "/reforma-de-apartamento-sao-paulo", jsonLd: APARTAMENTO_SP_JSONLD }),
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <ReformaApartamentoSpPage bairroPages={data?.bairroPages ?? null} />;
}
