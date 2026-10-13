import { createFileRoute } from "@tanstack/react-router";
import PoliticaCookiesPage from "@/pages/PoliticaCookiesPage";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";

export const Route = createFileRoute("/politica-de-cookies")({
  component: PoliticaCookiesPage,
  head: ({ matches }) => seoHead({ pagesSeo: rootPagesSeo(matches), title: "Política de cookies | Bewild", description: "Quais cookies o site da Bewild usa, para quê, por quanto tempo e como aceitar, recusar ou mudar sua escolha a qualquer momento.", path: "/politica-de-cookies" }),
});
