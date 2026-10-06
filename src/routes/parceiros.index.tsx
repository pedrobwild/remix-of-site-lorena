import { createFileRoute } from "@tanstack/react-router";
import ParceirosPage, { PARCEIROS_JSONLD } from "@/pages/ParceirosPage";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/parceiros/")({
  component: ParceirosPage,
  head: () => seoHead({ title: "Programa de indicações para parceiros profissionais | Bewild", description: "Indique clientes para a Bewild, acompanhe cada oportunidade e receba comissão conforme o termo. Para corretores, imobiliárias, incorporadoras e arquitetos.", path: "/parceiros", keywords: "escritório de arquitetura e engenharia em SP, reforma de apartamento em SP, parceria corretor reforma, indicação reforma comissão, reforma de studio para investidor, reforma apartamento compacto São Paulo, incorporadora reforma pós-chaves, custo de reforma, Bewild parceiros", jsonLd: PARCEIROS_JSONLD }),
});
