import { createFileRoute } from "@tanstack/react-router";
import LicencaPage from "@/pages/LicencaPage";
import { LICENCAS } from "@/content/pages/licencas";
import { seoHead, rootPagesSeo } from "@/lib/routeHead";
// Import tardio: o loader da rota entra no pacote de TODA página; assim os
// carregadores de conteúdo (posts, projetos, vídeos…) só baixam quando usados.
const contentLoaders = () => import("@/lib/contentLoaders");

const L = LICENCAS["cc-by-sa-4-0"];

export const Route = createFileRoute("/licenca-cc-by-sa-4-0")({
  loader: () => contentLoaders().then((m) => m.loadLicenca("cc-by-sa-4-0")),
  component: RouteComponent,
  head: ({ matches }) =>
    seoHead({
      pagesSeo: rootPagesSeo(matches),
      ...L.seo,
      path: L.path,
      ogType: "website",
      extraMeta: [{ name: "twitter:card", content: "summary_large_image" }],
    }),
});

function RouteComponent() {
  return <LicencaPage slug="cc-by-sa-4-0" content={Route.useLoaderData()} />;
}
