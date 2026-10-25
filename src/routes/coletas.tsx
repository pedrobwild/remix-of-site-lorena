import { createFileRoute, redirect } from "@tanstack/react-router";
import { searchBairro } from "@/lib/lightValidators";

/** Endereço curto do histórico público, sem duplicar a página ou a base. */
export const Route = createFileRoute("/coletas")({
  validateSearch: searchBairro,
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/coletas-por-bairro",
      search: { bairro: search.bairro },
      statusCode: 301,
    });
  },
});