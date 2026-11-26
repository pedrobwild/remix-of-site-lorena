import { createFileRoute } from "@tanstack/react-router";
import ManutencaoPreventivaPage from "@/pages/ManutencaoPreventivaPage";
import { MANUTENCAO_DESCRIPTION, MANUTENCAO_PATH, MANUTENCAO_TITLE } from "@/content/pages/manutencao.seo";
import { seoHead, rootPagesSeo } from "@/lib/routeHead";

export const Route = createFileRoute("/manutencao-preventiva-sao-paulo")({
  loader: () => import("@/content/pages/manutencao").then((content) => ({ jsonLd: content.MANUTENCAO_JSONLD })),
  component: ManutencaoPreventivaPage,
  errorComponent: () => <div role="alert">Não foi possível carregar o plano. <a href="/servicos#manutencao">Ver manutenção na página de serviços</a></div>,
  notFoundComponent: () => <div>Plano não encontrado. <a href="/servicos">Ver serviços</a></div>,
  head: ({ loaderData, matches }) => {
    const head = seoHead({ pagesSeo: rootPagesSeo(matches), title: MANUTENCAO_TITLE, description: MANUTENCAO_DESCRIPTION, path: MANUTENCAO_PATH, jsonLd: loaderData?.jsonLd ?? null });
    // Sem capa absoluta de compartilhamento: não usar a imagem genérica da marca.
    return { ...head, meta: head.meta.filter((meta) => !["og:image", "og:image:type", "twitter:image"].includes(meta.property ?? meta.name ?? "")).concat([{ name: "twitter:card", content: "summary" }]) };
  },
});