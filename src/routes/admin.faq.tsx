import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import AdminChunk from "@/components/admin/AdminChunk";
import ProtectedRoute from "@/components/admin/ProtectedRoute";

const Page = lazy(() => import("@/pages/admin/FaqAdminPage"));

export const Route = createFileRoute("/admin/faq")({
  component: RouteComponent,
  head: () => ({
    meta: [
      { title: "Painel · Bewild" },
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
