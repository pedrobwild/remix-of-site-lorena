import { useState, useMemo } from "react";
import { Button } from "@/guia/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/guia/components/ui/sheet";
import { Menu, ChevronDown } from "lucide-react";
import bewildLogo from "@/guia/assets/bewild-logo.png.asset.json";
import { SECTIONS, PHASES } from "@/guia/data/guide-data";

interface Props {
  activeId: string;
  sectionIndex: number;
  sectionCount: number;
}

export default function MobileMenu({ activeId, sectionIndex, sectionCount }: Props) {
  const [open, setOpen] = useState(false);

  const activePhase = useMemo(() => {
    const s = SECTIONS.find((s) => s.id === activeId);
    return s?.phase ?? 0;
  }, [activeId]);

  const [openPhases, setOpenPhases] = useState<Set<number>>(new Set([activePhase]));

  // Keep active phase open
  useMemo(() => {
    if (activePhase > 0) {
      setOpenPhases((prev) => {
        const next = new Set(prev);
        next.add(activePhase);
        return next;
      });
    }
  }, [activePhase]);

  const togglePhase = (num: number) => {
    setOpenPhases((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const heroSections = SECTIONS.filter((s) => s.phase === 0);
  const sectionsByPhase = PHASES.map((p) => ({
    ...p,
    sections: SECTIONS.filter((s) => s.phase === p.number),
  }));

  const PHASE_ICONS = {
    1: SECTIONS.find((s) => s.phase === 1)?.icon,
    2: SECTIONS.find((s) => s.phase === 2)?.icon,
    3: SECTIONS.find((s) => s.phase === 3)?.icon,
    4: SECTIONS.find((s) => s.phase === 4)?.icon,
  };

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-40 glass-nav px-4 py-3 flex items-center justify-between">
      <img src={bewildLogo.url} alt="Bewild" className="h-7 w-auto" />
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground bg-muted/60 rounded-full px-2.5 py-0.5">
          {sectionIndex}/{sectionCount}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="hover:bg-muted/50 min-h-[44px] min-w-[44px]">
          <Menu size={22} />
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="px-4 pt-5 pb-3 border-b border-border/60">
            <SheetTitle className="flex items-center gap-2">
              <img src={bewildLogo.url} alt="Bewild" className="h-7 w-auto" />
            </SheetTitle>
          </SheetHeader>
          <nav className="px-3 py-4 overflow-y-auto max-h-[calc(100vh-120px)] scrollbar-thin">
            {/* Hero */}
            <ul className="space-y-0.5 mb-1">
              {heroSections.map((s) => {
                const Icon = s.icon;
                const isActive = activeId === s.id;
                return (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all min-h-[44px] ${
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      }`}
                    >
                      <Icon size={16} className="shrink-0" />
                      <span>Início</span>
                    </a>
                  </li>
                );
              })}
            </ul>

            <div className="h-px bg-border/40 mx-1 my-3" />

            {/* Phase groups */}
            {sectionsByPhase.map((phase) => {
              const isOpen = openPhases.has(phase.number);
              const isPhaseActive = activePhase === phase.number;
              const PhaseIcon = PHASE_ICONS[phase.number as keyof typeof PHASE_ICONS];

              return (
                <div key={phase.number} className="mb-1">
                  {/* Phase header */}
                  <button
                    onClick={() => togglePhase(phase.number)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all min-h-[44px] ${
                      isPhaseActive && !isOpen
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground/80 hover:text-foreground hover:bg-muted/60"
                    }`}
                  >
                    {PhaseIcon && (
                      <PhaseIcon size={16} className={`shrink-0 ${isPhaseActive ? "text-primary" : "text-muted-foreground"}`} />
                    )}
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 leading-none mb-0.5">
                        Fase {phase.number}
                      </span>
                      <span className="truncate leading-tight">{phase.label}</span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-muted-foreground/40 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Sub-items */}
                  {isOpen && (
                    <ul className="mt-0.5 mb-2 ml-4 pl-3 border-l border-border/40 space-y-0.5">
                      {phase.sections.map((s) => {
                        const Icon = s.icon;
                        const isActive = activeId === s.id;

                        const textClass = isActive
                          ? "text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground";

                        const inner = (
                          <>
                            <Icon size={14} className="shrink-0 opacity-60" />
                            <span className="truncate text-[13px]">{s.label}</span>
                          </>
                        );

                        return (
                          <li key={s.id}>
                            <a
                              href={`#${s.id}`}
                              onClick={() => setOpen(false)}
                              className={`flex items-center gap-2 px-2 py-2 rounded-md transition-all min-h-[44px] ${textClass}`}
                            >
                              {inner}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
