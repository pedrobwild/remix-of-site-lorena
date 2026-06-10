/**
 * JornadaPinnedTrack — scroll horizontal pinned das 5 etapas (página /metodo-bwild).
 * Desktop: trilho horizontal com pin via GSAP ScrollTrigger.
 * Mobile (≤900px) ou prefers-reduced-motion: lista vertical com linha gold por scroll.
 */
import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "../../lib/gsap";

export interface EtapaItem {
  n: string;
  title: string;
  fase?: "1" | "2";
  desc: string;
  list: string[];
  sand?: boolean;
}

interface Props {
  etapas: EtapaItem[];
}

function StepCard({ etapa }: { etapa: EtapaItem }) {
  return (
    <article className={`step-card${etapa.sand ? " step-card--sand" : ""}`}>
      <span className="step-card__bgnum" aria-hidden="true">{etapa.n}</span>
      <div className="step-card__top">
        <span className="step-card__num">{etapa.n}</span>
        {etapa.fase && <span className="step-card__phase">FASE {etapa.fase}</span>}
      </div>
      <h3>{etapa.title}</h3>
      <p className="step-card__desc">{etapa.desc}</p>
      <ul className="step-card__list">
        {etapa.list.map((it) => <li key={it}>{it}</li>)}
      </ul>
    </article>
  );
}

export default function JornadaPinnedTrack({ etapas }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const vertWrapRef = useRef<HTMLDivElement>(null);
  const vertFillRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [mode, setMode] = useState<"pin" | "vert">("pin");

  useEffect(() => {
    const mqMobile = window.matchMedia("(max-width: 900px)");
    const mqReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const decide = () => setMode(mqMobile.matches || mqReduced.matches ? "vert" : "pin");
    decide();
    mqMobile.addEventListener("change", decide);
    mqReduced.addEventListener("change", decide);
    return () => {
      mqMobile.removeEventListener("change", decide);
      mqReduced.removeEventListener("change", decide);
    };
  }, []);

  // ── Desktop pin ─────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "pin") return;
    const wrap = wrapRef.current;
    const track = trackRef.current;
    const fill = fillRef.current;
    if (!wrap || !track || !fill) return;

    const ctx = gsap.context(() => {
      const distance = () => track.scrollWidth - window.innerWidth + window.innerWidth * 0.12;

      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: wrap,
          start: "top top",
          end: () => "+=" + distance(),
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            fill.style.width = `${(p * 100).toFixed(2)}%`;
            const idx = Math.min(etapas.length - 1, Math.floor(p * etapas.length + 0.0001));
            setActiveIdx(idx);
          },
        },
      });

      // Per-card scrub fade/scale + parallax do número gigante
      const cards = track.querySelectorAll<HTMLElement>(".step-card");
      cards.forEach((card) => {
        gsap.fromTo(
          card,
          { opacity: 0.45, scale: 0.96 },
          {
            opacity: 1, scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              containerAnimation: tween,
              start: "left center+=20%",
              end: "right center-=20%",
              scrub: true,
            },
          }
        );
        const bg = card.querySelector<HTMLElement>(".step-card__bgnum");
        if (bg) {
          gsap.fromTo(bg, { x: 0 }, {
            x: -20, ease: "none",
            scrollTrigger: {
              trigger: card, containerAnimation: tween,
              start: "left right", end: "right left", scrub: true,
            },
          });
        }
      });
    }, wrap);

    return () => ctx.revert();
  }, [mode, etapas.length]);

  // ── Mobile/reduced: linha gold preenchendo ───────────────────
  useEffect(() => {
    if (mode !== "vert") return;
    const wrap = vertWrapRef.current;
    const fill = vertFillRef.current;
    if (!wrap || !fill) return;
    const ctx = gsap.context(() => {
      gsap.to(fill, {
        height: "100%",
        ease: "none",
        scrollTrigger: {
          trigger: wrap,
          start: "top 75%",
          end: "bottom 75%",
          scrub: true,
        },
      });
    }, wrap);
    return () => ctx.revert();
  }, [mode]);

  if (mode === "vert") {
    return (
      <div ref={vertWrapRef} className="etapas-vert">
        <div className="etapas-vert__line">
          <div ref={vertFillRef} style={{ position: "absolute", inset: 0, height: 0, background: "var(--gold)" }} />
        </div>
        {etapas.map((e) => (
          <div key={e.n} className="etapas-vert__item">
            <span className="etapas-vert__dot" />
            <StepCard etapa={e} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div ref={wrapRef} className="pin-wrap">
        <div className="pin-stage">
          <div ref={trackRef} className="track">
            {etapas.map((e) => <StepCard key={e.n} etapa={e} />)}
          </div>
        </div>
      </div>
      <div className="container">
        <div className="track-progress-wrap">
          <div className="track-progress">
            <div ref={fillRef} className="track-progress__fill" />
          </div>
          <span className="track-counter">
            <strong>{String(activeIdx + 1).padStart(2, "0")}</strong> / {String(etapas.length).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}
