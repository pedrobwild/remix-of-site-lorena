/**
 * useHomeFx — direção de arte da home (Bewild).
 * Instala (apenas em desktop com mouse, fora de prefers-reduced-motion):
 *  - Lenis (smooth scroll) integrado com gsap.ticker (preserva sticky nativo).
 *  - Crosshair cursor (rAF, transform-only).
 *  - CTA magnético em `.bw-magnetic`.
 *  - Reveals masked (.bw-reveal) e draw-in (.bw-hair) via ScrollTrigger.
 *
 * Tudo é dinamicamente importado para não pesar o LCP. Mobile e reduced-motion
 * caem num fallback: IntersectionObserver simples liga `.in` e nada mais.
 */
import { useEffect } from "react";

type Cleanup = () => void;

const isReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const isTouch = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: none), (pointer: coarse)").matches;

function installRevealFallback(root: HTMLElement): Cleanup {
  if (typeof IntersectionObserver === "undefined") return () => {};
  const targets = root.querySelectorAll<HTMLElement>(
    ".rv, .fade, .hair, .vbloco",
  );
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
  );
  targets.forEach((el) => io.observe(el));
  return () => io.disconnect();
}

function installCrosshair(): Cleanup {
  const c = document.createElement("div");
  c.className = "bw-cursor";
  c.setAttribute("aria-hidden", "true");
  document.body.appendChild(c);

  let x = -100,
    y = -100,
    tx = -100,
    ty = -100,
    raf = 0;

  const onMove = (e: MouseEvent) => {
    tx = e.clientX;
    ty = e.clientY;
    if (!c.classList.contains("is-on")) c.classList.add("is-on");
  };
  const onOver = (e: MouseEvent) => {
    const t = e.target as HTMLElement | null;
    if (!t) return;
    if (t.closest('a, button, [data-cursor="hover"]'))
      c.classList.add("is-hover");
    else c.classList.remove("is-hover");
  };

  const render = () => {
    x += (tx - x) * 0.28;
    y += (ty - y) * 0.28;
    c.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    raf = requestAnimationFrame(render);
  };
  raf = requestAnimationFrame(render);

  window.addEventListener("mousemove", onMove, { passive: true });
  document.addEventListener("mouseover", onOver, { passive: true });

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseover", onOver);
    c.remove();
  };
}

function installMagnetic(root: HTMLElement): Cleanup {
  const targets = Array.from(
    root.querySelectorAll<HTMLElement>(".bw-magnetic"),
  );
  const cleanups: Cleanup[] = [];
  for (const el of targets) {
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * 0.18}px, ${dy * 0.22}px)`;
    };
    const onLeave = () => {
      el.style.transform = "";
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    cleanups.push(() => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      el.style.transform = "";
    });
  }
  return () => cleanups.forEach((c) => c());
}

export function useHomeFx(rootRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Sempre: fallback IO para reveals (cobre mobile e reduced-motion)
    const fallbackCleanup = installRevealFallback(root);

    if (isReduced() || isTouch()) {
      return () => fallbackCleanup();
    }

    let cancelled = false;
    const cleanups: Cleanup[] = [fallbackCleanup];

    cleanups.push(installCrosshair());
    cleanups.push(installMagnetic(root));

    // Lenis + GSAP integration (dinâmico p/ não pesar LCP)
    (async () => {
      try {
        const [{ default: Lenis }, { gsap, ScrollTrigger }] = await Promise.all([
          import("lenis"),
          import("./gsap"),
        ]);
        if (cancelled) return;

        const lenis = new Lenis({
          duration: 1.1,
          smoothWheel: true,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });
        const onScroll = () => ScrollTrigger.update();
        lenis.on("scroll", onScroll);
        const tick = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);

        // Refresh para garantir cálculo correto com smooth scroll ativo.
        ScrollTrigger.refresh();

        cleanups.push(() => {
          lenis.off("scroll", onScroll);
          lenis.destroy();
          gsap.ticker.remove(tick);
        });
      } catch {
        /* Lenis/GSAP indisponível — fallback IO já cobre os reveals. */
      }
    })();

    return () => {
      cancelled = true;
      cleanups.forEach((c) => c());
    };
  }, [rootRef]);
}
