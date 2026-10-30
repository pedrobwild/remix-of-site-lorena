/**
 * Imagem principal da home no celular (LCP até 760 px), empacotada pelo Vite:
 * nome com hash e cache de 1 ano, em vez do arquivo em /images/home/ que a
 * hospedagem servia sem cache (PageSpeed, 25/10/2026). Usada pelo <picture>
 * do HTML da home (home-bwa-body.ts) e pelo preload da rota "/".
 */
import heroStudio828 from "@/assets/hero-studio-828.webp";
import heroDesktop960 from "@/assets/hero-studio-desktop-960.webp";
import heroDesktop1440 from "@/assets/hero-studio-desktop-1440.webp";
import heroDesktop1920 from "@/assets/hero-studio-desktop-1920.webp";

export const HERO_IMAGE_MOBILE: string = heroStudio828;

/** Mesma foto e proporção do JPEG original; preload e picture compartilham a seleção. */
export const HERO_IMAGE_DESKTOP: string = heroDesktop1920;
export const HERO_DESKTOP_SRCSET = `${heroDesktop960} 960w, ${heroDesktop1440} 1440w, ${heroDesktop1920} 1920w`;
export const HERO_DESKTOP_SIZES = "(max-width: 900px) 100vw, 50vw";

/** Até onde o <picture> da home usa a versão de celular (828 px). */
export const HERO_MOBILE_MEDIA = "(max-width: 760px)";

/**
 * Larguras em que a primeira seção abaixo do hero já aparece na primeira tela
 * (medido em 30/10/2026: 1024×768, 1350×940, 1920×1080 e 2560×1440 mostram o
 * topo de `.bwa-audience`; 360×640, 412×823 e 768×1024 não). Nelas o CSS
 * adiado da home continua segurando o que vem depois do <link> no corpo —
 * sem ele, essa faixa apareceria sem estilo e pularia quando a folha
 * chegasse (CLS). Abaixo disso a folha é baixada sem bloquear nada
 * (withDeferredStylesheet, src/pages/home-bwa-body.ts).
 */
export const HOME_DEFERRED_BLOCKING_MEDIA = "(min-width: 901px)";

/**
 * Pré-carrega a foto do hero (LCP) pelo React (`preload` do react-dom), e não
 * pelo `head` da rota. No HTML do servidor o React escreve esses preloads de
 * imagem com `fetchPriority="high"` logo depois do charset/viewport, ANTES
 * das folhas de estilo e dos ~40 `modulepreload` do JavaScript; pelo `head`
 * eles saíam no fim do <head>, e o navegador só pedia a foto depois de
 * enfileirar todo o resto (PageSpeed, celular, 30/10/2026: 1,75 s de "atraso
 * no carregamento de recursos" no LCP). Numa navegação interna para a home,
 * o mesmo chamado insere o preload no <head> e a foto já começa a baixar.
 */
export function preloadHomeHero(preload: (href: string, options: PreloadOptions) => void): void {
  preload(HERO_IMAGE_MOBILE, {
    as: "image",
    type: "image/webp",
    media: HERO_MOBILE_MEDIA,
    fetchPriority: "high",
  });
  preload(HERO_IMAGE_DESKTOP, {
    as: "image",
    type: "image/webp",
    imageSrcSet: HERO_DESKTOP_SRCSET,
    imageSizes: HERO_DESKTOP_SIZES,
    media: `not all and ${HERO_MOBILE_MEDIA}`,
    fetchPriority: "high",
  });
}

type PreloadOptions = {
  as: "image";
  type: string;
  media: string;
  fetchPriority: "high";
  imageSrcSet?: string;
  imageSizes?: string;
};
