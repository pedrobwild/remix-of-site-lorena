/**
 * MaterialLaminas — galeria de lâminas de foto expansíveis para a página
 * Be Wild Reformas. 6 lâminas: hover (real hover only) ou clique/tap expandem;
 * setas + dots-traço + auto-avanço 4.8s até a primeira interação.
 */
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface LaminaItem {
  cat: string;
  title: string;
  desc: string;
  img?: string;
  slot?: string;
}

interface Props { laminas: LaminaItem[]; }

export default function MaterialLaminas({ laminas }: Props) {
  const [active, setActive] = useState(0);
  const interactedRef = useRef(false);
  const supportsHover = useRef(false);

  useEffect(() => {
    supportsHover.current = window.matchMedia("(hover: hover)").matches;
  }, []);

  // Auto-avanço até a 1ª interação
  useEffect(() => {
    const id = window.setInterval(() => {
      if (interactedRef.current) return;
      setActive((i) => (i + 1) % laminas.length);
    }, 4800);
    return () => window.clearInterval(id);
  }, [laminas.length]);

  const setIdx = (i: number) => {
    interactedRef.current = true;
    setActive(((i % laminas.length) + laminas.length) % laminas.length);
  };

  return (
    <div>
      <div className="mboard__strip" role="tablist" aria-label="Material Board">
        {laminas.map((l, i) => (
          <div
            key={l.title}
            role="tab"
            aria-selected={i === active}
            tabIndex={0}
            className={`lamina${i === active ? " is-active" : ""}`}
            onMouseEnter={() => { if (supportsHover.current) setIdx(i); }}
            onClick={() => setIdx(i)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setIdx(i); }
              if (e.key === "ArrowRight") setIdx(active + 1);
              if (e.key === "ArrowLeft")  setIdx(active - 1);
            }}
          >
            {l.img ? (
              <img className="lamina__img" src={l.img} alt="" loading="lazy" />
            ) : (
              <div className="lamina__img" style={{ background: "linear-gradient(135deg,#16324a,#0a2540)" }} aria-hidden />
            )}
            <div className="lamina__shade" />
            <span className="lamina__cat">{l.cat}</span>
            {l.slot && <span className="lamina__slot">{l.slot}</span>}
            <span className="lamina__title-vert" aria-hidden>{l.cat}</span>
            <div className="lamina__content">
              <h3 className="lamina__title">{l.title}</h3>
              <p className="lamina__desc">{l.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mboard__dots" role="tablist" aria-label="Navegar lâminas">
        {laminas.map((l, i) => (
          <button
            key={l.title}
            className={`mboard__dot${i === active ? " is-on" : ""}`}
            aria-label={`Ir para ${l.cat}`}
            onClick={() => setIdx(i)}
          />
        ))}
      </div>
      {/* setas externas controladas pelo componente pai via window event */}
      <NavBridge onPrev={() => setIdx(active - 1)} onNext={() => setIdx(active + 1)} />
    </div>
  );
}

/** Exposes prev/next handlers via custom events for the header arrows. */
function NavBridge({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  useEffect(() => {
    const p = () => onPrev();
    const n = () => onNext();
    window.addEventListener("mboard:prev", p);
    window.addEventListener("mboard:next", n);
    return () => {
      window.removeEventListener("mboard:prev", p);
      window.removeEventListener("mboard:next", n);
    };
  }, [onPrev, onNext]);
  return null;
}

export function MaterialLaminasArrows() {
  return (
    <div className="mboard__nav">
      <button
        className="mboard__btn"
        aria-label="Lâmina anterior"
        onClick={() => window.dispatchEvent(new Event("mboard:prev"))}
      >
        <ChevronLeft size={20} />
      </button>
      <button
        className="mboard__btn"
        aria-label="Próxima lâmina"
        onClick={() => window.dispatchEvent(new Event("mboard:next"))}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
