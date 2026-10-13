import { createFileRoute } from "@tanstack/react-router";
import IndiceCustoPage from "@/pages/IndiceCustoPage";
import { INDICE_CANONICAL, INDICE_DESCRIPTION, INDICE_JSONLD, INDICE_TITLE } from "@/content/indiceCusto";
import { seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/indice-de-custo-de-reforma")({
  component: IndiceCustoPage,
  head: () => seoHead({ title: INDICE_TITLE, description: INDICE_DESCRIPTION, path: INDICE_CANONICAL, jsonLd: INDICE_JSONLD }),
});
