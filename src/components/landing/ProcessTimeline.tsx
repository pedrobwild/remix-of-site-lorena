import { useEffect, useRef, useState } from "react";
import { Container, SectionHeading } from "./primitives";
import { STEPS } from "./content";
import { gsap } from "@/lib/gsap";

export default function ProcessTimeline() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(1);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (reduced || !isDesktop) return;

    const ctx = gsap.context(() => {
      const distance = () => track.scrollWidth - window.innerWidth + 96;
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${distance()}`,
          scrub: 0.6,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const idx = Math.min(
              STEPS.length,
              Math.max(1, Math.round(self.progress * (STEPS.length - 1)) + 1),
            );
            setActive(idx);
          },
        },
      });
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="como-funciona"
      className="scroll-mt-20 overflow-hidden bg-[#F2EEE5] py-20 sm:py-28 lg:py-0"
    >
      {/* MOBILE / TABLET — vertical timeline */}
      <div className="lg:hidden">
        <Container>
          <SectionHeading
            eyebrow="Como funciona"
            title={
              <>
                Um processo claro,{" "}
                <span className="italic text-bewild-blue">do diagnóstico à entrega.</span>
              </>
            }
          />
          <ol className="relative mt-14 grid gap-5">
            <span
              aria-hidden="true"
              className="absolute left-4 top-0 h-full w-px origin-top bg-[rgba(201,162,75,0.35)]"
              style={{ animation: "lineGrow 1.2s ease-out forwards" }}
            />
            <style>{`@keyframes lineGrow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
              @media (prefers-reduced-motion:reduce){[style*="lineGrow"]{animation:none!important;transform:none!important}}`}</style>
            {STEPS.map((step) => (
              <li
                key={step.n}
                className="relative ml-12 grid gap-4 rounded-2xl border border-bewild-line bg-white p-6 shadow-[0_24px_60px_-24px_rgba(10,37,64,0.14)]"
              >
                <span
                  aria-hidden="true"
                  className="absolute -left-12 top-7 h-2 w-2 rounded-full bg-[#C9A24B]"
                />
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-[#C9A24B]">
                    {step.n} / 07
                  </span>
                  <span className="font-display text-[5rem] font-semibold leading-none text-bewild-ink/[0.05]">
                    {step.n}
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold tracking-tight text-bewild-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-bewild-steel">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </div>

      {/* DESKTOP — horizontal pinned */}
      <div className="hidden h-screen flex-col justify-center lg:flex">
        <div className="px-12 xl:px-20">
          <div className="flex items-end justify-between gap-8 pb-10">
            <SectionHeading
              eyebrow="Como funciona"
              title={
                <>
                  Um processo claro,{" "}
                  <span className="italic text-bewild-blue">do diagnóstico à entrega.</span>
                </>
              }
            />
            <div className="flex shrink-0 items-baseline gap-3 font-mono text-[0.7rem] uppercase tracking-[0.28em] text-bewild-ink/60">
              <span className="font-display text-5xl font-semibold leading-none text-[#C9A24B]">
                {String(active).padStart(2, "0")}
              </span>
              <span>/ 07</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <span
            aria-hidden="true"
            className="absolute left-0 right-0 top-1/2 h-px bg-[rgba(201,162,75,0.3)]"
          />
          <div
            ref={trackRef}
            className="flex items-stretch gap-6 pl-12 xl:pl-20"
            style={{ width: "max-content" }}
          >
            {STEPS.map((step) => (
              <article
                key={step.n}
                className="relative flex h-[380px] w-[420px] shrink-0 flex-col justify-between overflow-hidden rounded-2xl border border-bewild-line bg-white p-8 shadow-[0_30px_80px_-32px_rgba(10,37,64,0.18)]"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-10 -right-6 font-display text-[14rem] font-semibold leading-none text-bewild-ink/[0.04]"
                >
                  {step.n}
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-[#C9A24B]">
                    {step.n} / 07
                  </span>
                  <span className="h-2 w-2 rounded-full bg-[#C9A24B]" />
                </div>
                <div className="relative">
                  <h3 className="font-display text-2xl font-semibold tracking-tight text-bewild-ink">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-[340px] text-sm leading-relaxed text-bewild-steel">
                    {step.text}
                  </p>
                </div>
              </article>
            ))}
            <div className="w-24 shrink-0" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
