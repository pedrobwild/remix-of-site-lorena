import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import AdminChunk from "@/components/admin/AdminChunk";
import ProtectedRoute from "@/components/admin/ProtectedRoute";

const Page = lazy(() => import("@/pages/admin/LeadValuesPage"));
export const Route = createFileRoute("/admin/valor-leads")({
  component: () => <AdminChunk><ProtectedRoute><Page /></ProtectedRoute></AdminChunk>,
  head: () => ({ meta: [
    { title: "Valor dos leads no CRM | Painel Bewild" },
    { name: "description", content: "Valor real dos contratos de cada lead no CRM, agrupado por variante e origem." },
    { property: "og:title", content: "Valor dos leads no CRM | Painel Bewild" },
    { property: "og:description", content: "Contratos reais do CRM por variante do Google Ads e origem do lead." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
});
