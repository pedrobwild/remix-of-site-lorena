import { lazy, Suspense } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { RADAR_URL } from "@/config/site";
import { seoHead } from "@/lib/routeHead";
import { GUIA_DESCRIPTION, GUIA_KEYWORDS, GUIA_PATH, GUIA_TITLE, guiaJsonLd } from "@/guia/data/guiaMeta";

const GuiaInvestidorPage = lazy(() => import("@/pages/GuiaInvestidorPage"));


export const Route = createFileRoute("/guia-do-investidor")({
  // O site é servido pela hospedagem da Lovable, que não lê o vercel.json:
  // o 301 para o Radar sai daqui, no servidor (mesmo padrão de /diagnostico).
  beforeLoad: () => {
    throw redirect({ href: RADAR_URL, statusCode: 301 });
  },
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
      jsonLd: guiaJsonLd({ breadcrumb: false }),
      // Nunca chega a renderizar (beforeLoad redireciona); fica noindex por garantia.
      noindex: true,
    }),
});
