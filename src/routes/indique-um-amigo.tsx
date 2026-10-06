import { createFileRoute } from "@tanstack/react-router";
import IndiquePage, { INDIQUE_JSONLD } from "@/pages/IndiquePage";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/indique-um-amigo")({
  component: IndiquePage,
  head: () => seoHead({ title: "Indique um amigo e ganhe no Pix | Programa de indicações Bewild", description: "Indique quem vai reformar apartamento, studio ou cobertura em São Paulo. Se o contrato fechar, você recebe a recompensa em Pix. Registro em 2 minutos.", path: "/indique-um-amigo", keywords: "indique e ganhe reforma, programa de indicação reforma São Paulo, recompensa por indicação apartamento, reforma de studio São Paulo, reforma de apartamento SP, Bewild indicações", jsonLd: INDIQUE_JSONLD }),
});
