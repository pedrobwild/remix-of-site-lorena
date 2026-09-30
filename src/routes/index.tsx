import { createFileRoute } from "@tanstack/react-router";
import HomePage from "@/pages/HomePage";
import { seoHead } from "@/lib/routeHead";

/**
 * Imagem do hero (LCP): WebP responsivo em public/images/opt/hero, gerado do
 * hero-cozinha.jpg original (1601×1999, 352 KB). O preload com o mesmo
 * srcset/sizes do <img> (src/pages/home-bwa-body.ts) faz o navegador pedir a
 * imagem logo no <head>, antes de chegar ao <img> no meio do HTML.
 */
export const HERO_SRCSET =
  "/images/opt/hero/hero-cozinha-480.webp 480w, /images/opt/hero/hero-cozinha-800.webp 800w, /images/opt/hero/hero-cozinha-1200.webp 1200w, /images/opt/hero/hero-cozinha-1600.webp 1600w";
export const HERO_SIZES = "(max-width: 900px) 100vw, 50vw";

function homeHead() {
  const head = seoHead({ title: "Arquitetura, engenharia e reforma de apartamento em SP | Bewild", description: "Reforma completa de apartamentos em São Paulo: projeto, obra, marcenaria e mobília, com preço e prazo fechados. Veja os bastidores da equipe em obra.", path: "/", keywords: "escritório de arquitetura em São Paulo, arquitetura e engenharia, projeto arquitetônico, projeto de interiores, engenharia civil São Paulo, reforma de apartamento em SP, bastidores de obra, equipe em obra, custo de reforma, empresa de reforma de apartamento SP, reforma turnkey São Paulo, Bewild" });
  return {
    ...head,
    links: [
      ...head.links,
      {
        rel: "preload",
        as: "image",
        type: "image/webp",
        href: "/images/opt/hero/hero-cozinha-1200.webp",
        imageSrcSet: HERO_SRCSET,
        imageSizes: HERO_SIZES,
        fetchPriority: "high" as const,
      },
    ],
  };
}

export const Route = createFileRoute("/")({
  component: HomePage,
  head: homeHead,
});
