import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import AdminChunk from "@/components/admin/AdminChunk";
import ProtectedRoute from "@/components/admin/ProtectedRoute";

const Page = lazy(() => import("@/pages/admin/ColetasRadarAdminPage"));

export const Route = createFileRoute("/admin/coletas-radar")({
  component: RouteComponent,
  head: () => ({ meta: [
    { title: "Coletas do Radar · Painel Bewild" },
    { name: "description", content: "Histórico de coletas do Radar Bewild por bairro, período, fonte e situação." },
    { property: "og:title", content: "Coletas do Radar · Painel Bewild" },
    { property: "og:description", content: "Histórico de coletas do Radar Bewild por bairro, período, fonte e situação." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
});

export function RouteComponent() {
  return <AdminChunk><ProtectedRoute><Page /></ProtectedRoute></AdminChunk>;
}