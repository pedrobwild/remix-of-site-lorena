/** Fração rolada da página (0–1). */
export function fracaoRolada(): number {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (max <= 0) return 0;
  return Math.min(1, Math.max(0, window.scrollY / max));
}

/**
 * Agenda `fn` para o próximo frame, no máximo uma vez por frame, não importa
 * quantos eventos de scroll/resize cheguem. `cancel()` descarta o pendente.
 */
export function porFrame(fn: () => void): { agendar: () => void; cancel: () => void } {
  let frame = 0;
  return {
    agendar: () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        fn();
      });
    },
    cancel: () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    },
  };
}
