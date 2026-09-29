import { createFileRoute } from "@tanstack/react-router";
import IndiquePage from "@/pages/IndiquePage";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/indique-um-amigo")({
  component: IndiquePage,
  head: () => seoHead({ title: "Indique um amigo e ganhe no Pix | Programa de indicações Bewild", description: "Indique alguém que vai reformar um apartamento, studio ou cobertura em São Paulo. Se o contrato fechar, você recebe a recompensa em Pix. Sem CNPJ, sem burocracia — registro em 2 minutos.", path: "/indique-um-amigo", keywords: "indique e ganhe reforma, programa de indicação reforma São Paulo, recompensa por indicação apartamento, reforma de studio São Paulo, reforma de apartamento SP, Bewild indicações" }),
});
