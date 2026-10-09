import { createFileRoute, redirect } from "@tanstack/react-router";

// /escopo ("Escopo com IA") foi tirada do ar em 09/10/2026: quase sem uso
// (1 visita em 90 dias) e a edge function `scope-plan` chamava a IA paga sem
// login (achado crítico do scan de segurança do Lovable). O endereço antigo
// segue com 301 para o pedido de orçamento, como /diagnostico.
export const Route = createFileRoute("/escopo")({
  beforeLoad: () => {
    throw redirect({ to: "/orcamento", statusCode: 301 });
  },
});
