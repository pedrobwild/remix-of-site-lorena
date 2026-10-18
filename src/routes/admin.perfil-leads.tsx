import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import AdminChunk from "@/components/admin/AdminChunk";
import ProtectedRoute from "@/components/admin/ProtectedRoute";

const Page = lazy(() => import("@/pages/admin/LeadProfilesPage"));
export const Route = createFileRoute("/admin/perfil-leads")({
  component: () => <AdminChunk><ProtectedRoute><Page /></ProtectedRoute></AdminChunk>,
  head: () => ({ meta: [
    { title: "Perfil dos leads | Painel Bewild" },
    { name: "description", content: "Finalidade, bairro, metragem e chaves de cada pedido de orçamento, para revisão manual." },
    { property: "og:title", content: "Perfil dos leads | Painel Bewild" },
    { property: "og:description", content: "Revisão manual do perfil do imóvel de cada lead do formulário." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
});