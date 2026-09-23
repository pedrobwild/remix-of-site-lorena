import type { KeyboardEvent } from "react";

/**
 * Props para tornar clicável, de forma acessível, um elemento que não pode
 * virar <button> (card com layout próprio, badge, pino do mapa): papel de
 * botão, foco pelo teclado e ativação com Enter/Espaço.
 *
 * Só reage a teclas no próprio elemento (não em filhos focáveis) para não
 * disparar duas vezes quando há um controle dentro do card.
 */
export function pressionavel(onActivate: () => void) {
  return {
    role: "button" as const,
    tabIndex: 0,
    onClick: onActivate,
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.target !== e.currentTarget) return;
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        onActivate();
      }
    },
  };
}
