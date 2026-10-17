import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import AdminChunk from "@/components/admin/AdminChunk";
import ProtectedRoute from "@/components/admin/ProtectedRoute";

const Page = lazy(() => import("@/pages/admin/LicencasAdminPage"));

export const Route = createFileRoute("/admin/citacoes")({
  component: RouteComponent,
  head: () => ({ meta: [
    { title: "Citações · Painel Bewild" },
    { name: "description", content: "Edição das licenças e dos modelos de citação da Bewild." },
    { property: "og:title", content: "Citações · Painel Bewild" },
    { property: "og:description", content: "Licenças e modelos de citação da Bewild para reportagens e estudos." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
});

function RouteComponent() {
  return <AdminChunk><ProtectedRoute><Page citations /></ProtectedRoute></AdminChunk>;
}