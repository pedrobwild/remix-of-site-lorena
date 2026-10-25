import { createFileRoute } from "@tanstack/react-router";
import HomePage from "@/pages/HomePage";
import { seoHead } from "@/lib/routeHead";
import { HOME_DEFAULT_DESCRIPTION, HOME_DEFAULT_TITLE, loadHomeSeo, type HomeSeo } from "@/lib/homeSeo";
import homeCriticalCssUrl from "@/pages/home-critical.css?url";
import homeDeferredCssUrl from "@/pages/home-deferred.css?url";

/** Imagem principal da home, carregada antecipadamente para reduzir o tempo de exibição. */
export { HERO_IMAGE_DESKTOP as HERO_IMAGE } from "@/content/homeHero";
/**
 * Versão para celular (828 px, WebP) da mesma imagem: o <picture> da home a
 * usa até 760 px de largura, e o preload segue a mesma regra, para o celular
 * não baixar o JPEG de 1920 px (PERF-02, auditoria de 05/10/2026).
 */
import { HERO_IMAGE_MOBILE, HERO_IMAGE_DESKTOP, HERO_DESKTOP_SRCSET, HERO_DESKTOP_SIZES } from "@/content/homeHero";
export { HERO_IMAGE_MOBILE };
export const HERO_MOBILE_MEDIA = "(max-width: 760px)";

function homeHead(seo?: HomeSeo) {
  // Título/descrição/Open Graph salvos em /admin/seo (loader); sem eles, o texto padrão.
  const head = seoHead({ bwaCss: false, title: seo?.title ?? HOME_DEFAULT_TITLE, description: seo?.description ?? HOME_DEFAULT_DESCRIPTION, ogTitle: seo?.ogTitle, ogDescription: seo?.ogDescription, ogImage: seo?.ogImage, path: "/", keywords: "escritório de arquitetura em São Paulo, arquitetura e engenharia, projeto arquitetônico, projeto de interiores, engenharia civil São Paulo, reforma de apartamento em SP, bastidores de obra, equipe em obra, custo de reforma, empresa de reforma de apartamento SP, reforma turnkey São Paulo, Bewild" });
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
      ...(homeDeferredCssUrl ? [{ rel: "preload", as: "style", href: homeDeferredCssUrl }] : []),
      {
        rel: "preload",
        as: "image",
        type: "image/webp",
        href: HERO_IMAGE_MOBILE,
        media: HERO_MOBILE_MEDIA,
        fetchPriority: "high" as const,
      },
      {
        rel: "preload",
        as: "image",
        type: "image/webp",
        href: HERO_IMAGE_DESKTOP,
        imageSrcSet: HERO_DESKTOP_SRCSET,
        imageSizes: HERO_DESKTOP_SIZES,
        media: "(min-width: 761px)",
        fetchPriority: "high" as const,
      },
    ],
  };
}

export const Route = createFileRoute("/")({
  component: HomePage,
  loader: () => loadHomeSeo(),
  head: ({ loaderData }) => homeHead(loaderData),
});
