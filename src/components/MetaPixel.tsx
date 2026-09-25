/**
 * MetaPixel — eventos do Pixel ligados à navegação e aos cliques:
 *  - `PageView` a cada troca de página na SPA;
 *  - `ViewContent` ao abrir um projeto (/portfolio/<slug>), inclusive na
 *    entrada direta pela página do projeto;
 *  - `Contact` (Meta) + conversão de contato (Google Ads) no clique em link
 *    de WhatsApp/telefone/e-mail — ver src/lib/conversions.ts.
 *
 * O carregador base, o `fbq('init', ...)` e o primeiro PageView **não** estão
 * no index.html (CODE-05). Quem injeta tudo isso é `injectMetaPixel` em
 * src/lib/useSeo.ts, a partir de `site_settings.meta_pixel_id` e **só depois
 * do aceite de cookies** (LGPD) — com `fbq.disablePushState = true`, para o
 * fbevents não contar sozinho cada pushState (o PageView saía em dobro).
 *
 * Gates deste componente, conferidos a CADA navegação (não só no mount):
 *  - consentimento aceito agora (quem retirou o aceite não gera mais nada,
 *    mesmo antes do reload que limpa a página);
 *  - fora do /admin (iframe da auditoria de SEO já cai no gate de consentimento);
 *  - `window.fbq` carregado (ViewContent/Contact esperam numa fila curta).
 * Página = caminho + query: âncora (#faq) não é PageView novo.
 */
import { useEffect, useRef } from "react";
import { contactEventForHref } from "@/lib/analytics";
import { projectSlugFromPath, reportContact, reportViewContent } from "@/lib/conversions";
import { isConsentAccepted } from "@/lib/cookieConsent";
import { closestElementFrom } from "@/lib/useHashRoute";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const pageKey = () => window.location.pathname + window.location.search;

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export default function MetaPixel() {
  const lastUrlRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    lastUrlRef.current = pageKey();
    const entrySlug = projectSlugFromPath(window.location.pathname);
    if (entrySlug) reportViewContent(entrySlug);

    const trackRouteChange = () => {
      const nextUrl = pageKey();
      if (nextUrl === lastUrlRef.current) return;
      lastUrlRef.current = nextUrl;
      if (!isConsentAccepted()) return;
      if (isAdminPath(window.location.pathname)) return;
      if (typeof window.fbq !== "function") return;
      window.fbq("track", "PageView");
      const slug = projectSlugFromPath(window.location.pathname);
      if (slug) reportViewContent(slug);
    };

    // Captura: o link pode abrir outra aba ou sair do site logo em seguida.
    const onClick = (e: MouseEvent) => {
      try {
        const link = closestElementFrom(e.target)?.closest<HTMLAnchorElement>("a[href]");
        if (!link) return;
        const contact = contactEventForHref(link.getAttribute("href") || "");
        if (!contact) return;
        reportContact(contact.channel, link.dataset.cta || "link");
      } catch {
        /* nunca quebra o clique */
      }
    };

    window.addEventListener("popstate", trackRouteChange);
    window.addEventListener("hashchange", trackRouteChange);
    window.addEventListener("lovable:navigate", trackRouteChange);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("popstate", trackRouteChange);
      window.removeEventListener("hashchange", trackRouteChange);
      window.removeEventListener("lovable:navigate", trackRouteChange);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return null;
}
