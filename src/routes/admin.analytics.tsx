import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import AdminChunk from "@/components/admin/AdminChunk";
import ProtectedRoute from "@/components/admin/ProtectedRoute";

const Page = lazy(() => import("@/pages/admin/AnalyticsPage"));

export const Route = createFileRoute("/admin/analytics")({
  component: RouteComponent,
  head: () => ({
    meta: [
      { title: "Analytics e cliques · Bewild" },
      { name: "description", content: "Painel administrativo de visitas, cliques e campanhas da Bewild." },
      { property: "og:title", content: "Analytics e cliques · Bewild" },
      { property: "og:description", content: "Painel administrativo de visitas, cliques e campanhas da Bewild." },
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
