import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import AdminChunk from "@/components/admin/AdminChunk";

const Page = lazy(() => import("@/pages/admin/LoginPage"));

export const Route = createFileRoute("/admin/login")({
  component: RouteComponent,
  head: () => ({
    meta: [
      { title: "Painel · Bewild" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function RouteComponent() {
  return (
    <AdminChunk>
      <Page />
    </AdminChunk>
  );
}
