import { createFileRoute } from "@tanstack/react-router";
import PrivacidadePage from "@/pages/PrivacidadePage";
import { PRIVACIDADE_SEO } from "@/content/pages/privacidade";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";

export const Route = createFileRoute("/privacidade")({
  component: PrivacidadePage,
  head: ({ matches }) => seoHead({ pagesSeo: rootPagesSeo(matches),
    ...PRIVACIDADE_SEO,
    path: "/privacidade",
    ogType: "website",
    extraMeta: [{ name: "twitter:card", content: "summary_large_image" }],
  }),
});
