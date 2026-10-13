import { createFileRoute } from "@tanstack/react-router";
import ReformaStudioSpPage from "@/pages/ReformaStudioSpPage";
import { SEO_DESCRIPTION, SEO_TITLE, STUDIO_SP_JSONLD } from "@/content/pages/reforma-de-studio-sao-paulo";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";
import { loadBairroLinks } from "@/lib/contentLoaders";

export const Route = createFileRoute("/reforma-de-studio-sao-paulo")({
  loader: () => loadBairroLinks(),
  component: RouteComponent,
  head: ({ matches }) => seoHead({ pagesSeo: rootPagesSeo(matches), title: SEO_TITLE, description: SEO_DESCRIPTION, path: "/reforma-de-studio-sao-paulo", jsonLd: STUDIO_SP_JSONLD }),
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <ReformaStudioSpPage bairroPages={data?.bairroPages ?? null} />;
}
