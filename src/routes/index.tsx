import { createFileRoute } from "@tanstack/react-router";
import HomePage from "@/pages/HomePage";
import { seoHead } from "@/lib/routeHead";
import { HOME_DEFAULT_DESCRIPTION, HOME_DEFAULT_TITLE, HOME_KEYWORDS, loadHomeSeo, type HomeSeo } from "@/lib/homeSeo";
import homeCriticalCssUrl from "@/pages/home-critical.css?url";
import homeDeferredCssUrl from "@/pages/home-deferred.css?url";

/** Imagem principal da home, carregada antecipadamente para reduzir o tempo de exibição. */
export { HERO_IMAGE_DESKTOP as HERO_IMAGE } from "@/content/homeHero";
/*
 * Versão para celular (828 px, WebP) da mesma imagem: o <picture> da home a
 * usa até 760 px de largura (PERF-02, auditoria de 05/10/2026). O preload
 * das duas versões saiu daqui em 30/10/2026 e foi para o HomePage
 * (`preloadHomeHero`): no `head` da rota ele saía no FIM do <head>, depois
 * dos ~40 `modulepreload` do JavaScript, e o PageSpeed (celular) media
 * 1,75 s de "atraso no carregamento" da imagem do LCP.
 */
export { HERO_IMAGE_MOBILE, HERO_MOBILE_MEDIA } from "@/content/homeHero";
// Daqui só a constante: home-bwa-body.ts (o HTML da home) não pode entrar no
// pacote do `head` das rotas, que toda página baixa.
import { HOME_DEFERRED_ASYNC_MEDIA, HOME_DEFERRED_BLOCKING_MEDIA } from "@/content/homeHero";

function homeHead(seo?: HomeSeo) {
  // Título/descrição/Open Graph salvos em /admin/seo (loader); sem eles, o texto padrão.
  const head = seoHead({ bwaCss: false, title: seo?.title ?? HOME_DEFAULT_TITLE, description: seo?.description ?? HOME_DEFAULT_DESCRIPTION, ogTitle: seo?.ogTitle, ogDescription: seo?.ogDescription, ogImage: seo?.ogImage, path: "/", keywords: HOME_KEYWORDS });
  return {
    ...head,
    links: [
      ...head.links,
      // Folha da home no HTML do servidor. Antes ela só entrava pelo JS,
      // depois da hidratação: até lá a biblioteca de SVG ocupava 150 px no
      // topo e o <main> pulava para cima quando a folha chegava — CLS 1,0 no
      // desktop e 0,19 no celular (PageSpeed, 30/09). As páginas internas
      // recebem as folhas .bwa pelo seoHead() (src/lib/routeHead.ts).
      // 25/10/2026: só a parte da primeira tela (home-critical.css, derivada
      // de home-bwa.css no build) bloqueia aqui; o resto (home-deferred.css)
      // é só pré-carregado e entra como <link> no corpo, depois do hero
      // (home-bwa-body.ts) — ver scripts/bwaShell.ts.
      { rel: "stylesheet", href: homeCriticalCssUrl },
      // CSS adiado: no desktop ele segura o que vem depois do <link> no corpo
      // (prioridade normal); no celular é baixado sem bloquear nada
      // (withDeferredStylesheet) — prioridade baixa, para não disputar banda
      // com a foto do hero (LCP).
      ...(homeDeferredCssUrl
        ? [
            { rel: "preload", as: "style", href: homeDeferredCssUrl, media: HOME_DEFERRED_BLOCKING_MEDIA },
            {
              rel: "preload",
              as: "style",
              href: homeDeferredCssUrl,
              media: HOME_DEFERRED_ASYNC_MEDIA,
              fetchPriority: "low" as const,
            },
          ]
        : []),
    ],
  };
}

export const Route = createFileRoute("/")({
  component: HomePage,
  loader: () => loadHomeSeo(),
  head: ({ loaderData }) => homeHead(loaderData),
});
