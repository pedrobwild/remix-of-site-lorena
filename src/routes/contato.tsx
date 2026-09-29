import { createFileRoute } from "@tanstack/react-router";
import ContatoPage from "@/pages/ContatoPage";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/contato")({
  component: ContatoPage,
  head: () => seoHead({ title: "Contato: escritório de arquitetura e reforma em SP | Bewild", description: "Fale com o time de arquitetura e engenharia da Bewild sobre seu projeto e a reforma do apartamento. WhatsApp, e-mail e escritório no Brooklin, São Paulo-SP.", path: "/contato" }),
});
