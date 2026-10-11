import { createFileRoute } from "@tanstack/react-router";
import LealMoreiraPage from "@/pages/LealMoreiraPage";
import { seoHead, SITE_BASE } from "@/lib/routeHead";
import { LEAL_HERO_ALT, LEAL_HERO_IMAGE, LEAL_PATH, LEAL_SEO } from "@/content/lealMoreira";
import { loadLeal } from "@/lib/lealMoreiraLoader";

function LealRoute() {
  const initial = Route.useLoaderData();
  return <LealMoreiraPage initial={initial} />;
}

export const Route = createFileRoute("/parceiros/leal-moreira")({
  loader: () => loadLeal(),
  component: LealRoute,
  head: () =>
    seoHead({
      title: LEAL_SEO.title,
      description: LEAL_SEO.description,
      keywords: LEAL_SEO.keywords,
      path: LEAL_PATH,
      ogImage: `${SITE_BASE}${LEAL_HERO_IMAGE}`,
      ogImageAlt: LEAL_HERO_ALT,
    }),
});
