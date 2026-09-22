import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import bewildLogo from "@/guia/assets/bewild-logo.png.asset.json";
import { SECTIONS, PHASES } from "@/guia/data/guide-data";

interface Props {
  activeId: string;
  visitedSections: Set<string>;
}

export default function TableOfContents({ activeId, visitedSections }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Which phase is active based on current section
  const activePhase = useMemo(() => {
    const activeSection = SECTIONS.find((s) => s.id === activeId);
    return activeSection?.phase ?? 0;
  }, [activeId]);

  // Track which phases are open (auto-open active phase)
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

  // Count visited sections per phase
  const phaseProgress = (sections: readonly { id: string }[]) => {
    const visited = sections.filter((s) => visitedSections.has(s.id)).length;
    return { visited, total: sections.length };
  };

  // Phase icons (one per macro-block)
  const PHASE_ICONS = {
    1: SECTIONS.find((s) => s.phase === 1)?.icon,
    2: SECTIONS.find((s) => s.phase === 2)?.icon,
    3: SECTIONS.find((s) => s.phase === 3)?.icon,
    4: SECTIONS.find((s) => s.phase === 4)?.icon,
  };

  return (
    <nav
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen overflow-y-auto overflow-x-hidden border-r border-border/60 bg-card/95 backdrop-blur-md z-30 scrollbar-thin py-5 transition-all duration-300 ease-in-out ${
        expanded ? "w-60 px-3" : "w-[60px] px-2"
      }`}
    >
      {/* Logo */}
      <div className={`mb-5 flex items-center ${expanded ? "px-2" : "justify-center"}`}>
        {expanded ? (
          <img src={bewildLogo.url} alt="Bewild" className="h-7 w-auto" />
        ) : (
          <img
            src={bewildLogo.url}
            alt="Bewild"
            className="h-6 w-6 object-contain object-left"
            style={{ clipPath: "inset(0 60% 0 0)" }}
          />
        )}
      </div>

      <ul className="space-y-0.5 flex-1">
        {/* Hero */}
        {heroSections.map((s) => {
          const Icon = s.icon;
          const isActive = activeId === s.id;
          return (
            <li key={s.id} className="relative group">
              <a
                href={`#${s.id}`}
                className={`flex items-center gap-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                } ${expanded ? "px-3 py-2" : "px-0 py-2 justify-center"}`}
              >
                <Icon size={16} className="shrink-0" />
                {expanded && <span className="truncate text-sm whitespace-nowrap">Início</span>}
              </a>
              {!expanded && (
                <span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-foreground text-background text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  Início
                </span>
              )}
            </li>
          );
        })}

        {/* Separator */}
        <li><div className="h-px bg-border/40 mx-1 my-3" /></li>

        {/* Phase groups */}
        {sectionsByPhase.map((phase) => {
          const isOpen = openPhases.has(phase.number);
          const isPhaseActive = activePhase === phase.number;
          const progress = phaseProgress(phase.sections);
          const PhaseIcon = PHASE_ICONS[phase.number as keyof typeof PHASE_ICONS];

          return (
            <li key={phase.number}>
              {/* Phase header — clickable group toggle */}
              <button
                onClick={() => togglePhase(phase.number)}
                className={`w-full flex items-center gap-2.5 rounded-lg transition-all duration-200 group/phase ${
                  isPhaseActive && !isOpen
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground/80 hover:text-foreground hover:bg-muted/60"
                } ${expanded ? "px-3 py-2.5" : "px-0 py-2.5 justify-center"}`}
              >
                {PhaseIcon && <PhaseIcon size={16} className={`shrink-0 ${isPhaseActive ? "text-primary" : "text-muted-foreground"}`} />}
                {expanded && (
                  <>
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 leading-none mb-0.5">
                        Fase {phase.number}
                      </span>
                      <span className="truncate text-sm whitespace-nowrap leading-tight">
                        {phase.label}
                      </span>
                    </div>
                    {/* Progress indicator */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {progress.visited > 0 && (
                        <span className="text-[10px] text-muted-foreground/50 tabular-nums">
                          {progress.visited}/{progress.total}
                        </span>
                      )}
                      <ChevronDown
                        size={14}
                        className={`text-muted-foreground/40 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      />
                    </div>
                  </>
                )}
              </button>

              {/* Collapsed tooltip */}
              {!expanded && (
                <span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-foreground text-background text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {phase.label}
                </span>
              )}

              {/* Sub-items — only when expanded sidebar + open phase */}
              {expanded && isOpen && (
                <ul className="mt-0.5 mb-2 ml-4 pl-3 border-l border-border/40 space-y-0.5">
                  {phase.sections.map((s) => {
                    const Icon = s.icon;
                    const isActive = activeId === s.id;
                    const isVisited = visitedSections.has(s.id);

                    const dotClass = isActive
                      ? "bg-primary"
                      : isVisited
                      ? "bg-primary/40"
                      : "bg-muted-foreground/20";

                    const textClass = isActive
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground";

                    const inner = (
                      <>
                        <Icon size={13} className="shrink-0 opacity-60" />
                        <span className="truncate text-[13px] whitespace-nowrap">{s.label}</span>
                        {(
                          <span className={`ml-auto w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-300 ${dotClass}`} />
                        )}
                      </>
                    );

                    return (
                      <li key={s.id}>
                        <a
                          href={`#${s.id}`}
                          className={`flex items-center gap-2 rounded-md px-2 py-1.5 transition-all duration-200 ${textClass}`}
                        >
                          {inner}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Spacing between phases in collapsed mode */}
              {!expanded && phase.number < 4 && <div className="h-px bg-border/30 mx-1 my-1.5" />}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
