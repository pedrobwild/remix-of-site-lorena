import { useState, useEffect, useRef, useCallback } from "react";
import { SECTIONS } from "@/guia/data/guide-data";

const STORAGE_KEY = "bwild_guide_progress";
const SAVE_INTERVAL = 3000;
const RESUME_MAX_AGE_DAYS = 7;

export interface ReadingProgress {
  scrollPercent: number;
  activeSection: string;
  visitedSections: string[];
  lastVisit: number;
}

export function useReadingProgress(activeId: string) {
  const [scrollPercent, setScrollPercent] = useState(0);
  const [visitedSections, setVisitedSections] = useState<Set<string>>(new Set());
  const [resumeData, setResumeData] = useState<ReadingProgress | null>(null);
  const visitedRef = useRef(visitedSections);
  visitedRef.current = visitedSections;

  // Track scroll percent
  useEffect(() => {
    const handler = () => {
      const pct = Math.min(100, Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      ));
      setScrollPercent(pct);
    };
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Track visited sections
  useEffect(() => {
    if (activeId) {
      setVisitedSections((prev) => {
        if (prev.has(activeId)) return prev;
        const next = new Set(prev);
        next.add(activeId);
        return next;
      });
    }
  }, [activeId]);

  // Save progress every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      const data: ReadingProgress = {
        scrollPercent,
        activeSection: activeId,
        visitedSections: Array.from(visitedRef.current),
        lastVisit: Date.now(),
      };
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {}
    }, SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [scrollPercent, activeId]);

  // Load resume data on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data: ReadingProgress = JSON.parse(raw);
      const age = Date.now() - data.lastVisit;
      if (age > RESUME_MAX_AGE_DAYS * 24 * 60 * 60 * 1000) return;
      // Only show resume if user had scrolled past the first section
      if (data.visitedSections.length > 1) {
        setResumeData(data);
        // Restore visited sections
        setVisitedSections(new Set(data.visitedSections));
      }
    } catch {}
  }, []);

  const dismissResume = useCallback(() => setResumeData(null), []);

  const sectionIndex = SECTIONS.findIndex((s) => s.id === activeId);
  const sectionCount = SECTIONS.length;

  return {
    scrollPercent,
    visitedSections,
    sectionIndex: sectionIndex + 1,
    sectionCount,
    resumeData,
    dismissResume,
  };
}
