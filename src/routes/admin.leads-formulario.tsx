import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import AdminChunk from "@/components/admin/AdminChunk";
import ProtectedRoute from "@/components/admin/ProtectedRoute";

const Page = lazy(() => import("@/pages/admin/FormLeadsPage"));
export const Route = createFileRoute("/admin/leads-formulario")({
  component: () => <AdminChunk><ProtectedRoute><Page /></ProtectedRoute></AdminChunk>,
  head: () => ({ meta: [
    { title: "Leads do formulário | Painel Bewild" },
    { name: "description", content: "Leads de orçamento por data, variante, origem e status no CRM da Bewild." },
    { property: "og:title", content: "Leads do formulário | Painel Bewild" },
    { property: "og:description", content: "Acompanhamento administrativo dos pedidos de orçamento e suas etapas no CRM." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
});