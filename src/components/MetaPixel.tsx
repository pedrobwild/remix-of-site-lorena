/**
 * MetaPixel — dispara fbq('track','PageView') a cada mudança de rota.
 *
 * O carregador base e o `fbq('init', ...)` ficam no index.html.
 * Aqui só emitimos o PageView (inclui o primeiro load), usando o
 * roteador hash custom do projeto (`useHashRoute`).
 */
import { useEffect } from "react";
import { useHashRoute } from "../lib/useHashRoute";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export default function MetaPixel() {
  const route = useHashRoute();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof window.fbq !== "function") return;
    window.fbq("track", "PageView");
  }, [route]);

  return null;
}
