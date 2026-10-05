import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import NotFoundPage from "@/pages/NotFoundPage";
import { isIncorporadorasEnabled } from "@/lib/incorporadorasFlag";
import { seoHead } from "@/lib/routeHead";
import { INCORPORADORAS_PAGE_ENABLED } from "@/config/site";
import { INCORP_PATH, INCORP_SEO } from "@/content/incorporadoras";

const IncorporadorasPage = lazy(() => import("@/pages/IncorporadorasPage"));

export const Route = createFileRoute("/parceiros/incorporadoras")({
  // Página atrás de flag: fora do ar para o público enquanto a flag estiver
  // desligada (só aparece na prévia interna com ?incorporadoras=1).
  component: () =>
    isIncorporadorasEnabled() ? (
      <Suspense fallback={null}>
        <IncorporadorasPage />
      </Suspense>
    ) : (
      <NotFoundPage />
    ),
  // HTML do servidor: com a flag ligada a página é pública (menu, rodapé e
  // sitemap), então sai indexável com o mesmo título/descrição do useSeo.
  // O Google não renderiza página que chega com noindex no HTML bruto — a troca
  // para index feita no navegador não adiantava. Flag desligada: noindex.
  head: () =>
    INCORPORADORAS_PAGE_ENABLED
      ? seoHead({
          title: INCORP_SEO.title,
          description: INCORP_SEO.description,
          keywords: INCORP_SEO.keywords,
          path: INCORP_PATH,
        })
      : seoHead({
          title: "Reforma pós-chaves para incorporadoras | Bewild",
          description: "Prévia interna do programa da Bewild para incorporadoras.",
          path: INCORP_PATH,
          noindex: true,
        }),
});
