import { createFileRoute } from "@tanstack/react-router";
import ServicosPage from "@/pages/ServicosPage";
import { SERVICOS_JSONLD } from "@/content/pages/servicos";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/servicos")({
  component: ServicosPage,
  head: () => seoHead({ title: "Serviços de arquitetura, reforma e marcenaria em SP | Bewild", description: "Arquitetura, engenharia e obra num contrato só: projeto 3D, reforma de apartamento, studio e cobertura, marcenaria própria, preço fechado e 5 anos de garantia.", path: "/servicos", jsonLd: SERVICOS_JSONLD }),
});
