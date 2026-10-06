import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HOME_BWA_HTML } from "./home-bwa-body";
import BwaFooter from "@/components/BwaFooter";
import { useSeo } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";
import { hydrateHomeProjects } from "@/lib/hydrateHomeProjects";
import { trackEvent } from "@/lib/ga4";
import { installCatalogPreview } from "@/lib/homeCatalog";
import { installInstagramEmbeds } from "@/lib/homeInstagram";
import { installBastidores } from "@/lib/homeBastidores";
import { installTour3d, installTour3dCovers } from "@/lib/homeTour3d";
import { fetchSiteSettings } from "@/lib/useSiteSettings";
import { isExternalHref, safeHref } from "@/lib/safeUrl";
import { initHomeBwa } from "./home-bwa-script";
import { hydrateHomeFaq } from "./homeFaq";
// Réplica do portal do cliente (recharts, ~92 KB gz): só é montada no cliente,
// dentro de um portal, e agora só quando a seção se aproxima da tela — fora do
// caminho crítico da home (auditoria 06/10: 467 KB de JS na home).
const WorkflowPortalReplica = lazy(() => import("@/components/workflow-replica/WorkflowPortalReplica"));
import { bastidoresJsonLd, parseBastidoresPosts } from "@/lib/bastidoresJsonLd";

const BASTIDORES_POSTS = parseBastidoresPosts();

const TITLE = "Reforma de apartamentos e studios em São Paulo | Bewild";
const DESCRIPTION =
  "Reforma completa de apartamentos e studios em São Paulo: projeto, obra, marcenaria e mobília em um só contrato, preço e prazo fechados, 5 anos de garantia.";
const KEYWORDS =
  "escritório de arquitetura em São Paulo, arquitetura e engenharia, projeto arquitetônico, projeto de interiores, engenharia civil São Paulo, reforma de apartamento em SP, bastidores de obra, equipe em obra, custo de reforma, quanto custa reformar um apartamento em SP, empresa de reforma de apartamento SP, reforma turnkey São Paulo, Bewild";
const THEME_COLOR = "#0B2342";
// Fontes e preload do hero não ficam mais aqui:
//  - o site inteiro usa só Manrope e JetBrains Mono, hospedadas no próprio
//    site (src/fonts.css) com preload no <head> (src/lib/fonts.ts).
//  - o preload do hero (LCP no desktop) sai do index.html, antes do bundle.
//    Aqui ele chegava tarde: quando este efeito roda, o <img
//    fetchpriority="high"> do HTML da home já está no DOM e já pediu a imagem.

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

/**
 * LinkedIn do rodapé (mesma regra do BwaFooter): só aparece com a URL real
 * configurada no admin (`site_settings.linkedin_url`), validada por safeHref.
 * O HTML estático não traz o link — antes ele apontava para linkedin.com.
 */
function installFooterLinkedin(root: HTMLElement): () => void {
  let alive = true;
  void fetchSiteSettings().then((settings) => {
    const href = safeHref(settings.linkedin_url);
    if (!alive || !href || !isExternalHref(href)) return;
    const instagram = root.querySelector<HTMLAnchorElement>('.bwa-footer-column a[href*="instagram.com"]');
    if (!instagram || root.querySelector("[data-footer-linkedin]")) return;
    const link = document.createElement("a");
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "LinkedIn";
    link.setAttribute("data-footer-linkedin", "");
    instagram.after(link);
  });
  return () => {
    alive = false;
  };
}

/**
 * Chama `mount` quando a seção do portal está a ~600 px da tela (ou de
 * imediato onde não há IntersectionObserver). Devolve a limpeza.
 */
function mountPortalWhenNear(target: HTMLElement | null, mount: () => void): () => void {
  if (!target) return () => {};
  if (typeof IntersectionObserver === "undefined") {
    mount();
    return () => {};
  }
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        mount();
      }
    },
    { rootMargin: "600px 0px" },
  );
  io.observe(target);
  return () => io.disconnect();
}

export default function HomePage() {
  const homeRef = useRef<HTMLDivElement>(null);
  const [workflowPortalRoot, setWorkflowPortalRoot] = useState<HTMLElement | null>(null);

  // SEO por rota (title/description/canonical + gating de trackers por consentimento).
  // Título, descrição e Open Graph editáveis em /admin/seo (aba Home);
  // vazio no painel = texto padrão abaixo.
  const { settings } = useSiteSettings();
  const clean = (v?: string | null) => (v ?? "").trim() || undefined;
  useSeo({
    title: clean(settings?.home_seo_title) ?? TITLE,
    description: clean(settings?.home_seo_description) ?? DESCRIPTION,
    ogTitle: clean(settings?.home_og_title),
    ogDescription: clean(settings?.home_og_description),
    ogImage: clean(settings?.home_og_image),
    keywords: KEYWORDS,
    canonicalPath: "/",
    ogType: "website",
    // Os 6 posts dos Bastidores: título e descrição próprios em JSON-LD.
    jsonLd: bastidoresJsonLd(BASTIDORES_POSTS, settings?.bastidores_seo ?? {}),
  });

  useEffect(() => {
    ensureMeta("theme-color", THEME_COLOR);

    const root = homeRef.current;
    // Comportamento do HTML aprovado (menu, galeria, FAQ, vídeo, reveals),
    // restrito a esta raiz. A limpeza fecha modal/menu abertos e devolve a
    // rolagem do <body> — sem ela o vídeo aberto + Voltar travava a rota
    // seguinte.
    const cleanups = root
      ? [
          initHomeBwa(root),
          // Marcenaria (Catálogo Bwild) e depoimentos (Instagram): carregam
          // quando as seções se aproximam da tela.
          installCatalogPreview(root),
          installInstagramEmbeds(root),
          // Bastidores: slider dos 6 posts do time em obra (embeds montados por installInstagramEmbeds).
          installBastidores(root),
          // Tour virtual 3D (Enscape): 3 cômodos lado a lado; no toque, tela cheia.
          installTour3d(root),
          installTour3dCovers(root),
          installFooterLinkedin(root),
          // FAQ: perguntas marcadas "Mostrar na home" em /admin/faq.
          hydrateHomeFaq(root),
        ]
      : [];
    // Vitrine "Projetos": troca os cards estáticos pelos mais acessados.
    void hydrateHomeProjects();
    const portalRoot = root?.querySelector<HTMLElement>("#workflow-portal-root") ?? null;
    cleanups.push(mountPortalWhenNear(portalRoot, () => setWorkflowPortalRoot(portalRoot)));

    return () => {
      setWorkflowPortalRoot(null);
      cleanups.forEach((cleanup) => cleanup());
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
      {/* home-bwa.css vem pelo `head` da rota "/" (src/routes/index.tsx): no
          HTML do servidor na carga direta e, numa navegação interna, inserido
          pelo roteador antes de a home aparecer. Nada de criar <link> aqui. */}
      <div ref={homeRef} dangerouslySetInnerHTML={{ __html: HOME_BWA_HTML }} />
      {workflowPortalRoot
        ? createPortal(
            <Suspense fallback={null}>
              <WorkflowPortalReplica />
            </Suspense>,
            workflowPortalRoot,
          )
        : null}
      {/* Rodapé único do site — mesmo componente de todas as páginas. */}
      <BwaFooter />
    </>
  );
}
