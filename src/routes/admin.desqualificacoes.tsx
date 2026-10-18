import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import AdminChunk from "@/components/admin/AdminChunk";
import ProtectedRoute from "@/components/admin/ProtectedRoute";

const Page = lazy(() => import("@/pages/admin/GoogleAdsDisqualificationsPage"));
export const Route = createFileRoute("/admin/desqualificacoes")({
  component: () => <AdminChunk><ProtectedRoute><Page /></ProtectedRoute></AdminChunk>,
  head: () => ({ meta: [
    { title: "Desqualificações do Google Ads | Painel Bewild" },
    { name: "description", content: "Compare desqualificações por finalidade, bairro, metragem e situação das chaves no painel Bewild." },
    { property: "og:title", content: "Desqualificações do Google Ads | Painel Bewild" },
    { property: "og:description", content: "Qualidade dos leads por perfil, campanha e período, com status sincronizado do CRM." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
});