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
