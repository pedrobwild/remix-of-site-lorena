/**
 * useVideoAutoplayInView — dá play() no vídeo quando entra no viewport
 * e pause() quando sai. Usado nos vídeos das LPs (/o e /p) que ficam
 * abaixo da dobra e não devem carregar/tocar até estarem visíveis.
 *
 * Com `prefers-reduced-motion: reduce` não há autoplay nem loop: o vídeo
 * fica parado no pôster e ganha os controles nativos para quem quiser dar
 * play. A preferência é acompanhada ao vivo (mudar no sistema aplica na hora).
 */
import { useEffect, useRef } from "react";
import { REDUCED_MOTION_QUERY } from "@/lib/reducedMotion";

export function useVideoAutoplayInView(threshold = 0.35) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const mq =
      typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? window.matchMedia(REDUCED_MOTION_QUERY)
        : null;
    // Estado declarado no JSX, restaurado quando a preferência some.
    const initial = { controls: el.controls, loop: el.loop };
    let io: IntersectionObserver | null = null;

    const apply = () => {
      io?.disconnect();
      io = null;

      if (mq?.matches) {
        el.pause();
        el.controls = true;
        el.loop = false;
        return;
      }

      el.controls = initial.controls;
      el.loop = initial.loop;
      if (typeof IntersectionObserver === "undefined") return;
      io = new IntersectionObserver(
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
    };

    apply();
    // Safari < 14 só tem addListener/removeListener.
    if (mq?.addEventListener) mq.addEventListener("change", apply);
    else mq?.addListener?.(apply);

    return () => {
      io?.disconnect();
      if (mq?.removeEventListener) mq.removeEventListener("change", apply);
      else mq?.removeListener?.(apply);
    };
  }, [threshold]);

  return ref;
}
