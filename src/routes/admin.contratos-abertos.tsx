import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import AdminChunk from "@/components/admin/AdminChunk";
import ProtectedRoute from "@/components/admin/ProtectedRoute";
const Page = lazy(() => import("@/pages/admin/OpenContractsPage"));
export const Route = createFileRoute("/admin/contratos-abertos")({
  component: () => <AdminChunk><ProtectedRoute><Page /></ProtectedRoute></AdminChunk>,
  head: () => ({ meta: [
    { title: "Contratos em aberto | Painel Bewild" },
    { name: "description", content: "Negócios aguardando assinatura e contratos com valores e datas reais informados pelo CRM." },
    { property: "og:title", content: "Contratos em aberto | Painel Bewild" },
    { property: "og:description", content: "Acompanhamento de negócios, valores e assinaturas no painel Bewild." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
});