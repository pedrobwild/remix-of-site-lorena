/**
 * MetaPixel — eventos do Pixel ligados à navegação e aos cliques:
 *  - `PageView` a cada troca de página na SPA;
 *  - `ViewContent` ao abrir projeto, conteúdo, guia, portfólio ou página de
 *    serviço (ver `pageContentFor` em src/lib/conversions.ts), inclusive na
 *    entrada direta pela página;
 *  - `Contact` (Meta) + conversão de contato (Google Ads) no clique em link
 *    de WhatsApp/telefone/e-mail — ver src/lib/conversions.ts;
 *  - `IniciouFormulario` na primeira interação com um formulário de lead ou
 *    cadastro (uma vez por página vista);
 *  - `VisitanteEngajado` uma vez por sessão: 60 s de tela ativa ou 75% de
 *    rolagem numa página longa.
 *
 * O carregador base, o `fbq('init', ...)` e o primeiro PageView **não** estão
 * no index.html (CODE-05). Quem injeta tudo isso é `injectMetaPixel` em
 * src/lib/useSeo.ts, a partir de `site_settings.meta_pixel_id` e **só depois
 * do aceite de cookies** (LGPD) — com `fbq.disablePushState = true`, para o
 * fbevents não contar sozinho cada pushState (o PageView saía em dobro).
 *
 * Gates deste componente, conferidos a CADA navegação/evento (não só no mount):
 *  - consentimento aceito agora (quem retirou o aceite não gera mais nada,
 *    mesmo antes do reload que limpa a página);
 *  - fora do /admin (iframe da auditoria de SEO já cai no gate de consentimento);
 *  - `window.fbq` carregado (ViewContent/Contact esperam numa fila curta).
 * Página = caminho + query: âncora (#faq) não é PageView novo.
 */
import { useEffect, useRef } from "react";
import { contactEventForHref } from "@/lib/analytics";
import { formKeyForPath, pageContentFor, reportContact, reportEngaged, reportFormStart, reportPageContent } from "@/lib/conversions";
import { isConsentAccepted } from "@/lib/cookieConsent";
import { closestElementFrom } from "@/lib/useHashRoute";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const pageKey = () => window.location.pathname + window.location.search;

/** Visitante engajado: uma vez por sessão (aba). */
const ENGAGED_KEY = "bewild_meta_engaged";
const ENGAGED_SECONDS = 60;
const TICK_SECONDS = 5;
const SCROLL_SHARE = 0.75;
/** Só conta rolagem em página com pelo menos 1,5 tela de altura. */
const MIN_PAGE_SCREENS = 1.5;

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function canTrack(): boolean {
  return isConsentAccepted() && !isAdminPath(window.location.pathname);
}

function alreadyEngaged(): boolean {
  try {
    return window.sessionStorage.getItem(ENGAGED_KEY) === "1";
  } catch {
    return false;
  }
}

function markEngaged(): void {
  try {
    window.sessionStorage.setItem(ENGAGED_KEY, "1");
  } catch {
    /* storage bloqueado: o ref do componente segura o "uma vez" */
  }
}

const IGNORED_INPUT_TYPES = new Set(["hidden", "submit", "button", "reset", "image"]);

export default function MetaPixel() {
  const lastUrlRef = useRef<string>("");
  const formStartedRef = useRef<string | null>(null);
  const engagedRef = useRef(false);
  const activeSecondsRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    lastUrlRef.current = pageKey();
    reportPageContent(pageContentFor(window.location.pathname));

    const trackRouteChange = () => {
      const nextUrl = pageKey();
      if (nextUrl === lastUrlRef.current) return;
      lastUrlRef.current = nextUrl;
      formStartedRef.current = null;
      if (!isConsentAccepted()) return;
      if (isAdminPath(window.location.pathname)) return;
      if (typeof window.fbq !== "function") return;
      window.fbq("track", "PageView");
      reportPageContent(pageContentFor(window.location.pathname));
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

    // Primeira interação com um formulário de lead/cadastro nesta página.
    const onFocusIn = (e: FocusEvent) => {
      try {
        const field = closestElementFrom(e.target)?.closest<HTMLElement>("input, textarea, select");
        if (!field || !field.closest("form")) return;
        if (field instanceof HTMLInputElement && IGNORED_INPUT_TYPES.has(field.type)) return;
        const form = formKeyForPath(window.location.pathname);
        if (!form) return;
        const key = pageKey();
        if (formStartedRef.current === key) return;
        if (!canTrack()) return;
        formStartedRef.current = key;
        reportFormStart(form);
      } catch {
        /* nunca quebra o formulário */
      }
    };

    const engage = (reason: "tempo" | "rolagem") => {
      if (engagedRef.current || alreadyEngaged()) {
        engagedRef.current = true;
        return;
      }
      if (!canTrack()) return;
      engagedRef.current = true;
      markEngaged();
      reportEngaged(reason, window.location.pathname);
    };

    // Tempo de tela ativa (aba visível), somado entre as páginas da sessão.
    const tick = window.setInterval(() => {
      if (engagedRef.current || document.visibilityState !== "visible" || !canTrack()) return;
      activeSecondsRef.current += TICK_SECONDS;
      if (activeSecondsRef.current >= ENGAGED_SECONDS) engage("tempo");
    }, TICK_SECONDS * 1000);

    let scrollFrame = 0;
    const onScroll = () => {
      if (engagedRef.current || scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        try {
          const total = document.documentElement.scrollHeight;
          const viewport = window.innerHeight;
          if (!total || !viewport || total < viewport * MIN_PAGE_SCREENS) return;
          if ((window.scrollY + viewport) / total >= SCROLL_SHARE) engage("rolagem");
        } catch {
          /* nunca quebra a rolagem */
        }
      });
    };

    window.addEventListener("popstate", trackRouteChange);
    window.addEventListener("hashchange", trackRouteChange);
    window.addEventListener("lovable:navigate", trackRouteChange);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick, true);
    document.addEventListener("focusin", onFocusIn, true);
    return () => {
      window.removeEventListener("popstate", trackRouteChange);
      window.removeEventListener("hashchange", trackRouteChange);
      window.removeEventListener("lovable:navigate", trackRouteChange);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("focusin", onFocusIn, true);
      window.clearInterval(tick);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
    };
  }, []);

  return null;
}
