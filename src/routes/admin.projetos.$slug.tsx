import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import AdminChunk from "@/components/admin/AdminChunk";
import ProtectedRoute from "@/components/admin/ProtectedRoute";

const Page = lazy(() => import("@/pages/admin/BewildProjectFormPage"));

export const Route = createFileRoute("/admin/projetos/$slug")({
  component: RouteComponent,
  head: () => ({
    meta: [
      { title: "Painel · Bewild" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function RouteComponent() {
  const { slug } = Route.useParams();
  return (
    <AdminChunk>
      <ProtectedRoute>
        <Page slug={slug} />
      </ProtectedRoute>
    </AdminChunk>
  );
}
