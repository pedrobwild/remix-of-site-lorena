import { createFileRoute } from "@tanstack/react-router";
import MarcenariaPage from "@/pages/MarcenariaPage";
import { MARCENARIA_JSONLD } from "@/content/pages/marcenaria";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/marcenaria")({
  component: MarcenariaPage,
  head: () => seoHead({ title: "Marcenaria sob medida em São Paulo | Fábrica própria — Bewild", description: "Marcenaria planejada sob medida em São Paulo, com fábrica própria: MDF certificado, mais de 40 modelos e cores e 5 anos de garantia, no contrato da reforma.", path: "/marcenaria", keywords: "marcenaria sob medida São Paulo, marcenaria planejada SP, móveis planejados apartamento, armário sob medida, cozinha planejada São Paulo, Bewild", jsonLd: MARCENARIA_JSONLD }),
});
