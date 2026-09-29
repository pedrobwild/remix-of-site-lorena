import { createFileRoute } from "@tanstack/react-router";
import OndeAtuamosPage from "@/pages/OndeAtuamosPage";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/onde-atuamos")({
  component: OndeAtuamosPage,
  head: () => seoHead({ title: "Onde atuamos: arquitetura e reforma em São Paulo | Bewild", description: "Procura arquitetura, engenharia e reforma de apartamento em SP? A Bewild projeta e reforma apartamentos em São Paulo capital, em mais de 27 bairros, e atende à distância clientes de outras cidades.", path: "/onde-atuamos" }),
});
