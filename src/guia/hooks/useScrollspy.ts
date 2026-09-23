import { useState, useEffect } from "react";
import { porFrame } from "@/guia/lib/scroll";

/**
 * Seção ativa = a última cujo topo já passou da linha de ativação (15% da
 * altura da janela). No fim da página, a última seção vence.
 *
 * Recalcula no máximo uma vez por frame (scroll/resize). Os elementos são
 * guardados em cache, mas re-buscados se ainda não existiam — seções
 * carregadas sob demanda (simulador, tendências) entram no cálculo quando
 * montam.
 */
export function useScrollspy(ids: readonly string[]) {
  const [activeId, setActiveId] = useState(ids[0] ?? "");
  // Chave estável: o efeito só reinicia se a LISTA de ids mudar, não a
  // referência do array (que o chamador pode recriar a cada render).
  const key = ids.join("|");

  useEffect(() => {
    const lista = key ? key.split("|") : [];
    if (!lista.length) return;
    const cache = new Map<string, HTMLElement>();
    const elemento = (id: string) => {
      const cached = cache.get(id);
      if (cached?.isConnected) return cached;
      const el = document.getElementById(id);
      if (el) cache.set(id, el);
      return el;
    };

    const computeActive = () => {
      const activationY = window.innerHeight * 0.15;
      let bestId = lista[0];
      let bestTop = -Infinity;
      for (const id of lista) {
        const el = elemento(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= activationY && top > bestTop) {
          bestTop = top;
          bestId = id;
        }
      }
      const nearBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (nearBottom) bestId = lista[lista.length - 1];
      setActiveId((prev) => (prev === bestId ? prev : bestId));
    };

    const { agendar, cancel } = porFrame(computeActive);
    // Sincronia inicial (carga + navegação por âncora).
    computeActive();
    window.addEventListener("scroll", agendar, { passive: true });
    window.addEventListener("resize", agendar);
    return () => {
      window.removeEventListener("scroll", agendar);
      window.removeEventListener("resize", agendar);
      cancel();
    };
  }, [key]);

  return activeId;
}
