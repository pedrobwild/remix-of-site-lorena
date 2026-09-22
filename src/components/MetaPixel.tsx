/**
 * MetaPixel — dispara fbq('track','PageView') a cada mudança de rota na SPA.
 *
 * O carregador base, o `fbq('init', ...)` e o primeiro PageView **não** estão
 * no index.html (o comentário anterior dizia que sim — CODE-05, corrigido em
 * 22/09/2026; `grep -c fbq index.html` devolve 0). Quem injeta tudo isso é
 * `injectMetaPixel` em src/lib/useSeo.ts, a partir de
 * `site_settings.meta_pixel_id` e **só depois do aceite de cookies** (LGPD).
 *
 * Consequência prática: enquanto o visitante não aceita o banner, `window.fbq`
 * não existe e a guarda abaixo transforma este componente num no-op. É o
 * comportamento desejado — não mexa na ordem sem reler o gate de consentimento.
 */
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export default function MetaPixel() {
  const lastUrlRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    lastUrlRef.current = window.location.pathname + window.location.search + window.location.hash;

    const trackRouteChange = () => {
      const nextUrl = window.location.pathname + window.location.search + window.location.hash;
      if (nextUrl === lastUrlRef.current) return;
      lastUrlRef.current = nextUrl;
      if (typeof window.fbq !== "function") return;
      window.fbq("track", "PageView");
    };

    window.addEventListener("popstate", trackRouteChange);
    window.addEventListener("hashchange", trackRouteChange);
    window.addEventListener("lovable:navigate", trackRouteChange);
    return () => {
      window.removeEventListener("popstate", trackRouteChange);
      window.removeEventListener("hashchange", trackRouteChange);
      window.removeEventListener("lovable:navigate", trackRouteChange);
    };
  }, []);

  return null;
}
