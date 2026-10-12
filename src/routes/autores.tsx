import { createFileRoute } from "@tanstack/react-router";
import AutoresPage from "@/pages/AutoresPage";
import { seoHead } from "@/lib/routeHead";
import { PEDRO_ID, THIAGO_ID } from "@/lib/orgJsonLd";

export const Route = createFileRoute("/autores")({
  component: AutoresPage,
  head: () =>
    seoHead({
      title: "Autores: Pedro Henrique Alves e Thiago Dantas | Bewild",
      description:
        "Quem escreve os conteúdos da Bewild: Pedro Henrique Alves, fundador e CEO, e Thiago Dantas do Amor, cofundador, VP e arquiteto responsável técnico.",
      path: "/autores",
      // Os nós Person completos já estão no grafo do root; aqui só referência por @id.
      pageJsonLd: {
        "@type": "AboutPage",
        mainEntity: [{ "@id": PEDRO_ID }, { "@id": THIAGO_ID }],
      },
    }),
});
