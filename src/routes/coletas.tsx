import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

/** Endereço curto do histórico público, sem duplicar a página ou a base. */
export const Route = createFileRoute("/coletas")({
  validateSearch: z.object({ bairro: z.string().max(100).optional() }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/coletas-por-bairro",
      search: { bairro: search.bairro },
      statusCode: 301,
    });
  },
});