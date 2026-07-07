/**
 * useVideoAutoplayInView — dá play() no vídeo quando entra no viewport
 * e pause() quando sai. Usado nos vídeos das LPs (/o e /p) que ficam
 * abaixo da dobra e não devem carregar/tocar até estarem visíveis.
 */
import { useEffect, useRef } from "react";

export function useVideoAutoplayInView(threshold = 0.35) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const p = el.play();
            if (p && typeof p.catch === "function") p.catch(() => {});
          } else {
            el.pause();
          }
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return ref;
}
