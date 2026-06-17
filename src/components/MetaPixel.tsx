/**
 * MetaPixel — dispara fbq('track','PageView') a cada mudança de rota após o load inicial.
 *
 * O carregador base, o `fbq('init', ...)` e o primeiro PageView ficam no index.html.
 * Aqui emitimos apenas PageViews de navegação SPA, observando eventos do router.
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
