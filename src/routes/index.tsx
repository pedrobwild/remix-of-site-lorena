import { createFileRoute } from "@tanstack/react-router";
import HomePage from "@/pages/HomePage";
import { seoHead } from "@/lib/routeHead";
import homeBwaCssUrl from "@/pages/home-bwa.css?url";

/** Imagem principal da home, carregada antecipadamente para reduzir o tempo de exibição. */
export const HERO_IMAGE =
  "/__l5e/assets-v1/ebfb0e6b-1fec-4bfe-9cc7-e08776e6e674/apartamento-studio-quarto-realista.jpg";

function homeHead() {
  const head = seoHead({ title: "Arquitetura, engenharia e reforma de apartamento em SP | Bewild", description: "Reforma completa de apartamentos em São Paulo: projeto, obra, marcenaria e mobília, com preço e prazo fechados. Veja os bastidores da equipe em obra.", path: "/", keywords: "escritório de arquitetura em São Paulo, arquitetura e engenharia, projeto arquitetônico, projeto de interiores, engenharia civil São Paulo, reforma de apartamento em SP, bastidores de obra, equipe em obra, custo de reforma, empresa de reforma de apartamento SP, reforma turnkey São Paulo, Bewild" });
  return {
    ...head,
    links: [
      ...head.links,
      // Folha da home no HTML do servidor. Antes ela só entrava pelo JS
      // (mountHomeStylesheet, depois da hidratação): até lá a biblioteca de
      // SVG ocupava 150 px no topo e o <main> pulava para cima quando a folha
      // chegava — CLS 1,0 no desktop e 0,19 no celular (PageSpeed, 30/09).
      { rel: "stylesheet", href: homeBwaCssUrl, "data-bwa-home-ssr": "" },
      {
        rel: "preload",
        as: "image",
        type: "image/jpeg",
        href: HERO_IMAGE,
        fetchPriority: "high" as const,
      },
    ],
  };
}

export const Route = createFileRoute("/")({
  component: HomePage,
  head: homeHead,
});
