/**
 * useBwMotion — hooks de motion da BeWild.
 * Sprint 3 — Motion e microinterações.
 *
 * Princípios (do documento de design):
 *   - Baixa amplitude: 8–24px
 *   - Ritmo premium: 450–700ms, ease-out suave
 *   - Movimento explicativo: revelar prova, progresso, fase
 *   - Performance first: prefers-reduced-motion respeitado
 */

import { useEffect, useRef, useState, useCallback } from "react";

/* ─── Tokens ────────────────────────────────── */
export const BW_EASE = [0.22, 1, 0.36, 1] as const;
export const BW_DUR = { fast: 220, base: 480, slow: 720 } as const;
export const BW_Y   = { sm: 8, base: 16, section: 24 } as const;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ─── useInView ─────────────────────────────── */
/**
 * Retorna [ref, inView]. Dispara uma vez quando o elemento entra na viewport.
 */
export function useInView<T extends HTMLElement>(
  threshold = 0.25,
  once = true
): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null!);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) { setInView(true); return; }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true);
            if (once) obs.disconnect();
          } else if (!once) {
            setInView(false);
          }
        });
      },
      { threshold }
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
    };
  }, [threshold, once]);

  return [ref, inView];
}

/* ─── useReveal ─────────────────────────────── */
/**
 * Retorna className de reveal para um elemento.
 * Uso: <div className={reveal(inView, delay)}>
 */
export function useReveal(threshold = 0.2): {
  ref: React.RefObject<HTMLDivElement>;
  cls: (delay?: number) => string;
  inView: boolean;
} {
  const [ref, inView] = useInView<HTMLDivElement>(threshold);
  const cls = useCallback(
    (delay = 0) =>
      [
        "transition-all",
        `duration-[480ms]`,
        "ease-out",
        delay ? `delay-[${delay}ms]` : "",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
      ]
        .filter(Boolean)
        .join(" "),
    [inView]
  );
  return { ref, cls, inView };
}

/* ─── useCounter ────────────────────────────── */
/**
 * Anima um número de 0 até `target` quando inView.
 * Retorna [ref, displayValue].
 */
export function useCounter(
  target: number,
  duration = BW_DUR.slow,
  prefix = "",
  suffix = ""
): [React.RefObject<HTMLSpanElement>, string] {
  const ref = useRef<HTMLSpanElement>(null!);
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) { setValue(target); return; }

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [started, target]);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, target, duration]);

  const display = `${prefix}${value.toLocaleString("pt-BR")}${suffix}`;
  return [ref, display];
}

/* ─── useHeroReveal ─────────────────────────── */
/**
 * Retorna classes de reveal em cascata para os elementos do hero.
 * Aplica imediatamente ao montar (page load).
 */
export function useHeroReveal(): {
  eyebrow: string;
  h1: string;
  body: string;
  cta: string;
  card: string;
} {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (prefersReducedMotion()) { setMounted(true); return; }
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const base = "transition-all ease-out";
  const hidden = "opacity-0 translate-y-4";
  const show   = "opacity-100 translate-y-0";

  return {
    eyebrow: `${base} duration-[480ms] delay-[0ms]   ${mounted ? show : hidden}`,
    h1:      `${base} duration-[600ms] delay-[80ms]  ${mounted ? show : hidden}`,
    body:    `${base} duration-[500ms] delay-[200ms] ${mounted ? show : hidden}`,
    cta:     `${base} duration-[480ms] delay-[340ms] ${mounted ? show : hidden}`,
    card:    `${base} duration-[600ms] delay-[480ms] ${mounted ? show : hidden}`,
  };
}


/* ─── useParallaxHero ───────────────────────────────────────── */
/**
 * Parallax sutil na imagem do hero via GSAP ScrollTrigger.
 * A imagem sobe lentamente enquanto o usuário faz scroll.
 * speed: 0.1–0.3 (recomendado 0.15 para sutil)
 */
export function useParallaxHero<T extends HTMLElement>(
  speed = 0.15
): React.RefObject<T> {
  const ref = useRef<T>(null!);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;

    let gsap: typeof import("gsap").gsap | null = null;
    let st: { kill(): void } | null | undefined = null;

    import("../lib/gsap").then((mod) => {
      gsap = mod.gsap;
      if (!gsap) return;

      const tween = gsap.to(el, {
        yPercent: -(speed * 100),
        ease: "none",
        scrollTrigger: {
          trigger: el.closest("[data-hero]") || el.parentElement,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
      st = tween.scrollTrigger ?? null;
    });

    return () => {
      st?.kill();
    };
  }, [speed]);

  return ref;
}

/* ─── useRevealX ────────────────────────────────────────────── */
/**
 * Adiciona classe .bw-revealed ao elemento quando entra na viewport.
 * Usar com .bw-reveal-x-left / .bw-reveal-x-right no CSS.
 */
export function useRevealX<T extends HTMLElement>(
  direction: "left" | "right" = "left",
  threshold = 0.2
): [React.RefObject<T>, boolean] {
  const [ref, inView] = useInView<T>(threshold);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (inView) {
      el.classList.add("bw-revealed");
    }
  }, [inView, ref]);

  // Adiciona classe inicial de direção
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add(direction === "left" ? "bw-reveal-x-left" : "bw-reveal-x-right");
  }, [direction, ref]);

  return [ref, inView];
}

/* ─── useBwRevealObserver ──────────────────────────────────── */
/**
 * Observa todos os [data-bw-reveal] dentro de um container e adiciona
 * .bw-in quando entram na viewport, com stagger controlado por
 * data-bw-delay="100" (ms).
 * Chamar uma vez no root do layout.
 */
export function useBwRevealObserver() {
  useEffect(() => {
    if (prefersReducedMotion()) {
      document.querySelectorAll<HTMLElement>("[data-bw-reveal]").forEach(el => {
        el.classList.add("bw-in");
      });
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = parseInt(el.dataset.bwDelay ?? "0", 10);
            setTimeout(() => el.classList.add("bw-in"), delay);
            obs.unobserve(el);
          }
        });
      },
      { threshold: 0.15 }
    );

    const elements = document.querySelectorAll<HTMLElement>("[data-bw-reveal]");
    elements.forEach((el) => obs.observe(el));

    return () => obs.disconnect();
  }, []);
}
