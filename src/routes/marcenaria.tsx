import { createFileRoute } from "@tanstack/react-router";
import MarcenariaPage from "@/pages/MarcenariaPage";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/marcenaria")({
  component: MarcenariaPage,
  head: () => seoHead({ title: "Marcenaria sob medida em São Paulo | Fábrica própria — Bewild", description: "Marcenaria planejada sob medida em São Paulo com fábrica própria: MDF certificado, estruturas em 25 mm, ferragens FGVTN, mais de 40 modelos e cores e 5 anos de garantia, dentro do mesmo contrato da reforma.", path: "/marcenaria", keywords: "marcenaria sob medida São Paulo, marcenaria planejada SP, móveis planejados apartamento, armário sob medida, cozinha planejada São Paulo, Bewild" }),
});
