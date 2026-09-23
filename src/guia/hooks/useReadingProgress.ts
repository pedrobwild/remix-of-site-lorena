import { useState, useEffect, useRef, useCallback } from "react";
import { SECTIONS } from "@/guia/data/guide-data";
import { gravarJSON, lerJSON } from "@/guia/lib/browser";
import { fracaoRolada } from "@/guia/lib/scroll";

/**
 * Progresso de leitura do guia + convite "continuar de onde parou".
 *
 * Fica em localStorage (não sessionStorage) porque o convite vale por até 7
 * dias: sessionStorage morre ao fechar a aba, então o prazo de 7 dias nunca
 * chegava a valer. Só guarda ids de seção e um percentual — nada pessoal.
 *
 * Não há estado de percentual de rolagem aqui (a barra cuida disso sem
 * re-render). Grava quando a seção ativa muda e quando a página é ocultada
 * ou fechada (pagehide / visibilitychange) — sem timer periódico.
 */

const STORAGE_KEY = "bwild_guide_progress";
const RESUME_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface ReadingProgress {
  scrollPercent: number;
  activeSection: string;
  visitedSections: string[];
  lastVisit: number;
}

const SECTION_IDS = new Set<string>(SECTIONS.map((s) => s.id));

function isReadingProgress(v: unknown): v is ReadingProgress {
  if (!v || typeof v !== "object") return false;
  const d = v as Record<string, unknown>;
  return (
    typeof d.activeSection === "string" &&
    typeof d.lastVisit === "number" &&
    typeof d.scrollPercent === "number" &&
    Array.isArray(d.visitedSections) &&
    d.visitedSections.every((s) => typeof s === "string")
  );
}

/**
 * Lê o progresso salvo e decide se cabe o convite para retomar. Roda no
 * inicializador do estado — ANTES de qualquer efeito gravar o progresso da
 * visita atual por cima do anterior.
 */
function lerConviteDeRetomada(): ReadingProgress | null {
  const data = lerJSON("local", STORAGE_KEY, isReadingProgress);
  if (!data) return null;
  if (Date.now() - data.lastVisit > RESUME_MAX_AGE_MS) return null;
  const visitadas = data.visitedSections.filter((id) => SECTION_IDS.has(id));
  // Só convida se a pessoa tinha passado da primeira seção, a seção ainda
  // existe e a página não reabriu já rolada (o navegador restaurou a posição).
  if (visitadas.length <= 1 || !SECTION_IDS.has(data.activeSection)) return null;
  if (data.activeSection === SECTIONS[0].id || window.scrollY > 200) return null;
  return { ...data, visitedSections: visitadas };
}

export function useReadingProgress(activeId: string) {
  const [resumeData, setResumeData] = useState<ReadingProgress | null>(lerConviteDeRetomada);
  const [visitedSections, setVisitedSections] = useState<Set<string>>(
    () => new Set(resumeData?.visitedSections ?? []),
  );
  const stateRef = useRef({ activeId, visited: visitedSections });
  stateRef.current = { activeId, visited: visitedSections };

  const salvar = useCallback(() => {
    const { activeId: atual, visited } = stateRef.current;
    if (!atual) return;
    const data: ReadingProgress = {
      scrollPercent: Math.round(fracaoRolada() * 100),
      activeSection: atual,
      visitedSections: Array.from(visited),
      lastVisit: Date.now(),
    };
    gravarJSON("local", STORAGE_KEY, data);
  }, []);

  // Marca a seção como visitada.
  useEffect(() => {
    if (!activeId) return;
    setVisitedSections((prev) => (prev.has(activeId) ? prev : new Set(prev).add(activeId)));
  }, [activeId]);

  // Grava a cada troca de seção (raro: ~16 vezes na página inteira).
  useEffect(() => {
    salvar();
  }, [activeId, visitedSections, salvar]);

  // Grava ao sair/ocultar a aba (fechar, trocar de app no celular, bfcache).
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") salvar();
    };
    window.addEventListener("pagehide", salvar);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", salvar);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [salvar]);

  const dismissResume = useCallback(() => setResumeData(null), []);

  const sectionIndex = SECTIONS.findIndex((s) => s.id === activeId);

  return {
    visitedSections,
    sectionIndex: sectionIndex + 1,
    sectionCount: SECTIONS.length,
    resumeData,
    dismissResume,
  };
}
