import { createFileRoute } from "@tanstack/react-router";
import ReformasSaoPauloPage from "@/pages/ReformasSaoPauloPage";
import { REFORMAS_DESCRIPTION, REFORMAS_PATH, REFORMAS_TITLE } from "@/content/pages/reformas-sao-paulo.seo";
import { rootPagesSeo, seoHead } from "@/lib/routeHead";

export const Route = createFileRoute("/reformas-sao-paulo")({
  component: ReformasSaoPauloPage,
  head: ({ matches }) => {
    const head = seoHead({ pagesSeo: rootPagesSeo(matches), title: REFORMAS_TITLE, description: REFORMAS_DESCRIPTION, path: REFORMAS_PATH });
    return { ...head, meta: head.meta.filter((meta) => !["og:image", "og:image:type", "twitter:image", "twitter:card"].includes(meta.property ?? meta.name ?? "")).concat([{ name: "twitter:card", content: "summary" }]) };
  },
});