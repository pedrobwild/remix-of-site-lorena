import { createFileRoute } from "@tanstack/react-router";
import HomePage from "@/pages/HomePage";
import { seoHead } from "@/lib/routeHead";
import homeBwaCssUrl from "@/pages/home-bwa.css?url";

/** Imagem principal da home, carregada antecipadamente para reduzir o tempo de exibição. */
export const HERO_IMAGE =
  "/__l5e/assets-v1/ebfb0e6b-1fec-4bfe-9cc7-e08776e6e674/apartamento-studio-quarto-realista.jpg";
/**
 * Versão para celular (828 px, WebP) da mesma imagem: o <picture> da home a
 * usa até 760 px de largura, e o preload segue a mesma regra, para o celular
 * não baixar o JPEG de 1920 px (PERF-02, auditoria de 05/10/2026).
 */
export const HERO_IMAGE_MOBILE = "/images/home/hero-studio-828.webp";
export const HERO_MOBILE_MEDIA = "(max-width: 760px)";

function homeHead() {
  const head = seoHead({ bwaCss: false, title: "Reforma de apartamentos e studios em São Paulo | Bewild", description: "Reforma completa de apartamentos e studios em São Paulo: projeto, obra, marcenaria e mobília em um só contrato, preço e prazo fechados, 5 anos de garantia.", path: "/", keywords: "escritório de arquitetura em São Paulo, arquitetura e engenharia, projeto arquitetônico, projeto de interiores, engenharia civil São Paulo, reforma de apartamento em SP, bastidores de obra, equipe em obra, custo de reforma, empresa de reforma de apartamento SP, reforma turnkey São Paulo, Bewild" });
  return {
    ...head,
    links: [
      ...head.links,
      // Folha da home no HTML do servidor. Antes ela só entrava pelo JS,
      // depois da hidratação: até lá a biblioteca de SVG ocupava 150 px no
      // topo e o <main> pulava para cima quando a folha chegava — CLS 1,0 no
      // desktop e 0,19 no celular (PageSpeed, 30/09). As páginas internas
      // recebem as folhas .bwa pelo seoHead() (src/lib/routeHead.ts).
      { rel: "stylesheet", href: homeBwaCssUrl },
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
        type: "image/jpeg",
        href: HERO_IMAGE,
        media: "(min-width: 761px)",
        fetchPriority: "high" as const,
      },
    ],
  };
}

export const Route = createFileRoute("/")({
  component: HomePage,
  head: homeHead,
});
