import { createFileRoute } from "@tanstack/react-router";
import MapaPage from "@/pages/MapaPage";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/mapa")({
  component: MapaPage,
  head: () => seoHead({ title: "Mapa e endereço: R. Pitu, 72, Brooklin, São Paulo | Bewild", description: "Como chegar à Bewild: Rua Pitú, 72, Sala 115, Brooklin, São Paulo-SP. Mapa, horários (seg–sex 9h–19h, sáb 9h–17h) e rota pelo aplicativo.", path: "/mapa", noindex: true }),
});
