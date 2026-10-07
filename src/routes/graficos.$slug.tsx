import { createFileRoute, notFound } from "@tanstack/react-router";
import BewildChartsPage from "@/pages/BewildChartsPage";
import { seoHead } from "@/lib/routeHead";
import { chartSetForSlug, chartsPagePath } from "@/content/chartSets";

export const Route = createFileRoute("/graficos/$slug")({
  loader: ({ params }) => {
    if (!chartSetForSlug(params.slug)) throw notFound();
    return { slug: params.slug };
  },
  component: RouteComponent,
  head: ({ params }) => {
    const set = chartSetForSlug(params.slug);
    return seoHead({
      title: set ? `${set.title} | Bewild` : "Gráficos | Bewild",
      description: set?.description ?? "Gráficos dos guias da Bewild sobre reforma de apartamento em São Paulo.",
      path: chartsPagePath(params.slug),
    });
  },
});

function RouteComponent() {
  const { slug } = Route.useParams();
  const set = chartSetForSlug(slug);
  if (!set) return null;
  return <BewildChartsPage set={set} />;
}
