import { createFileRoute } from "@tanstack/react-router";
import PrivacidadePage from "@/pages/PrivacidadePage";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/privacidade")({
  component: PrivacidadePage,
  head: () => seoHead({ title: "Política de privacidade | Bewild", description: "Como a Bewild coleta, usa e protege os dados de clientes e interessados em projetos e reformas de apartamentos.", path: "/privacidade" }),
});
