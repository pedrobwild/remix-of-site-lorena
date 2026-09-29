import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import NotFoundPage from "@/pages/NotFoundPage";
import { isIncorporadorasEnabled } from "@/lib/incorporadorasFlag";
import { seoHead } from "@/lib/routeHead";

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
  head: () =>
    seoHead({
      title: "Reforma pós-chaves para incorporadoras | Bewild",
      description: "Prévia interna do programa da Bewild para incorporadoras.",
      path: "/parceiros/incorporadoras",
      noindex: true,
    }),
});
