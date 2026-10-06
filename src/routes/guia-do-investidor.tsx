import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { seoHead } from "@/lib/routeHead";
import { GUIA_DESCRIPTION, GUIA_KEYWORDS, GUIA_PATH, GUIA_TITLE } from "@/guia/data/guiaMeta";

const GuiaInvestidorPage = lazy(() => import("@/pages/GuiaInvestidorPage"));

export const Route = createFileRoute("/guia-do-investidor")({
  component: () => (
    <Suspense fallback={null}>
      <GuiaInvestidorPage />
    </Suspense>
  ),
  head: () =>
    seoHead({
      // O guia não usa BwaNav (CSS global conflita com o dele).
      bwaCss: false,
      title: GUIA_TITLE,
      description: GUIA_DESCRIPTION,
      keywords: GUIA_KEYWORDS,
      path: GUIA_PATH,
      ogType: "article",
    }),
});
