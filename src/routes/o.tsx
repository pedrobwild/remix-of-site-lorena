import { createFileRoute } from "@tanstack/react-router";
import LpObraPage from "@/pages/LpObraPage";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/o")({
  component: LpObraPage,
  head: () => seoHead({ title: "Obra Bewild · acompanhamento", description: "Página da placa de obra Bewild. Veja o portal de acompanhamento do studio.", path: "/o", noindex: true }),
});
