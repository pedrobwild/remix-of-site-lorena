/**
 * Imagem principal da home no celular (LCP até 760 px), empacotada pelo Vite:
 * nome com hash e cache de 1 ano, em vez do arquivo em /images/home/ que a
 * hospedagem servia sem cache (PageSpeed, 25/10/2026). Usada pelo <picture>
 * do HTML da home (home-bwa-body.ts) e pelo preload da rota "/".
 */
import heroStudio828 from "@/assets/hero-studio-828.webp";

export const HERO_IMAGE_MOBILE: string = heroStudio828;
