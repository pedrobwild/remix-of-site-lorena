import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import AdminChunk from "@/components/admin/AdminChunk";
import ProtectedRoute from "@/components/admin/ProtectedRoute";

const Page = lazy(() => import("@/pages/admin/SeoPage"));

export const Route = createFileRoute("/admin/seo/")({
  component: RouteComponent,
  head: () => ({
    meta: [
      { title: "SEO e privacidade · Painel Bewild" },
      { name: "description", content: "Configurações de SEO, privacidade e origens dos pedidos de orçamento da Bewild." },
      { property: "og:title", content: "SEO e privacidade · Painel Bewild" },
      { property: "og:description", content: "Configurações de SEO, privacidade e origens dos pedidos de orçamento da Bewild." },
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
