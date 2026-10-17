import { createFileRoute } from "@tanstack/react-router";
import LegalPage from "@/pages/LegalPage";
import { LEGAL_PAGES } from "@/content/pages/legal";
import { loadLegalPage } from "@/lib/contentLoaders";
import { seoHead, rootPagesSeo } from "@/lib/routeHead";

export const Route = createFileRoute("/privacidade")({
  loader: () => loadLegalPage("privacidade"),
  component: RouteComponent,
  head: ({ matches }) => seoHead({ pagesSeo: rootPagesSeo(matches),
    ...LEGAL_PAGES.privacidade.seo,
    path: "/privacidade",
    ogType: "website",
    extraMeta: [{ name: "twitter:card", content: "summary_large_image" }],
  }),
});

function RouteComponent() {
  return <LegalPage slug="privacidade" content={Route.useLoaderData()} />;
}
