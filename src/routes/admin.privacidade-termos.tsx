import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import AdminChunk from "@/components/admin/AdminChunk";
import ProtectedRoute from "@/components/admin/ProtectedRoute";

const Page = lazy(() => import("@/pages/admin/LegalAdminPage"));

export const Route = createFileRoute("/admin/privacidade-termos")({
  component: RouteComponent,
  head: () => ({
    meta: [
      { title: "Privacidade e termos · Painel Bewild" },
      { name: "description", content: "Edição dos textos das páginas de privacidade e termos de uso." },
      { property: "og:title", content: "Privacidade e termos · Painel Bewild" },
      { property: "og:description", content: "Edição dos textos das páginas de privacidade e termos de uso." },
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
