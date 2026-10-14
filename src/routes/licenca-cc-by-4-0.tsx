import { createFileRoute } from "@tanstack/react-router";
import LicencaPage from "@/pages/LicencaPage";
import { LICENCA_CANONICAL, LICENCA_SEO } from "@/content/pages/licenca";
import { seoHead, rootPagesSeo } from "@/lib/routeHead";
import { loadLicenca } from "@/lib/contentLoaders";

export const Route = createFileRoute("/licenca-cc-by-4-0")({
  loader: () => loadLicenca("cc-by-4-0"),
  component: RouteComponent,
  head: ({ matches }) =>
    seoHead({
      pagesSeo: rootPagesSeo(matches),
      ...LICENCA_SEO,
      path: LICENCA_CANONICAL,
      ogType: "website",
      extraMeta: [{ name: "twitter:card", content: "summary_large_image" }],
    }),
});

function RouteComponent() {
  return <LicencaPage slug="cc-by-4-0" content={Route.useLoaderData()} />;
}
