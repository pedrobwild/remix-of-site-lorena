import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import AdminChunk from "@/components/admin/AdminChunk";
import ProtectedRoute from "@/components/admin/ProtectedRoute";

const Page = lazy(() => import("@/pages/admin/ConfirmedBudgetsPage"));

export const Route = createFileRoute("/admin/orcamentos")({
  component: RouteComponent,
  head: () => ({
    meta: [
      { title: "Orçamentos confirmados · Painel Bewild" },
      { name: "description", content: "Pedidos de orçamento que viraram contratos confirmados no Bwild Engine." },
      { property: "og:title", content: "Orçamentos confirmados · Painel Bewild" },
      { property: "og:description", content: "Acompanhamento dos pedidos de orçamento ganhos no CRM." },
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
