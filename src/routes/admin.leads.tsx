import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import AdminChunk from "@/components/admin/AdminChunk";
import ProtectedRoute from "@/components/admin/ProtectedRoute";

const Page = lazy(() => import("@/pages/admin/BewildLeadsAdminPage"));

export const Route = createFileRoute("/admin/leads")({
  component: RouteComponent,
  head: () => ({
    meta: [
      { title: "Leads e orçamentos · Painel Bewild" },
      { name: "description", content: "Pedidos de orçamento da Bewild por bairro e status, com acompanhamento dos leads do site." },
      { property: "og:title", content: "Leads e orçamentos · Painel Bewild" },
      { property: "og:description", content: "Acompanhamento dos pedidos de orçamento por bairro e status no painel Bewild." },
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
