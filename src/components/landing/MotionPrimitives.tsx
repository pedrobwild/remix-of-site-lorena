/**
 * MotionPrimitives — componentes de motion reutilizáveis.
 * Sprint 3 — BeWild Design System.
 *
 * Componentes:
 *   <Reveal>         — fade-up ao entrar na viewport
 *   <RevealGroup>    — fade-up em stagger para listas de cards
 *   <ImageReveal>    — máscara vertical revela imagem
 *   <SectionReveal>  — wrapper de seção com reveal automático
 */

import { useRef, useEffect } from "react";
import { useInView } from "../../lib/useBwMotion";

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ─── Reveal ──────────────────────────────────────────────── */
interface RevealProps {
  children: React.ReactNode;
  delay?: number;      // ms
  duration?: number;   // ms
  y?: number;          // px
  className?: string;
  threshold?: number;
}

export function Reveal({
  children,
  delay = 0,
  duration = 480,
  y = 16,
  className = "",
  threshold = 0.2,
}: RevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>(threshold);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView || prefersReduced() ? 1 : 0,
        transform: inView || prefersReduced() ? "translateY(0)" : `translateY(${y}px)`,
        transition: `opacity ${duration}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform ${duration}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── RevealGroup ─────────────────────────────────────────── */
interface RevealGroupProps {
  children: React.ReactNode[];
  stagger?: number;   // ms entre cada item
  delay?: number;     // delay base
  className?: string; // classe do wrapper externo
  itemClassName?: string;
  threshold?: number;
}

export function RevealGroup({
  children,
  stagger = 80,
  delay = 0,
  className = "",
  itemClassName = "",
  threshold = 0.15,
}: RevealGroupProps) {
  const [ref, inView] = useInView<HTMLDivElement>(threshold);

  return (
    <div ref={ref} className={className}>
      {children.map((child, i) => (
        <div
          key={i}
          className={itemClassName}
          style={{
            opacity: inView || prefersReduced() ? 1 : 0,
            transform: inView || prefersReduced() ? "translateY(0)" : "translateY(16px)",
            transition: `opacity 480ms cubic-bezier(0.22,1,0.36,1) ${delay + i * stagger}ms, transform 480ms cubic-bezier(0.22,1,0.36,1) ${delay + i * stagger}ms`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

/* ─── ImageReveal ─────────────────────────────────────────── */
interface ImageRevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  threshold?: number;
}

/**
 * Máscara vertical que revela o conteúdo de cima para baixo ao entrar na viewport.
 * Usar em imagens editoriais, hero lateral, case photos.
 */
export function ImageReveal({
  children,
  delay = 0,
  className = "",
  threshold = 0.3,
}: ImageRevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>(threshold);
  const reduced = prefersReduced();

  return (
    <div
      ref={ref}
      className={`overflow-hidden ${className}`}
      style={{
        clipPath: inView || reduced
          ? "inset(0% 0% 0% 0%)"
          : "inset(0% 0% 100% 0%)",
        transition: reduced
          ? "none"
          : `clip-path 720ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {/* Leve scale de saída para o conteúdo */}
      <div
        style={{
          transform: inView || reduced ? "scale(1)" : "scale(1.04)",
          transition: reduced
            ? "none"
            : `transform 720ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ─── SectionReveal ───────────────────────────────────────── */
interface SectionRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
}

/**
 * Wrapper simples para seções — fade-up suave ao entrar na viewport.
 */
export function SectionReveal({
  children,
  className = "",
  delay = 0,
  threshold = 0.1,
}: SectionRevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>(threshold);
  const reduced = prefersReduced();

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView || reduced ? 1 : 0,
        transform: inView || reduced ? "translateY(0)" : "translateY(24px)",
        transition: reduced
          ? "none"
          : `opacity 600ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 600ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── ParallaxImage ──────────────────────────────────────────── */
interface ParallaxImageProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

/**
 * Wrapper com parallax sutil: a imagem sobe lentamente ao scroll.
 * Usa GSAP ScrollTrigger importado dinamicamente (tree-shaking safe).
 * Parent deve ter overflow-hidden e height definida.
 *
 * Exemplo:
 *   <div className="overflow-hidden h-[480px]">
 *     <ParallaxImage speed={0.15} className="w-full h-[120%]">
 *       <img src="..." className="w-full h-full object-cover" />
 *     </ParallaxImage>
 *   </div>
 */
export function ParallaxImage({
  children,
  speed = 0.15,
  className = "",
}: ParallaxImageProps) {
  const ref = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    if (prefersReduced()) return;
    const el = ref.current;
    if (!el) return;

    let cleanup: (() => void) | null = null;

    import("../../lib/gsap").then(({ gsap }) => {
      const tween = gsap.to(el, {
        yPercent: -(speed * 30),
        ease: "none",
        scrollTrigger: {
          trigger: el.closest("[data-hero-section]") || el.parentElement?.parentElement,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.2,
        },
      });
      cleanup = () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });

    return () => { cleanup?.(); };
  }, [speed]);

  return (
    <div
      ref={ref}
      className={`bw-hero-parallax ${className}`}
    >
      {children}
    </div>
  );
}

/* ─── RevealX ──────────────────────────────────────────────── */
interface RevealXProps {
  children: React.ReactNode;
  direction?: "left" | "right";
  delay?: number;
  className?: string;
  threshold?: number;
}

/**
 * Slide-in horizontal ao entrar na viewport (Guesty-style).
 * direction="left" → entra da esquerda; direction="right" → da direita.
 */
export function RevealX({
  children,
  direction = "left",
  delay = 0,
  className = "",
  threshold = 0.2,
}: RevealXProps) {
  const [ref, inView] = useInView<HTMLDivElement>(threshold);
  const reduced = prefersReduced();

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView || reduced ? 1 : 0,
        transform: inView || reduced
          ? "translateX(0)"
          : `translateX(${direction === "left" ? "-50px" : "50px"})`,
        transition: reduced
          ? "none"
          : `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
