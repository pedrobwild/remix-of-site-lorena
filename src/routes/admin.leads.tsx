import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import AdminChunk from "@/components/admin/AdminChunk";
import ProtectedRoute from "@/components/admin/ProtectedRoute";

const Page = lazy(() => import("@/pages/admin/BewildLeadsAdminPage"));

export const Route = createFileRoute("/admin/leads")({
  component: RouteComponent,
  head: () => ({
    meta: [
      { title: "Leads e propostas · Painel Bewild" },
      { name: "description", content: "Contatos do site, etapas do CRM e propostas publicadas no painel Bewild." },
      { property: "og:title", content: "Leads e propostas · Painel Bewild" },
      { property: "og:description", content: "Contatos do site, etapas do CRM e propostas publicadas no painel Bewild." },
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
