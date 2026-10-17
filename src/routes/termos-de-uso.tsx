import { createFileRoute } from "@tanstack/react-router";
import LegalPage from "@/pages/LegalPage";
import { LEGAL_PAGES } from "@/content/pages/legal";
import { loadLegalPage } from "@/lib/contentLoaders";
import { seoHead, rootPagesSeo } from "@/lib/routeHead";

export const Route = createFileRoute("/termos-de-uso")({
  loader: () => loadLegalPage("termos-de-uso"),
  component: RouteComponent,
  head: ({ matches }) => seoHead({ pagesSeo: rootPagesSeo(matches),
    ...LEGAL_PAGES["termos-de-uso"].seo,
    path: "/termos-de-uso",
    ogType: "website",
    extraMeta: [{ name: "twitter:card", content: "summary_large_image" }],
  }),
});

function RouteComponent() {
  return <LegalPage slug="termos-de-uso" content={Route.useLoaderData()} />;
}
