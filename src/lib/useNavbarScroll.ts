/**
 * useNavbarScroll — navbar transparente sobre hero → cream ao scroll.
 * Extraído do padrão Guesty/Mynd: transition background-color .26s ease
 * 
 * Retorna { scrolled: boolean } para aplicar classes .bw-navbar--transparent / --scrolled
 */
import { useState, useEffect } from "react";

export function useNavbarScroll(threshold = 60): { scrolled: boolean } {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > threshold);
    // Verificar no mount
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [threshold]);

  return { scrolled };
}
