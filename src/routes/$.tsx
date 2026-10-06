import { createFileRoute } from "@tanstack/react-router";
import NotFoundPage from "@/pages/NotFoundPage";
import { seoHead } from "@/lib/routeHead";
import { NOT_FOUND_SEO } from "@/lib/seoLoaders";
import { notFoundOrRedirect } from "@/lib/contentLoaders";

/**
 * Rota curinga: qualquer caminho sem rota própria passa por aqui. O loader
 * consulta os redirecionamentos cadastrados no admin (seo_404_log, status
 * "redirect") e responde 301 já no servidor — antes só /conteudos, /portfolio
 * e /reforma faziam isso; nos outros caminhos o redirecionamento acontecia
 * só no navegador, e o Google recebia 404 (TEC-06, auditoria de 05/10/2026).
 * Sem redirecionamento cadastrado, o loader lança notFound() e a página de
 * 404 do root responde como antes.
 */
export const Route = createFileRoute("/$")({
  loader: ({ params }) => notFoundOrRedirect(`/${params._splat ?? ""}`),
  head: () =>
    seoHead({
      title: NOT_FOUND_SEO.title,
      description: NOT_FOUND_SEO.description,
      path: "/404",
      noindex: true,
    }),
  component: () => <NotFoundPage />,
});
