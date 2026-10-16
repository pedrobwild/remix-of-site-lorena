import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import AdminChunk from "@/components/admin/AdminChunk";
import ProtectedRoute from "@/components/admin/ProtectedRoute";

const Page = lazy(() => import("@/pages/admin/LicencasAdminPage"));

export const Route = createFileRoute("/admin/licencas")({
  component: RouteComponent,
  head: () => ({
    meta: [
      { title: "Licenças · Painel Bewild" },
      { name: "description", content: "Edição dos textos das licenças da Bewild." },
      { property: "og:title", content: "Licenças · Painel Bewild" },
      { property: "og:description", content: "Edição dos textos das licenças da Bewild." },
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
