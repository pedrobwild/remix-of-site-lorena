import { useState } from "react";
import { Plus } from "lucide-react";
import { Container, SectionHeading } from "./primitives";
import { FAQS } from "./content";

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-20 bg-[#FBFAF8] py-20 sm:py-28">
      <Container className="max-w-[880px]">
        <SectionHeading eyebrow="FAQ" title="Perguntas frequentes" align="center" />

        <ul className="mt-12 flex flex-col gap-3">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            const btnId = `faq-trigger-${i}`;
            const panelId = `faq-panel-${i}`;
            return (
              <li
                key={item.q}
                className="overflow-hidden rounded-xl border border-bewild-line bg-white"
              >
                <button
                  type="button"
                  id={btnId}
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-bewild-bone/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bewild-blue/40"
                >
                  <span className="font-display text-base font-semibold tracking-tight text-bewild-ink">
                    {item.q}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bewild-blue/10 text-bewild-blue transition-transform duration-300 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                  </span>
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  hidden={!isOpen}
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >

                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-bewild-steel">{item.a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
