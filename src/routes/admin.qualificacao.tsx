import { createFileRoute, redirect } from "@tanstack/react-router";

// A qualificação passou a vir do funil do Bwild Engine e mora em /admin/leads.
export const Route = createFileRoute("/admin/qualificacao")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/leads", statusCode: 301 });
  },
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
});
