import { createFileRoute } from "@tanstack/react-router";
import IncorporadorasPage from "@/pages/IncorporadorasPage";
import NotFoundPage from "@/pages/NotFoundPage";
import { isIncorporadorasEnabled } from "@/lib/incorporadorasFlag";
import { seoHead } from "@/lib/routeHead";
import { INCORPORADORAS_PAGE_ENABLED } from "@/config/site";
import { INCORP_PATH, INCORP_SEO } from "@/content/incorporadoras";

export const Route = createFileRoute("/parceiros/incorporadoras")({
  // Página atrás de flag: fora do ar para o público enquanto a flag estiver
  // desligada (só aparece na prévia interna com ?incorporadoras=1).
  //
  // Import direto, sem `React.lazy`: o roteador já separa o componente da rota
  // num arquivo próprio e, diferente do `lazy`, põe o CSS dele no <head> do
  // HTML do servidor. Com `lazy` a página chegava sem o próprio CSS (logos
  // gigantes, blocos fora do lugar) até o JavaScript carregar — CLS 0,74 no
  // celular com 4G lenta simulada (MOB-04).
  component: () => (isIncorporadorasEnabled() ? <IncorporadorasPage /> : <NotFoundPage />),
  // HTML do servidor: com a flag ligada a página é pública (menu, rodapé e
  // sitemap), então sai indexável com o mesmo título/descrição do useSeo.
  // O Google não renderiza página que chega com noindex no HTML bruto — a troca
  // para index feita no navegador não adiantava. Flag desligada: noindex.
  head: () =>
    INCORPORADORAS_PAGE_ENABLED
      ? seoHead({
          title: INCORP_SEO.title,
          description: INCORP_SEO.description,
          keywords: INCORP_SEO.keywords,
          path: INCORP_PATH,
        })
      : seoHead({
          title: "Reforma pós-chaves para incorporadoras | Bewild",
          description: "Prévia interna do programa da Bewild para incorporadoras.",
          path: INCORP_PATH,
          noindex: true,
        }),
});
