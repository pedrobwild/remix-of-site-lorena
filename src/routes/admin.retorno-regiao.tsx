import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import AdminChunk from "@/components/admin/AdminChunk";
import ProtectedRoute from "@/components/admin/ProtectedRoute";

const Page = lazy(() => import("@/pages/admin/RegionReturnPage"));
export const Route = createFileRoute("/admin/retorno-regiao")({
  component: () => <AdminChunk><ProtectedRoute><Page /></ProtectedRoute></AdminChunk>,
  head: () => ({ meta: [
    { title: "Retorno por região | Painel Bewild" },
    { name: "description", content: "Leads e contratos assinados por bairro e campanha." },
    { property: "og:title", content: "Retorno por região | Painel Bewild" },
    { property: "og:description", content: "Retorno por região dos pedidos de orçamento." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
});