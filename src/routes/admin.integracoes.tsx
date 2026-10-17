import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import AdminChunk from "@/components/admin/AdminChunk";
import ProtectedRoute from "@/components/admin/ProtectedRoute";

const Page = lazy(() => import("@/pages/admin/IntegracoesPage"));

export const Route = createFileRoute("/admin/integracoes")({
  component: RouteComponent,
  head: () => ({
    meta: [
      { title: "Integrações API · Painel Bewild" },
      { name: "description", content: "Administração das integrações e chaves de consulta do Bewild." },
      { property: "og:title", content: "Integrações API · Painel Bewild" },
      { property: "og:description", content: "Administração das integrações e chaves de consulta do Bewild." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function RouteComponent() {
  return (
    <AdminChunk>
      <ProtectedRoute>
        <Page />
      </ProtectedRoute>
    </AdminChunk>
  );
}
