import { createFileRoute, redirect } from "@tanstack/react-router";

// /mapa repetia o endereço e o mapa de /contato (TEC-05). Em 27/10/2026 as duas
// páginas viraram uma só: /contato tem endereço, horários, rota e mapa, e /mapa
// responde 301 (aqui e no vercel.json).
export const Route = createFileRoute("/mapa")({
  beforeLoad: () => {
    throw redirect({ to: "/contato", statusCode: 301 });
  },
});
