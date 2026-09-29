import { createFileRoute } from "@tanstack/react-router";
import PreferenciasCookiesPage from "@/pages/PreferenciasCookiesPage";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/preferencias-de-cookies")({
  component: PreferenciasCookiesPage,
  head: () => seoHead({ title: "Preferências de cookies | Bewild", description: "Veja e mude sua escolha sobre cookies de medição e publicidade do site da Bewild a qualquer momento.", path: "/preferencias-de-cookies" }),
});
