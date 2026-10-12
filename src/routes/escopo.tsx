import { createFileRoute } from "@tanstack/react-router";
import EscopoPage from "@/pages/EscopoPage";
import { seoHead } from "@/lib/routeHead";

// /escopo: página de escopo com perguntas e faixa de investimento por m².
// Substitui o "Escopo com IA" (tirado do ar em 09/10/2026): esta versão não usa
// IA, não chama função nenhuma e só calcula no navegador com números publicados.
export const Route = createFileRoute("/escopo")({
  component: EscopoPage,
  head: () =>
    seoHead({
      title: "Escopo da reforma e faixa de investimento por m² | Bewild",
      description:
        "Responda 4 perguntas, monte o escopo da reforma do seu studio ou apartamento em São Paulo e veja a faixa de investimento por metragem, com base nos contratos da Bewild.",
      path: "/escopo",
    }),
});
