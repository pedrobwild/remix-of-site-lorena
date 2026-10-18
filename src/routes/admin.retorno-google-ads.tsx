import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import AdminChunk from "@/components/admin/AdminChunk";
import ProtectedRoute from "@/components/admin/ProtectedRoute";

const Page = lazy(() => import("@/pages/admin/AdsReturnPage"));
export const Route = createFileRoute("/admin/retorno-google-ads")({
  component: () => <AdminChunk><ProtectedRoute><Page /></ProtectedRoute></AdminChunk>,
  head: () => ({ meta: [
    { title: "Retorno real do Google Ads | Painel Bewild" },
    { name: "description", content: "Leads confirmados, peso médio e valor real do CRM por campanha do Google Ads." },
    { property: "og:title", content: "Retorno real do Google Ads | Painel Bewild" },
    { property: "og:description", content: "Retorno real por campanha do Google Ads, com dados do CRM." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
});
