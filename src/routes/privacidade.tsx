import { createFileRoute } from "@tanstack/react-router";
import PrivacidadePage, { PRIVACIDADE_SEO } from "@/pages/PrivacidadePage";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/privacidade")({
  component: PrivacidadePage,
  head: () => seoHead({
    ...PRIVACIDADE_SEO,
    path: "/privacidade",
    ogType: "website",
    extraMeta: [{ name: "twitter:card", content: "summary_large_image" }],
  }),
});
