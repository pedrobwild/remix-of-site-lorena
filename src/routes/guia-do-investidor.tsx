import { lazy, Suspense } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { RADAR_URL } from "@/config/site";
import { seoHead } from "@/lib/routeHead";

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
  // Nunca chega a renderizar (beforeLoad redireciona): título/descrição mínimos
  // e sem JSON-LD, para não carregar src/guia/data/guiaMeta.ts (~7 kB) no
  // pacote inicial de toda página. Fica noindex por garantia.
  head: () =>
    seoHead({
      // O guia não usa BwaNav (CSS global conflita com o dele).
      bwaCss: false,
      title: "Guia do investidor em studios | Bewild",
      description: "O Guia do investidor da Bewild agora é o Radar Bewild.",
      path: "/guia-do-investidor",
      ogType: "article",
      noindex: true,
    }),
});
