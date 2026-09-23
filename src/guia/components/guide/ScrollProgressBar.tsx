import { useEffect, useRef } from "react";
import { fracaoRolada, porFrame } from "@/guia/lib/scroll";

/**
 * Barra de progresso de leitura. Atualiza o DOM direto (ref + transform
 * scaleX, no máximo uma vez por frame) em vez de guardar o percentual em
 * estado: rolar a página não re-renderiza nada no React — antes, cada 1% de
 * rolagem re-renderizava a página inteira (mapa, gráficos, animações).
 *
 * `onProgress` (opcional) recebe o percentual inteiro no mesmo frame, para
 * marcos de analytics sem um segundo listener de scroll.
 */
export default function ScrollProgressBar({ onProgress }: { onProgress?: (percent: number) => void }) {
  const barRef = useRef<HTMLDivElement>(null);
  const onProgressRef = useRef(onProgress);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    const atualizar = () => {
      const f = fracaoRolada();
      if (barRef.current) barRef.current.style.transform = `scaleX(${f})`;
      onProgressRef.current?.(Math.round(f * 100));
    };
    const { agendar, cancel } = porFrame(atualizar);
    atualizar();
    window.addEventListener("scroll", agendar, { passive: true });
    window.addEventListener("resize", agendar);
    return () => {
      window.removeEventListener("scroll", agendar);
      window.removeEventListener("resize", agendar);
      cancel();
    };
  }, []);

  return (
    <div className="fixed top-0 lg:left-[60px] left-0 right-0 h-1 bg-muted z-40 overflow-hidden" aria-hidden="true">
      <div
        ref={barRef}
        className="h-full w-full origin-left bg-primary will-change-transform"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
