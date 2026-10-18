import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import AdminChunk from "@/components/admin/AdminChunk";
import ProtectedRoute from "@/components/admin/ProtectedRoute";

const Page = lazy(() => import("@/pages/admin/GoogleAdsServicesPage"));
export const Route = createFileRoute("/admin/google-ads")({
  component: () => <AdminChunk><ProtectedRoute><Page /></ProtectedRoute></AdminChunk>,
  head: () => ({ meta: [
    { title: "Google Ads por serviço | Painel Bewild" },
    { name: "description", content: "Campanhas, variantes e pesos de Google Ads com cliques e conversões por página de serviço." },
    { property: "og:title", content: "Google Ads por serviço | Painel Bewild" },
    { property: "og:description", content: "Cliques e pedidos confirmados no CRM por campanha e página de serviço." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
});
