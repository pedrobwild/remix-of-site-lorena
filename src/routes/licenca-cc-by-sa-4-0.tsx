import { createFileRoute } from "@tanstack/react-router";
import LicencaPage from "@/pages/LicencaPage";
import { seoHead, rootPagesSeo } from "@/lib/routeHead";
// Import tardio: o loader da rota entra no pacote de TODA página; assim os
// carregadores de conteúdo (posts, projetos, vídeos…) só baixam quando usados.
const contentLoaders = () => import("@/lib/contentLoaders");
// O padrão das licenças (src/content/pages/licencas.ts, ~9 kB) também só por
// import dinâmico no loader: o head() entra no pacote inicial de toda página.

export const Route = createFileRoute("/licenca-cc-by-sa-4-0")({
  loader: async () => {
    const [content, { LICENCAS }] = await Promise.all([
      contentLoaders().then((m) => m.loadLicenca("cc-by-sa-4-0")),
      import("@/content/pages/licencas"),
    ]);
    const L = LICENCAS["cc-by-sa-4-0"];
    return { content, seo: { ...L.seo, path: L.path } };
  },
  component: RouteComponent,
  head: ({ loaderData, matches }) =>
    seoHead({
      pagesSeo: rootPagesSeo(matches),
      title: loaderData?.seo.title ?? "Licença CC BY-SA 4.0 | Bewild",
      description: loaderData?.seo.description ?? "Termos da licença Creative Commons BY-SA 4.0 aplicada a conteúdos da Bewild.",
      ...(loaderData?.seo ?? {}),
      path: loaderData?.seo.path ?? "/licenca-cc-by-sa-4-0",
      ogType: "website",
      extraMeta: [{ name: "twitter:card", content: "summary_large_image" }],
    }),
});

function RouteComponent() {
  return <LicencaPage slug="cc-by-sa-4-0" content={Route.useLoaderData()?.content ?? null} />;
}
