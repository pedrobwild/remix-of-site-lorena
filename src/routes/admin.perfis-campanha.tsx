import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import AdminChunk from "@/components/admin/AdminChunk";
import ProtectedRoute from "@/components/admin/ProtectedRoute";

const Page = lazy(() => import("@/pages/admin/CampaignProfilesPage"));
export const Route = createFileRoute("/admin/perfis-campanha")({
  component: () => <AdminChunk><ProtectedRoute><Page /></ProtectedRoute></AdminChunk>,
  head: () => ({ meta: [
    { title: "Perfis por campanha | Painel Bewild" },
    { name: "description", content: "Leads e desqualificações por campanha, bairro, metragem e finalidade." },
    { property: "og:title", content: "Perfis por campanha | Painel Bewild" },
    { property: "og:description", content: "Perfis atraídos por cada campanha." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
});