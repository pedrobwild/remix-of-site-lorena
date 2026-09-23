import { useEffect, useRef } from "react";
import homeBwaCssUrl from "./home-bwa.css?url";
import { HOME_BWA_HTML } from "./home-bwa-body";
import BwaFooter from "@/components/BwaFooter";
import { useSeo } from "@/lib/useSeo";
import { hydrateHomeProjects } from "@/lib/hydrateHomeProjects";
import { trackEvent } from "@/lib/ga4";
import { installCatalogPreview } from "@/lib/homeCatalog";
import { installInstagramEmbeds } from "@/lib/homeInstagram";

// @ts-expect-error - JS module, no types
import { initHomeBwa } from "./home-bwa-script.js";

const TITLE = "Arquitetura, engenharia e reforma de apartamento em SP | Bewild";
const DESCRIPTION =
  "Escritório de arquitetura e engenharia em São Paulo: projeto arquitetônico 3D, obra e marcenaria na reforma do seu apartamento, com preço fechado e prazo em contrato.";
const KEYWORDS =
  "escritório de arquitetura em São Paulo, arquitetura e engenharia, projeto arquitetônico, projeto de interiores, engenharia civil São Paulo, reforma de apartamento em SP, custo de reforma, quanto custa reformar um apartamento em SP, empresa de reforma de apartamento SP, reforma turnkey São Paulo, Bewild";
const THEME_COLOR = "#0B2342";
const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Manrope:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,500&display=swap";
const PRECONNECTS: Array<{ href: string; crossOrigin?: string }> = [
  { href: "https://fonts.googleapis.com" },
  { href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
];
// Mesmo origin do site (asset store do Lovable, ver src/assets/**/*.asset.json).
// Antes apontava para o domínio de PREVIEW do projeto — conexão extra no
// caminho crítico do LCP e dependência de um ambiente que não é produção.
const HERO_PRELOAD =
  "/__l5e/assets-v1/678d3d65-ecc9-4cb9-84f3-276275a02ad3/hero-cozinha.jpg";

function ensureMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
  return el;
}

function ensureLink(rel: string, href: string, extra: Record<string, string> = {}) {
  const selectorParts = [`link[rel="${rel}"][href="${href}"]`];
  const existing = document.head.querySelector<HTMLLinkElement>(selectorParts[0]);
  if (existing) return existing;
  const el = document.createElement("link");
  el.rel = rel;
  el.href = href;
  Object.entries(extra).forEach(([k, v]) => el.setAttribute(k, v));
  document.head.appendChild(el);
  return el;
}

/**
 * Injeta a folha aprovada da home APÓS todos os CSS globais (index.css,
 * bwh-*, etc.) para que suas regras vençam por ordem de cascata, sem
 * precisar editar valores. Ao desmontar, remove — assim não vaza a
 * paleta clara para outras rotas.
 */
function mountHomeStylesheet(): () => void {
  const marker = "data-bwa-home-css";
  let link = document.head.querySelector<HTMLLinkElement>(`link[${marker}]`);
  if (!link) {
    link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = homeBwaCssUrl;
    link.setAttribute(marker, "");
    document.head.appendChild(link);
  } else {
    // reordena para ficar por último
    document.head.appendChild(link);
  }
  document.documentElement.classList.add("bwa-home-root");
  document.body.classList.add("bwa-home-root");
  return () => {
    document.documentElement.classList.remove("bwa-home-root");
    document.body.classList.remove("bwa-home-root");
    link?.parentNode?.removeChild(link);
  };
}

export default function HomePage() {
  const homeRef = useRef<HTMLDivElement>(null);

  // SEO por rota (title/description/canonical + gating de trackers por consentimento).
  useSeo({
    title: TITLE,
    description: DESCRIPTION,
    keywords: KEYWORDS,
    canonicalPath: "/",
    ogType: "website",
  });

  useEffect(() => {
    ensureMeta("theme-color", THEME_COLOR);

    PRECONNECTS.forEach((p) =>
      ensureLink("preconnect", p.href, p.crossOrigin ? { crossorigin: p.crossOrigin } : {}),
    );
    ensureLink("preload", HERO_PRELOAD, { as: "image", fetchpriority: "high" });
    ensureLink("stylesheet", FONTS_HREF);

    const unmountCss = mountHomeStylesheet();
    // Run the original init script (same logic as the source HTML).
    initHomeBwa();
    // Vitrine "Projetos": troca os cards estáticos pelos mais acessados.
    void hydrateHomeProjects();
    // Marcenaria (Catálogo Bwild) e depoimentos (Instagram): carregam quando
    // as seções se aproximam da tela. Ligados aqui, no efeito que a home de
    // fato executa — useHomeFx não é chamado por esta página.
    const root = homeRef.current;
    const cleanups = root ? [installCatalogPreview(root), installInstagramEmbeds(root)] : [];

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      unmountCss();
    };
  }, []);

  useEffect(() => {
    const container = homeRef.current;
    if (!container) return;

    const handleCtaClick = (event: MouseEvent) => {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>("a[data-cta]")
        : null;
      if (!target?.dataset.cta) return;
      trackEvent("cta_click", { location: target.dataset.cta });
    };

    container.addEventListener("click", handleCtaClick);
    return () => container.removeEventListener("click", handleCtaClick);
  }, []);

  return (
    <>
      <div ref={homeRef} dangerouslySetInnerHTML={{ __html: HOME_BWA_HTML }} />
      {/* Rodapé único do site — mesmo componente de todas as páginas. */}
      <BwaFooter />
    </>
  );
}
