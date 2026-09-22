/**
 * StickyMobileCTA — barra de CTA fixa no rodapé da viewport, somente mobile.
 *
 * Comportamento:
 * - Visível apenas em viewports < 768px (CSS).
 * - Aparece após ~30% de scroll vertical da página.
 * - Esconde quando o CTA final/footer entra na viewport (para não duplicar).
 * - Altura de toque ≥ 48px, com safe-area-inset-bottom.
 * - Respeita prefers-reduced-motion (sem animação de translate).
 */
import { useEffect, useRef, useState } from "react";
import "./StickyMobileCTA.css";

type Props = {
  href?: string;
  label?: string;
  /** Seletor CSS dos elementos que, ao entrar na viewport, escondem a barra. */
  hideWhenVisibleSelector?: string;
  /** Fração de scroll (0–1) para começar a exibir. */
  threshold?: number;
};

export default function StickyMobileCTA({
  href = "/diagnostico",
  label = "Solicitar orçamento",
  hideWhenVisibleSelector = "#cta, footer",
  threshold = 0.3,
}: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [nearEnd, setNearEnd] = useState(false);
  const rafRef = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (max <= 0) return;
        setScrolled(window.scrollY / max > threshold);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [threshold]);

  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>(hideWhenVisibleSelector),
    );
    if (nodes.length === 0) return;
    const visible = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target);
          else visible.delete(e.target);
        }
        setNearEnd(visible.size > 0);
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.01 },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [hideWhenVisibleSelector]);

  const visible = scrolled && !nearEnd;

  return (
    <div
      className={`bw-sticky-cta${visible ? " is-visible" : ""}`}
      aria-hidden={!visible}
    >
      <a
        href={href}
        className="btn btn-cyan"
        tabIndex={visible ? 0 : -1}
      >
        {label} <span className="arrow" aria-hidden="true">→</span>
      </a>
    </div>
  );
}
