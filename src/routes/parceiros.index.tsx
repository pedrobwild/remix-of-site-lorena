import { createFileRoute } from "@tanstack/react-router";
import ParceirosPage from "@/pages/ParceirosPage";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/parceiros")({
  component: ParceirosPage,
  head: () => seoHead({ title: "Programa de indicações para parceiros profissionais | Bewild", description: "Indique clientes para a Bewild, acompanhe cada oportunidade e receba comissão conforme o termo. Programa para corretores, imobiliárias, incorporadoras, arquitetos e administradoras.", path: "/parceiros", keywords: "escritório de arquitetura e engenharia em SP, reforma de apartamento em SP, parceria corretor reforma, indicação reforma comissão, reforma de studio para investidor, reforma apartamento compacto São Paulo, incorporadora reforma pós-chaves, custo de reforma, Bewild parceiros" }),
});
